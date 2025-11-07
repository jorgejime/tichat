
import React, { useState, useRef } from 'react';
import { transcribeAudio, parseProductsFromText } from '../services/geminiService';
import { MicIcon, StopIcon, Spinner } from './icons';

interface AudioInputProps {
  onAddProducts: (products: any[]) => void;
}

export const AudioInput: React.FC<AudioInputProps> = ({ onAddProducts }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    setTranscribedText("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            const text = await transcribeAudio(base64Audio, audioBlob.type);
            setTranscribedText(text);

            if (text) {
                const products = await parseProductsFromText(text);
                if(products.length > 0) {
                    onAddProducts(products);
                    setTranscribedText(`¡Productos agregados! Esto fue lo que entendí: "${text}"`);
                } else {
                    setTranscribedText(`No pude identificar productos en: "${text}". Intenta de nuevo, por favor.`);
                }
            } else {
                 setTranscribedText("No pude entender el audio. ¿Podrías intentarlo de nuevo?");
            }
            setIsProcessing(false);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("No se pudo acceder al micrófono. Por favor, revisa los permisos en tu navegador.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop the media stream tracks to turn off the mic indicator
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="p-4 text-center">
        <h3 className="text-lg font-medium text-gray-900">Agrega productos con tu voz</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">
            Ej: "Tengo 10 Coca-Colas a 4000 pesos, 5 paquetes de Oreos a 2500..."
        </p>
      
        {!isRecording && (
            <button
                onClick={handleStartRecording}
                disabled={isProcessing}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
            >
                <MicIcon className="w-6 h-6 mr-2" />
                {isProcessing ? 'Procesando...' : 'Empezar a Grabar'}
            </button>
        )}

        {isRecording && (
            <button
                onClick={handleStopRecording}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
            >
                <StopIcon className="w-6 h-6 mr-2" />
                Detener Grabación
            </button>
        )}
        
        {isProcessing && (
            <div className="mt-4 flex items-center justify-center text-gray-600">
                <Spinner />
                <span className="ml-2">Analizando audio...</span>
            </div>
        )}

        {transcribedText && !isProcessing && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-left text-gray-700">
                <p><strong>Transcripción:</strong> {transcribedText}</p>
            </div>
        )}
    </div>
  );
};

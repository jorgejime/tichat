
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession } from '@google/genai';
import { MicIcon, StopIcon } from './icons';

// Audio utility functions
const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
}

const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
};

export const LiveAssistantView: React.FC = () => {
    const [isActive, setIsActive] = useState(false);
    const [transcriptions, setTranscriptions] = useState<{ user: string; model: string }[]>([]);
    const [currentTurn, setCurrentTurn] = useState({ user: '', model: '' });
    
    const sessionRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();

    const startConversation = async () => {
        if (!process.env.API_KEY) return;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        setIsActive(true);
        setTranscriptions([]);
        setCurrentTurn({ user: '', model: '' });

        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

        sessionRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    if (!inputAudioContextRef.current || !streamRef.current) return;
                    mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                    scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        setCurrentTurn(prev => ({ ...prev, user: prev.user + message.serverContent.inputTranscription.text }));
                    }
                    if (message.serverContent?.outputTranscription) {
                        setCurrentTurn(prev => ({ ...prev, model: prev.model + message.serverContent.outputTranscription.text }));
                    }
                    if (message.serverContent?.turnComplete) {
                        setTranscriptions(prev => [...prev, currentTurn]);
                        setCurrentTurn({ user: '', model: '' });
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current);
                        const source = outputAudioContextRef.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContextRef.current.destination);
                        source.addEventListener('ended', () => sources.delete(source));
                        source.start(nextStartTime);
                        nextStartTime += audioBuffer.duration;
                        sources.add(source);
                    }
                },
                onerror: (e) => console.error('Live API Error:', e),
                onclose: () => stopConversation(false),
            },
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: 'Eres un asistente amigable y útil para dueños de pequeñas tiendas. Habla en español.',
            },
        });
    };
    
    const stopConversation = (shouldCloseSession = true) => {
        setIsActive(false);

        if (shouldCloseSession) {
            sessionRef.current?.then(session => session.close());
        }
        sessionRef.current = null;

        streamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();

        for (const source of sources.values()) {
          source.stop();
          sources.delete(source);
        }
        nextStartTime = 0;
    };
    
    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (isActive) {
                stopConversation();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);

    return (
        <div className="p-4 md:p-6 lg:p-8 flex flex-col items-center h-full">
            <h2 className="text-2xl font-bold text-gray-800">Asistente de Voz en Vivo</h2>
            <p className="text-gray-600 mb-6">Habla con el asistente para obtener ayuda o información.</p>

            <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-4 flex-grow">
                <div className="h-full overflow-y-auto space-y-4">
                    {transcriptions.map((turn, index) => (
                        <div key={index}>
                            <p className="text-blue-600 font-semibold">Tú: <span className="font-normal text-gray-800">{turn.user}</span></p>
                            <p className="text-indigo-600 font-semibold">Asistente: <span className="font-normal text-gray-800">{turn.model}</span></p>
                        </div>
                    ))}
                     {(currentTurn.user || currentTurn.model) && (
                        <div>
                            <p className="text-blue-600 font-semibold">Tú: <span className="font-normal text-gray-800">{currentTurn.user}</span></p>
                            <p className="text-indigo-600 font-semibold">Asistente: <span className="font-normal text-gray-800">{currentTurn.model}</span></p>
                        </div>
                    )}
                    {!isActive && transcriptions.length === 0 && (
                        <p className="text-center text-gray-500 pt-10">Presiona "Empezar" para hablar.</p>
                    )}
                </div>
            </div>

            <div className="mt-6">
                {!isActive ? (
                    <button onClick={startConversation} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-full shadow-lg hover:bg-green-700 transition-colors">
                        <MicIcon /> Empezar a Hablar
                    </button>
                ) : (
                    <button onClick={() => stopConversation()} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-full shadow-lg hover:bg-red-700 transition-colors">
                        <StopIcon /> Detener Conversación
                    </button>
                )}
            </div>
        </div>
    );
};

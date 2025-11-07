
import React, { useState, useRef } from 'react';
import { fileToBase64 } from '../utils/fileUtils';
import { analyzeVideo } from '../services/geminiService';
import { Spinner, VideoIcon } from './icons';

export const VideoView: React.FC = () => {
    const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('Describe los eventos clave en este video.');
    const [isProcessing, setIsProcessing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 20 * 1024 * 1024) { // 20MB limit
                alert("El archivo de video es demasiado grande. Por favor, elige uno de menos de 20MB.");
                return;
            }
            setSelectedVideo(file);
            setPreviewUrl(URL.createObjectURL(file));
            setAnalysisResult('');
        }
    };
    
    const handleAnalyze = async () => {
        if (!selectedVideo || !prompt) return;
        setIsProcessing(true);
        setAnalysisResult('');

        try {
            const base64Video = await fileToBase64(selectedVideo);
            const result = await analyzeVideo(base64Video, selectedVideo.type, prompt);
            setAnalysisResult(result);
        } catch (error) {
            console.error(error);
            setAnalysisResult('Hubo un error al analizar el video. Por favor, intenta de nuevo.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Analizador de Video</h2>
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 bg-gray-100"
                >
                    {previewUrl ? (
                        <video src={previewUrl} controls className="max-h-full max-w-full object-contain" />
                    ) : (
                        <div className="text-center text-gray-500">
                            <VideoIcon />
                            <p>Haz clic para subir un video (máx 20MB)</p>
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    accept="video/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">¿Qué quieres saber del video?</label>
                    <textarea
                        id="prompt"
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                
                <button
                    onClick={handleAnalyze}
                    disabled={isProcessing || !selectedVideo || !prompt}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                >
                    {isProcessing ? <Spinner /> : 'Analizar Video'}
                </button>
            </div>
            
            {(isProcessing || analysisResult) && (
                 <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-2 text-gray-800">Resultado del Análisis</h3>
                    {isProcessing ? (
                        <p className="text-gray-500">Analizando, esto puede tardar un momento...</p>
                    ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">{analysisResult}</p>
                    )}
                 </div>
            )}
        </div>
    );
};

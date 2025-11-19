import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession, FunctionDeclaration, Type } from '@google/genai';
import { MicIcon, StopIcon } from './icons';
import { Product, Sale, Customer } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

interface ActionSuggestion {
    label: string;
    icon: React.ReactNode;
    color: string;
    action: () => void;
}

interface LiveAssistantViewProps {
    products: Product[];
    sales: Sale[];
    customers: Customer[];
}

export const LiveAssistantView: React.FC<LiveAssistantViewProps> = ({ products, sales, customers }) => {
    const [isActive, setIsActive] = useState(false);
    const [transcriptions, setTranscriptions] = useState<{ user: string; model: string }[]>([]);
    const [currentTurn, setCurrentTurn] = useState({ user: '', model: '' });
    const [actionSuggestion, setActionSuggestion] = useState<ActionSuggestion | null>(null);
    
    const sessionRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();

    // --- Tools Definitions ---
    const createSupplierOrderTool: FunctionDeclaration = {
        name: 'create_supplier_order',
        description: 'Genera un pedido para proveedores. Úsalo cuando el usuario quiera pedir productos, hacer surtido, o enviar lista de compras.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                format: {
                    type: Type.STRING,
                    enum: ['pdf', 'whatsapp'],
                    description: 'Formato del pedido: "pdf" para documento, "whatsapp" para mensaje.'
                }
            },
            required: ['format']
        }
    };

    const reportDebtsTool: FunctionDeclaration = {
        name: 'report_debts',
        description: 'Genera reporte de deudores/fiados. Úsalo cuando el usuario pregunte quién debe, cuentas por cobrar o fiados.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                format: {
                    type: Type.STRING,
                    enum: ['pdf', 'whatsapp'],
                    description: 'Formato del reporte.'
                }
            },
            required: ['format']
        }
    };

    // --- Action Implementations (Preparation) ---
    const prepareSupplierPDF = () => {
        const lowStock = products.filter(p => p.quantity <= 5);
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Pedido Sugerido a Proveedores", 14, 16);
        doc.setFontSize(12);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 24);
        doc.text("Tienda: TICHAT", 14, 30);
        
        (doc as any).autoTable({
            startY: 35,
            head: [['Producto', 'Cat.', 'Stock', 'A Pedir (Sug.)']],
            body: lowStock.map(p => [p.name, p.category, p.quantity, Math.max(12, 20 - p.quantity)]),
            theme: 'grid',
        });
        
        setActionSuggestion({
            label: "Descargar Pedido PDF",
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>,
            color: "bg-red-600 hover:bg-red-700",
            action: () => doc.save('pedido_proveedores.pdf')
        });
    };

    const prepareSupplierWhatsApp = () => {
        const lowStock = products.filter(p => p.quantity <= 5);
        let message = "📋 *PEDIDO A PROVEEDORES*\nHola, necesito cotizar lo siguiente:\n\n";
        lowStock.forEach(p => {
            message += `[ ] ${p.name} (Stock: ${p.quantity})\n`;
        });
        message += "\nGracias.";
        
        setActionSuggestion({
            label: "Enviar Pedido por WhatsApp",
            icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
            color: "bg-teal-600 hover:bg-teal-700",
            action: () => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
        });
    };

    const prepareDebtsPDF = () => {
        const pendingSales = sales.filter(s => s.status === 'pending');
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Reporte de Deudores (Fiados)", 14, 16);
        doc.setFontSize(12);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 24);
        doc.text("Tienda: TICHAT", 14, 30);
        
        (doc as any).autoTable({
            startY: 35,
            head: [['Cliente', 'Fecha', 'Total']],
            body: pendingSales.map(s => {
                const customerName = customers.find(c => c.id === s.customerId)?.nickname || s.customerName;
                return [customerName, new Date(s.date).toLocaleDateString(), `$${s.total.toLocaleString('es-CO')}`];
            }),
            theme: 'grid',
        });

        const totalDebt = pendingSales.reduce((acc, s) => acc + s.total, 0);
        doc.text(`Total Deudas: $${totalDebt.toLocaleString('es-CO')}`, 14, (doc as any).lastAutoTable.finalY + 10);
        
        setActionSuggestion({
            label: "Descargar Reporte Deudas PDF",
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>,
            color: "bg-red-600 hover:bg-red-700",
            action: () => doc.save('reporte_deudas.pdf')
        });
    };

    const prepareDebtsWhatsApp = () => {
        const pendingSales = sales.filter(s => s.status === 'pending');
        let message = "📋 *REPORTE DE DEUDAS*\n\n";
        pendingSales.forEach(s => {
            const customerName = customers.find(c => c.id === s.customerId)?.nickname || s.customerName;
            message += `- ${customerName}: $${s.total.toLocaleString('es-CO')} (${new Date(s.date).toLocaleDateString()})\n`;
        });
        const totalDebt = pendingSales.reduce((acc, s) => acc + s.total, 0);
        message += `\n*Total por Cobrar: $${totalDebt.toLocaleString('es-CO')}*`;
        
        setActionSuggestion({
            label: "Enviar Reporte por WhatsApp",
            icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
            color: "bg-teal-600 hover:bg-teal-700",
            action: () => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
        });
    };

    const startConversation = async () => {
        if (!process.env.API_KEY) return;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        setIsActive(true);
        setTranscriptions([]);
        setCurrentTurn({ user: '', model: '' });
        setActionSuggestion(null);

        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

        // --- Build Context for AI ---
        const inventoryList = products.map(p => 
            `- ${p.name}: Stock ${p.quantity} ${p.unit}s, Precio $${p.price}`
        ).join('\n');

        const pendingSales = sales.filter(s => s.status === 'pending');
        const debtList = pendingSales.map(s => {
            const customerName = customers.find(c => c.id === s.customerId)?.nickname || s.customerName;
            return `- Cliente: ${customerName} debe $${s.total} (Fecha: ${new Date(s.date).toLocaleDateString()})`;
        }).join('\n');
        
        const debtsContext = debtList.length > 0 ? debtList : "No hay deudas pendientes actualmente.";
        const lowStock = products.filter(p => p.quantity <= 5).map(p => p.name).join(', ');
        const supplierContext = lowStock.length > 0 ? `Productos con stock bajo (<=5): ${lowStock}` : "Inventario saludable.";

        const systemInstruction = `
        Eres el asistente de TICHAT. Tienes acceso al inventario y deudas.
        
        INVENTARIO:
        ${inventoryList}
        DEUDAS:
        ${debtsContext}
        STOCK BAJO:
        ${supplierContext}

        REGLAS DE ORO PARA HERRAMIENTAS:
        1. Si el usuario pide "crear pedido", "hacer pedido a proveedor", "qué hace falta" -> USA 'create_supplier_order'.
        2. Si el usuario pide "quién debe", "cuentas por cobrar", "fiados" -> USA 'report_debts'.
        3. NO preguntes "¿quieres que lo haga?", HAZLO directamente si la intención es clara.
        4. Si no especifican formato (PDF o WhatsApp), asume WhatsApp por defecto para ser rápido.
        
        Responde brevemente y confirma la acción realizada.
        `;
        
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
                    
                    // Handle Tool Calls
                    if (message.toolCall) {
                        for (const fc of message.toolCall.functionCalls) {
                            let result = "Acción preparada en pantalla.";
                            const format = (fc.args as any).format || 'whatsapp';
                            
                            if (fc.name === 'create_supplier_order') {
                                if (format === 'pdf') prepareSupplierPDF();
                                else prepareSupplierWhatsApp();
                                result = `He preparado el botón para el pedido en ${format}.`;
                            } else if (fc.name === 'report_debts') {
                                if (format === 'pdf') prepareDebtsPDF();
                                else prepareDebtsWhatsApp();
                                result = `He preparado el botón para el reporte de deudas en ${format}.`;
                            }
                            
                            sessionRef.current?.then(session => {
                                session.sendToolResponse({
                                    functionResponses: [{
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: result }
                                    }]
                                });
                            });
                        }
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
                systemInstruction: systemInstruction,
                tools: [{ functionDeclarations: [createSupplierOrderTool, reportDebtsTool] }],
            },
        });
    };
    
    const stopConversation = (shouldCloseSession = true) => {
        setIsActive(false);
        setActionSuggestion(null);

        if (shouldCloseSession) {
            sessionRef.current?.then(session => session.close());
        }
        sessionRef.current = null;

        streamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }

        for (const source of sources.values()) {
          try {
             source.stop();
          } catch(e) {
             // ignore
          }
          sources.delete(source);
        }
        nextStartTime = 0;
    };
    
    useEffect(() => {
        return () => {
            if (isActive) {
                stopConversation();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);

    return (
        <div className="p-4 md:p-6 lg:p-8 flex flex-col items-center h-full relative">
            <h2 className="text-2xl font-bold text-gray-800">Asistente Inteligente de Negocio</h2>
            <p className="text-gray-600 mb-6">Tu experto en inventario, cobranzas y proveedores.</p>

            <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-4 flex-grow flex flex-col relative overflow-hidden">
                <div className="flex-grow overflow-y-auto space-y-4 pb-24">
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
                        <div className="text-center text-gray-500 pt-10 space-y-4">
                             <div className="bg-indigo-50 p-4 rounded-lg inline-block text-left mx-auto">
                                <p className="font-bold text-indigo-900 mb-2">Prueba decir:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li>"Haz un pedido a proveedores para WhatsApp"</li>
                                    <li>"Dame un PDF de los productos que faltan"</li>
                                    <li>"¿Quién me debe plata?"</li>
                                    <li>"Saca el reporte de fiados en PDF"</li>
                                </ul>
                             </div>
                        </div>
                    )}
                </div>
                
                {/* Action Button Area */}
                {actionSuggestion && (
                    <div className="absolute bottom-4 left-4 right-4 z-20 animate-slide-up">
                        <button 
                            onClick={() => {
                                actionSuggestion.action();
                                setActionSuggestion(null); // Clear after click
                            }}
                            className={`w-full flex items-center justify-center gap-3 px-6 py-4 text-white font-bold text-lg rounded-xl shadow-xl transition-transform transform hover:scale-105 active:scale-95 ${actionSuggestion.color}`}
                        >
                            {actionSuggestion.icon}
                            {actionSuggestion.label}
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-6">
                {!isActive ? (
                    <button onClick={startConversation} className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-lg rounded-full shadow-xl hover:from-indigo-700 hover:to-blue-700 transition-all transform hover:scale-105">
                        <MicIcon className="w-6 h-6"/> CONECTAR CON TIENDA
                    </button>
                ) : (
                    <button onClick={() => stopConversation()} className="flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-bold text-lg rounded-full shadow-xl hover:bg-red-700 transition-colors animate-pulse">
                        <StopIcon className="w-6 h-6"/> DESCONECTAR
                    </button>
                )}
            </div>
        </div>
    );
};
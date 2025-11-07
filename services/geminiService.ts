import { GoogleGenAI, Type, GenerateContentResponse, Part } from "@google/genai";
import { Product } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const productSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Nombre del producto (ej: Coca-Cola 1.5L)' },
        quantity: { type: Type.NUMBER, description: 'Cantidad de unidades (puede ser decimal, ej: 1.5 libras)' },
        price: { type: Type.NUMBER, description: 'Precio por unidad en pesos' },
        description: { type: Type.STRING, description: 'Presentación o detalle adicional (ej: Paquete x6)' },
        category: { type: Type.STRING, description: 'Categoría del producto (ej: Bebidas, Snacks, Lácteos, Aseo)' },
        unit: { type: Type.STRING, description: 'Unidad de medida del producto (ej: unidad, libra, gramo, paquete)'}
      },
      required: ['name', 'quantity', 'price', 'category', 'unit'],
    },
};

const productDetailsSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Nombre del producto identificado (ej: Coca-Cola 1.5L)' },
        category: { type: Type.STRING, description: 'Categoría sugerida para el producto (ej: Bebidas)' },
        unit: { type: Type.STRING, description: 'Unidad de medida común para el producto (ej: unidad, libra, paquete)' }
      },
      required: ['name', 'category', 'unit'],
    },
};

const singleProductDetailSchema = {
    type: Type.OBJECT,
    properties: {
        category: { type: Type.STRING, description: 'Categoría sugerida para el producto (ej: Bebidas)' },
        unit: { type: Type.STRING, description: 'Unidad de medida común para el producto (ej: unidad, libra, paquete)' }
    },
    required: ['category', 'unit'],
};

export const getProductDetailsFromName = async (productName: string): Promise<{category: string; unit: string}> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Para un producto llamado "${productName}" en una tienda de barrio en Colombia, ¿cuál es su categoría y unidad de medida más probable? Devuelve solo un objeto JSON con las claves "category" y "unit".`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: singleProductDetailSchema,
            }
        });
        const jsonString = response.text;
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error getting product details from name:", error);
        // Fallback to sensible defaults
        return { category: 'General', unit: 'unidad' };
    }
};

export const identifyProductsFromImage = async (base64Image: string, mimeType: string): Promise<{name: string; category: string; unit: string}[]> => {
  try {
    const imagePart = {
      inlineData: { data: base64Image, mimeType },
    };
    const textPart = {
      text: "Identifica los nombres de los productos en esta imagen de una estantería de tienda. Para cada producto, proporciona también una categoría y la unidad de medida más común (ej: unidad, libra, paquete). Devuelve la información en el formato JSON solicitado."
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: productDetailsSchema,
        }
    });
    
    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);
    return parsedData;
  } catch (error) {
    console.error("Error identifying products from image:", error);
    return [];
  }
};


export const parseProductsFromText = async (text: string): Promise<Product[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `Eres un asistente para tenderos. Extrae la información de los productos del siguiente texto, incluyendo una categoría y unidad de medida apropiada para cada uno (ej: 'Bebidas' se vende por 'unidad', 'Queso' por 'libra'). Devuélvela en formato JSON. Texto: "${text}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: productSchema,
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });
    
    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);
    return parsedData.map((p: any) => ({ ...p, id: self.crypto.randomUUID() }));
  } catch (error) {
    console.error("Error parsing products from text:", error);
    return [];
  }
};

export const analyzeShelfImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const imagePart = {
      inlineData: { data: base64Image, mimeType },
    };
    const textPart = {
      text: "Soy un tendero. Identifica los productos en esta estantería. Describe los productos que ves y para los que no puedas adivinar el precio, pregunta amigablemente por él. Responde en un tono conversacional y cercano."
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] }
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing shelf image:", error);
    return "Lo siento, tuve un problema analizando la imagen. ¿Podrías intentarlo de nuevo?";
  }
};

// FIX: Add and export the missing 'analyzeVideo' function.
export const analyzeVideo = async (base64Video: string, mimeType: string, prompt: string): Promise<string> => {
  try {
    const videoPart = {
      inlineData: { data: base64Video, mimeType },
    };
    const textPart = {
      text: prompt,
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [videoPart, textPart] }
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing video:", error);
    return "Lo siento, tuve un problema analizando el video. ¿Podrías intentarlo de nuevo?";
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    try {
        const audioPart = {
            inlineData: { data: base64Audio, mimeType },
        };
        const textPart = {
            text: "Transcribe este audio en español."
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, textPart] }
        });
        return response.text;
    } catch (error) {
        console.error("Error transcribing audio:", error);
        return "";
    }
};

export const getPriceSuggestion = async (productName: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `¿Cuál es el precio de venta al público sugerido para "${productName}" en una tienda de barrio en Colombia? Responde solo con un rango de precios o un precio aproximado.`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error getting price suggestion:", error);
        return "No pude encontrar una sugerencia.";
    }
};

export const textToSpeech = async (text: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Di amigablemente: ${text}` }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};
import React, { useState, useRef } from 'react';
import { fileToBase64 } from '../utils/fileUtils';
import { identifyProductsFromImage } from '../services/geminiService';
import { PhotoIcon, Spinner } from './icons';
import { Product } from '../types';

interface PhotoInputProps {
    onAddProducts: (products: Product[]) => void;
}

interface IdentifiedProduct {
    id: string;
    name: string;
    quantity: string;
    price: string;
    category: string;
    unit: string;
}

export const PhotoInput: React.FC<PhotoInputProps> = ({ onAddProducts }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [identifiedProducts, setIdentifiedProducts] = useState<IdentifiedProduct[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIdentifiedProducts([]); // Reset if new image is selected
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    setIdentifiedProducts([]);

    try {
      const base64Image = await fileToBase64(selectedImage);
      const results = await identifyProductsFromImage(base64Image, selectedImage.type);
      
      if (results.length > 0) {
        setIdentifiedProducts(results.map(p => ({
            id: self.crypto.randomUUID(),
            name: p.name,
            category: p.category,
            unit: p.unit,
            quantity: '',
            price: '',
        })));
      } else {
        alert("No se pudieron identificar productos en la imagen. Intenta con otra foto.");
      }

    } catch (error) {
      console.error(error);
      alert('Hubo un error al analizar la imagen. Por favor, intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleProductChange = (id: string, field: 'quantity' | 'price' | 'category' | 'unit', value: string) => {
      setIdentifiedProducts(prev => 
        prev.map(p => p.id === id ? { ...p, [field]: value } : p)
      );
  };

  const handleRemoveProduct = (id: string) => {
    setIdentifiedProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleAddProductsToInventory = () => {
      const newProducts: Product[] = identifiedProducts
        .filter(p => p.quantity && p.price && !isNaN(parseFloat(p.quantity)) && !isNaN(parseFloat(p.price)))
        .map(p => ({
            id: self.crypto.randomUUID(),
            name: p.name,
            quantity: parseFloat(p.quantity),
            price: parseFloat(p.price),
            category: p.category,
            unit: p.unit,
        }));

      if (newProducts.length > 0) {
          onAddProducts(newProducts);
      }

      // Reset state
      setSelectedImage(null);
      setPreviewUrl(null);
      setIdentifiedProducts([]);
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col items-center justify-center">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Vista previa" className="max-h-full max-w-full object-contain" />
          ) : (
            <div className="text-center text-gray-500">
              <PhotoIcon className="mx-auto h-12 w-12" />
              <p>Haz clic para subir una foto de tu estantería</p>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        {previewUrl && identifiedProducts.length === 0 && (
          <button
            onClick={handleAnalyze}
            disabled={isProcessing}
            className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {isProcessing ? <Spinner /> : 'Analizar Foto'}
          </button>
        )}
      </div>

      {isProcessing && (
        <div className="flex justify-center items-center text-gray-600 space-x-2">
            <Spinner />
            <span>Identificando productos...</span>
        </div>
      )}

      {identifiedProducts.length > 0 && (
        <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Productos Encontrados</h3>
            <p className="text-sm text-gray-500 mb-4">Completa la información para agregar al inventario.</p>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {identifiedProducts.map(product => (
                    <div key={product.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded-md">
                        <p className="col-span-12 sm:col-span-4 text-sm font-medium text-gray-800 truncate" title={product.name}>{product.name}</p>
                        <div className="col-span-6 sm:col-span-2">
                            <input type="text" placeholder="Categoría" value={product.category} onChange={(e) => handleProductChange(product.id, 'category', e.target.value)} className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"/>
                        </div>
                         <div className="col-span-6 sm:col-span-2">
                            <input type="text" placeholder="Unidad" value={product.unit} onChange={(e) => handleProductChange(product.id, 'unit', e.target.value)} className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"/>
                        </div>
                        <div className="col-span-4 sm:col-span-1">
                            <input type="number" placeholder="Cant." value={product.quantity} onChange={(e) => handleProductChange(product.id, 'quantity', e.target.value)} className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div className="col-span-6 sm:col-span-2">
                             <input type="number" placeholder="Precio" value={product.price} onChange={(e) => handleProductChange(product.id, 'price', e.target.value)} className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                        </div>
                        <div className="col-span-2 sm:col-span-1 text-right">
                            <button onClick={() => handleRemoveProduct(product.id)} className="text-red-500 hover:text-red-700 p-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={handleAddProductsToInventory}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
                Agregar Productos al Inventario
            </button>
        </div>
      )}
    </div>
  );
};
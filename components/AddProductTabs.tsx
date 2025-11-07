import React, { useState } from 'react';
import { Product } from '../types';
import { TextInput, NewProductData } from './TextInput';
import { AudioInput } from './AudioInput';
import { PhotoInput } from './PhotoInput';
import { TextIcon, MicIcon, PhotoIcon } from './icons';

interface AddProductTabsProps {
  onAddProduct: (productData: NewProductData) => void;
  onAddProducts: (products: Product[]) => void;
}

type InputMode = 'text' | 'audio' | 'photo';

export const AddProductTabs: React.FC<AddProductTabsProps> = ({ onAddProduct, onAddProducts }) => {
  const [mode, setMode] = useState<InputMode>('text');

  const handleAddSingle = (productData: NewProductData) => {
    onAddProduct(productData);
  };
  
  const handleAddMultiple = (products: Product[]) => {
    onAddProducts(products);
  };

  const tabs: { id: InputMode; name: string; icon: React.ReactNode }[] = [
    { id: 'text', name: 'Manual', icon: <TextIcon /> },
    { id: 'audio', name: 'Por Voz', icon: <MicIcon /> },
    { id: 'photo', name: 'Por Foto', icon: <PhotoIcon /> },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-1" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`${
                mode === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      <div>
        {mode === 'text' && <TextInput onAddProduct={handleAddSingle} />}
        {mode === 'audio' && <AudioInput onAddProducts={handleAddMultiple} />}
        {mode === 'photo' && <PhotoInput onAddProducts={handleAddMultiple} />}
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Product } from '../types';
import { AddProductTabs } from './AddProductTabs';
import { ProductList } from './ProductList';
import { getPriceSuggestion, getProductDetailsFromName } from '../services/geminiService';
import { NewProductData } from './TextInput';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface InventoryViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ products, setProducts }) => {
  const [priceSuggestion, setPriceSuggestion] = useState<{productId: string, suggestion: string} | null>(null);

  const handleAddProduct = (productData: NewProductData) => {
    setPriceSuggestion(null);

    const newProduct: Product = {
      ...productData,
      id: self.crypto.randomUUID(),
      category: 'Analizando...',
      unit: '...',
    };

    // Optimistic UI update: Add product to list immediately
    setProducts((prev) => [...prev, newProduct]);

    // Fetch AI details in the background
    (async () => {
      try {
        const details = await getProductDetailsFromName(productData.name);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === newProduct.id
              ? { ...p, category: details.category, unit: details.unit }
              : p
          )
        );
        
        const suggestion = await getPriceSuggestion(newProduct.name);
        setPriceSuggestion({ productId: newProduct.id, suggestion });

      } catch (error) {
        console.error("Failed to add product with AI details:", error);
        // Fallback on error
        setProducts((prev) =>
          prev.map((p) =>
            p.id === newProduct.id
              ? { ...p, category: 'General', unit: 'unidad' }
              : p
          )
        );
      }
    })();
  };
  
  const handleAddProducts = (newProducts: Product[]) => {
    setProducts((prev) => [...prev, ...newProducts]);
    setPriceSuggestion(null); // Clear suggestion when adding multiple products
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Catálogo de Productos - TICHAT", 14, 16);
    (doc as any).autoTable({
        startY: 22,
        head: [['Producto', 'Categoría', 'Cantidad', 'Unidad', 'Precio']],
        body: products.map(p => [p.name, p.category, p.quantity, p.unit, `$${p.price.toLocaleString('es-CO')}`]),
    });
    doc.save('catalogo-tichat.pdf');
  };

  const shareOnWhatsApp = () => {
    let message = "¡Hola! Este es mi catálogo de productos:\n\n";
    products.forEach(p => {
        message += `*${p.name}* (${p.category}) - ${p.quantity} ${p.unit}(s) - $${p.price.toLocaleString('es-CO')}\n`;
    });
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <AddProductTabs 
        onAddProduct={handleAddProduct} 
        onAddProducts={handleAddProducts}
      />
      
      {priceSuggestion && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
            <p className="font-bold">Sugerencia de Precio</p>
            <p>Para "{products.find(p => p.id === priceSuggestion.productId)?.name}", te sugerimos: {priceSuggestion.suggestion}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Mi Inventario</h2>
        <div className="flex space-x-2">
            <button onClick={exportToPDF} className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Exportar PDF</button>
            <button onClick={shareOnWhatsApp} className="px-3 py-1.5 text-sm font-medium text-white bg-teal-500 rounded-md hover:bg-teal-600">Compartir WhatsApp</button>
        </div>
      </div>
      
      <ProductList 
        products={products}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
      />
    </div>
  );
};
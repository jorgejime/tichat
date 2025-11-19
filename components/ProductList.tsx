import React, { useState, useMemo } from 'react';
import { Product } from '../types';

interface ProductListProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onUpdateProduct, onDeleteProduct }) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleEdit = (product: Product) => {
    setEditingProduct({ ...product });
  };

  const handleSave = () => {
    if (editingProduct) {
      onUpdateProduct(editingProduct);
      setEditingProduct(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingProduct) {
      const { name, value } = e.target;
      setEditingProduct({
        ...editingProduct,
        [name]: name === 'price' || name === 'quantity' ? parseFloat(value) || 0 : value,
      });
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col max-h-[600px]">
      {/* Sticky Header with Search */}
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-20 rounded-t-lg">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 sm:text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span>
          </div>
          <input
            type="text"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 bg-gray-50 focus:bg-white transition-colors"
            placeholder="Filtrar por nombre o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-auto flex-1">
        {products.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white">
                <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Tu inventario está vacío</h3>
                <p className="text-gray-500 mt-1">Agrega productos usando las pestañas de arriba.</p>
            </div>
        ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white">
                <p className="text-gray-500">No se encontraron productos que coincidan con "{searchTerm}"</p>
            </div>
        ) : (
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product, index) => (
                    <tr key={product.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {editingProduct?.id === product.id ? (
                        <input name="name" value={editingProduct.name} onChange={handleChange} className="border border-indigo-300 focus:ring-indigo-500 focus:border-indigo-500 rounded px-2 py-1 w-full" autoFocus />
                        ) : (
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                        {editingProduct?.id === product.id ? (
                        <input name="category" value={editingProduct.category} onChange={handleChange} className="border border-indigo-300 rounded px-2 py-1 w-full" />
                        ) : (
                        product.category === 'Analizando...'
                        ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600 italic animate-pulse">...</span>
                        : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">{product.category}</span>
                        )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingProduct?.id === product.id ? (
                            <input name="unit" value={editingProduct.unit} onChange={handleChange} className="border border-indigo-300 rounded px-2 py-1 w-full" />
                        ) : (
                            product.unit === '...'
                            ? <span className="italic text-gray-400">...</span>
                            : product.unit
                        )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                        {editingProduct?.id === product.id ? (
                        <input name="quantity" type="number" value={editingProduct.quantity} onChange={handleChange} className="border border-indigo-300 rounded px-2 py-1 w-20" />
                        ) : (
                        <div className={`text-sm font-bold ${product.quantity <= 5 ? 'text-red-600' : 'text-gray-700'}`}>
                            {product.quantity}
                            {product.quantity <= 5 && <span className="ml-1 text-xs text-red-500 font-normal">(Bajo)</span>}
                        </div>
                        )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                        {editingProduct?.id === product.id ? (
                        <input name="price" type="number" value={editingProduct.price} onChange={handleChange} className="border border-indigo-300 rounded px-2 py-1 w-28" />
                        ) : (
                        <div className="text-sm font-mono text-gray-600">${product.price.toLocaleString('es-CO')}</div>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingProduct?.id === product.id ? (
                            <button onClick={handleSave} className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded mr-2 shadow-sm">Guardar</button>
                        ) : (
                            <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900 mr-3 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors">Editar</button>
                        )}
                        {!editingProduct && (
                            <button onClick={() => onDeleteProduct(product.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        )}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        )}
      </div>
    </div>
  );
};
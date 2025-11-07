import React, { useState } from 'react';
import { Product } from '../types';

interface ProductListProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onUpdateProduct, onDeleteProduct }) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

  if (products.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-700">Tu inventario está vacío</h3>
        <p className="text-gray-500 mt-1">¡Agrega tu primer producto usando una de las opciones de arriba!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingProduct?.id === product.id ? (
                  <input name="name" value={editingProduct.name} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                ) : (
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                )}
              </td>
               <td className="px-4 py-4 whitespace-nowrap">
                {editingProduct?.id === product.id ? (
                  <input name="category" value={editingProduct.category} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                ) : (
                  product.category === 'Analizando...'
                  ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600 italic">{product.category}</span>
                  : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{product.category}</span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {editingProduct?.id === product.id ? (
                    <input name="unit" value={editingProduct.unit} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                ) : (
                    product.unit === '...'
                    ? <span className="italic text-gray-400">{product.unit}</span>
                    : product.unit
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                 {editingProduct?.id === product.id ? (
                  <input name="quantity" type="number" value={editingProduct.quantity} onChange={handleChange} className="border rounded px-2 py-1 w-20" />
                ) : (
                  <div className="text-sm text-gray-500">{product.quantity}</div>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                 {editingProduct?.id === product.id ? (
                  <input name="price" type="number" value={editingProduct.price} onChange={handleChange} className="border rounded px-2 py-1 w-28" />
                ) : (
                  <div className="text-sm text-gray-500">${product.price.toLocaleString('es-CO')}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingProduct?.id === product.id ? (
                    <button onClick={handleSave} className="text-indigo-600 hover:text-indigo-900">Guardar</button>
                ) : (
                    <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                )}
                <button onClick={() => onDeleteProduct(product.id)} className="text-red-600 hover:text-red-900 ml-4">Borrar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
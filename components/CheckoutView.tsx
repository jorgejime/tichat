import React, { useState } from 'react';
import { Product, Customer, Sale, CartItem } from '../types';

interface CheckoutViewProps {
  products: Product[];
  customers: Customer[];
  onAddCustomer: (name: string, nickname: string, phone: string, address: string, idNumber?: string, email?: string) => void;
  onAddSale: (sale: Sale) => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  selectedCustomer: Customer | null;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ 
  products, 
  customers, 
  onAddCustomer, 
  onAddSale,
  cart,
  setCart,
  selectedCustomer,
  setSelectedCustomer
}) => {
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerNickname, setNewCustomerNickname] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  const addToCart = (product: Product) => {
    if (!selectedCustomer) {
        alert("Por favor, selecciona un cliente antes de agregar productos.");
        return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.id === productId);
        if(existingItem && existingItem.cartQuantity > 1) {
            return prevCart.map((item) =>
                item.id === productId ? { ...item, cartQuantity: item.cartQuantity - 1 } : item
            );
        }
        return prevCart.filter((item) => item.id !== productId);
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustomerName && newCustomerNickname && newCustomerPhone && newCustomerAddress) {
        onAddCustomer(newCustomerName, newCustomerNickname, newCustomerPhone, newCustomerAddress);
        setNewCustomerName('');
        setNewCustomerNickname('');
        setNewCustomerPhone('');
        setNewCustomerAddress('');
        setIsAddingCustomer(false);
    }
  };

  const handleFinalizeSale = () => {
    if (!selectedCustomer || cart.length === 0) return;

    const newSale: Sale = {
        id: self.crypto.randomUUID(),
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        items: cart,
        total,
        date: new Date().toISOString(),
        status: 'pending', // Default status is now 'pending'
    };
    onAddSale(newSale);
    
    let message = `¡Hola ${selectedCustomer.name}! 👋\n\nAquí está el resumen de tu compra en TICHAT:\n\n`;
    cart.forEach(item => {
        message += `*${item.name}* (${item.cartQuantity} x $${item.price.toLocaleString('es-CO')}) = $${(item.cartQuantity * item.price).toLocaleString('es-CO')}\n`;
    });
    message += `\n*TOTAL A PAGAR: $${total.toLocaleString('es-CO')}*`;

    const encodedMessage = encodeURIComponent(message);
    // Remove non-numeric characters from phone for the URL
    const cleanPhone = selectedCustomer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Columna Izquierda: Clientes y Productos */}
      <div>
        <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Selecciona un Cliente</h2>
            {isAddingCustomer ? (
                <form onSubmit={handleSaveCustomer} className="space-y-3">
                    <input type="text" placeholder="Apodo / Identificador (Ej: Vecina María)" value={newCustomerNickname} onChange={e => setNewCustomerNickname(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" required />
                    <input type="text" placeholder="Nombre Completo (Ej: María Rodriguez)" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" required />
                    <input type="tel" placeholder="Número de WhatsApp (ej: 57300...)" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" required />
                    <input type="text" placeholder="Dirección" value={newCustomerAddress} onChange={e => setNewCustomerAddress(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm" required />
                    <div className="flex gap-2">
                        <button type="submit" className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">Guardar Cliente</button>
                        <button type="button" onClick={() => setIsAddingCustomer(false)} className="w-full py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">Cancelar</button>
                    </div>
                </form>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                        {customers.map(c => (
                            <button key={c.id} onClick={() => setSelectedCustomer(c)} className={`p-2 text-left rounded-md border ${selectedCustomer?.id === c.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                               <span className="block text-sm font-semibold truncate">{c.nickname}</span>
                               <span className={`block text-xs truncate ${selectedCustomer?.id === c.id ? 'text-indigo-200' : 'text-gray-500'}`}>{c.name}</span>
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setIsAddingCustomer(true)} className="w-full py-2 px-4 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600">+ Agregar Nuevo Cliente</button>
                </>
            )}
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 mb-4">2. Agrega Productos</h2>
        <div className={`space-y-2 max-h-96 overflow-y-auto pr-2 ${!selectedCustomer ? 'opacity-50' : ''}`}>
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow">
              <div>
                <p className="font-medium text-gray-800">{product.name}</p>
                <p className="text-sm text-gray-500">${product.price.toLocaleString('es-CO')}</p>
              </div>
              <button
                onClick={() => addToCart(product)}
                disabled={!selectedCustomer}
                className="px-4 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                Agregar
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Columna Derecha: Cuenta Actual */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
            Cuenta de: <span className="text-indigo-600">{selectedCustomer?.nickname || '...'}</span>
            {selectedCustomer && <span className="text-base font-normal text-gray-500 ml-2">({selectedCustomer.name})</span>}
        </h2>
        <div className="space-y-3 min-h-[200px]">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center pt-8">{selectedCustomer ? "Agrega productos para empezar." : "Selecciona un cliente para iniciar."}</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.cartQuantity} x ${item.price.toLocaleString('es-CO')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold">${(item.price * item.cartQuantity).toLocaleString('es-CO')}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
        <hr className="my-4"/>
        <div className="flex justify-between items-center text-2xl font-bold">
          <span>Total:</span>
          <span>${total.toLocaleString('es-CO')}</span>
        </div>
        <button
            onClick={handleFinalizeSale}
            disabled={cart.length === 0 || !selectedCustomer}
            className="mt-6 w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
        >
            Finalizar y Enviar a WhatsApp
        </button>
      </div>
    </div>
  );
};
import React, { useState, useMemo } from 'react';
import { Product, Customer, Sale, CartItem, ShopSettings } from '../types';

interface CheckoutViewProps {
  products: Product[];
  customers: Customer[];
  onAddCustomer: (name: string, nickname: string, phone: string, address: string, idNumber?: string, email?: string) => void;
  onAddSale: (sale: Sale) => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  checkoutSelection: Customer | 'anonymous' | null;
  setCheckoutSelection: React.Dispatch<React.SetStateAction<Customer | 'anonymous' | null>>;
  shopSettings: ShopSettings;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ 
  products, 
  customers, 
  onAddCustomer, 
  onAddSale,
  cart,
  setCart,
  checkoutSelection,
  setCheckoutSelection,
  shopSettings
}) => {
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerNickname, setNewCustomerNickname] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  const isAnonymousSale = checkoutSelection === 'anonymous';
  const selectedCustomer = typeof checkoutSelection === 'object' && checkoutSelection ? checkoutSelection : null;

  const categories = useMemo(() => {
      const cats = new Set(products.map(p => p.category));
      return ['Todos', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleSelectCustomer = (customer: Customer) => {
    const previousSelectionId = typeof checkoutSelection === 'object' && checkoutSelection ? checkoutSelection.id : null;
    setCheckoutSelection(customer);
    if (customer.id !== previousSelectionId) {
        setCart([]);
    }
  };

  const handleSelectAnonymous = () => {
    setCheckoutSelection('anonymous');
    if (checkoutSelection !== 'anonymous') {
        setCart([]);
    }
  };

  const addToCart = (product: Product) => {
    if (!checkoutSelection) {
        alert("Por favor, selecciona un cliente o elige 'Venta de Mostrador'.");
        return;
    }
    // Check stock
    const currentInCart = cart.find(item => item.id === product.id)?.cartQuantity || 0;
    if (currentInCart + 1 > product.quantity) {
        alert(`¡Stock insuficiente! Solo tienes ${product.quantity} unidades de ${product.name}.`);
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

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0), [cart]);

  const deliveryCost = useMemo(() => {
    if (isAnonymousSale || !selectedCustomer) {
      return 0;
    }
    if (shopSettings.hasFreeDeliveryOption && subtotal >= shopSettings.freeDeliveryThreshold) {
      return 0;
    }
    return shopSettings.deliveryFee;
  }, [isAnonymousSale, selectedCustomer, subtotal, shopSettings]);

  const finalTotal = subtotal + deliveryCost;

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
    if (cart.length === 0 || !checkoutSelection) return;

    if (isAnonymousSale) {
        const newSale: Sale = {
            id: self.crypto.randomUUID(),
            customerName: 'Cliente Anónimo',
            items: cart,
            total: subtotal,
            date: new Date().toISOString(),
            status: 'paid', // Anonymous sales are paid immediately
        };
        onAddSale(newSale);
    } else if (selectedCustomer) {
        const newSale: Sale = {
            id: self.crypto.randomUUID(),
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            items: cart,
            total: finalTotal,
            date: new Date().toISOString(),
            status: 'pending',
            deliveryFeeApplied: deliveryCost,
        };
        onAddSale(newSale);
        
        let message = `¡Hola ${selectedCustomer.name}! 👋\n\n${shopSettings.welcomeMessage}\nAquí está el resumen de tu compra en *${shopSettings.storeName}*:\n\n`;
        cart.forEach(item => {
            message += `*${item.name}* (${item.cartQuantity} x $${item.price.toLocaleString('es-CO')}) = $${(item.cartQuantity * item.price).toLocaleString('es-CO')}\n`;
        });
        message += `\nSubtotal: $${subtotal.toLocaleString('es-CO')}`;
        message += `\nCosto Domicilio: $${deliveryCost.toLocaleString('es-CO')}`;
        if (deliveryCost === 0 && shopSettings.hasFreeDeliveryOption && subtotal >= shopSettings.freeDeliveryThreshold) {
            message += ` (¡Gratis por tu compra!)`;
        }
        message += `\n\n*TOTAL A PAGAR: $${finalTotal.toLocaleString('es-CO')}*`;

        const encodedMessage = encodeURIComponent(message);
        const cleanPhone = selectedCustomer.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    }
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col md:flex-row gap-6 bg-gray-100">
      {/* Left Column: POS Interface */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
        
        {/* 1. Top Bar: Customer & Global Actions */}
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex-1 w-full">
                {isAddingCustomer ? (
                     <form onSubmit={handleSaveCustomer} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-indigo-100">
                        <input type="text" placeholder="Apodo" value={newCustomerNickname} onChange={e => setNewCustomerNickname(e.target.value)} className="w-1/4 text-sm border-gray-300 rounded" required />
                        <input type="text" placeholder="Nombre" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="w-1/4 text-sm border-gray-300 rounded" required />
                        <input type="tel" placeholder="Tel" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} className="w-1/4 text-sm border-gray-300 rounded" required />
                        <input type="text" placeholder="Dir" value={newCustomerAddress} onChange={e => setNewCustomerAddress(e.target.value)} className="w-1/4 text-sm border-gray-300 rounded" required />
                        <button type="submit" className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">Guardar</button>
                        <button type="button" onClick={() => setIsAddingCustomer(false)} className="text-gray-500">✕</button>
                    </form>
                ) : (
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide items-center">
                        <span className="font-bold text-gray-700 whitespace-nowrap">Cliente:</span>
                        <button 
                            onClick={handleSelectAnonymous} 
                            className={`flex-shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-all ${isAnonymousSale ? 'bg-gray-800 text-white shadow-md transform scale-105' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                            👤 Mostrador
                        </button>
                        {customers.map(c => (
                            <button key={c.id} onClick={() => handleSelectCustomer(c)} className={`flex-shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-all ${selectedCustomer?.id === c.id ? 'bg-indigo-600 text-white shadow-md transform scale-105' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                               {c.nickname}
                            </button>
                        ))}
                        <button onClick={() => setIsAddingCustomer(true)} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200">
                            +
                        </button>
                    </div>
                )}
            </div>
        </div>
        
        {/* 2. Product Browser */}
        <div className="flex-1 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
            {/* Search & Categories */}
            <div className="p-4 border-b border-gray-100 space-y-3 bg-white z-10">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="🔍 Buscar producto por nombre..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm text-lg"
                    />
                    <span className="absolute left-4 top-3.5 text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                selectedCategory === cat 
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Touch Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${!checkoutSelection ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                {filteredProducts.map((product) => (
                    <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        disabled={!checkoutSelection || product.quantity <= 0}
                        className="group relative flex flex-col justify-between p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left h-40 active:scale-95"
                    >
                        <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20">
                            <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                        </div>
                        
                        <div className="z-10">
                            <span className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-1 block">{product.category}</span>
                            <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-2">{product.name}</h3>
                        </div>
                        
                        <div className="flex justify-between items-end z-10 mt-2">
                             <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Precio</span>
                                <span className="font-bold text-xl text-indigo-600">${product.price.toLocaleString('es-CO')}</span>
                             </div>
                             <span className={`text-xs font-bold px-2 py-1 rounded-md ${product.quantity > 5 ? 'bg-green-100 text-green-800' : product.quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                Stock: {product.quantity}
                            </span>
                        </div>
                    </button>
                ))}
                {filteredProducts.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p className="text-lg">No encontramos productos</p>
                    </div>
                )}
                </div>
            </div>
        </div>
      </div>
      
      {/* Right Column: The "Physical" Receipt */}
      <div className="w-full md:w-96 flex flex-col shadow-2xl rounded-sm overflow-hidden relative shrink-0 transform md:rotate-1 transition-transform duration-500 hover:rotate-0" style={{ backgroundColor: '#fffdf5', fontFamily: '"Courier New", Courier, monospace' }}>
        {/* Receipt Header */}
        <div className="p-6 text-center border-b-2 border-dashed border-gray-300">
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-widest">{shopSettings.storeName}</h2>
            <p className="text-xs text-gray-500 mt-1">{shopSettings.address}</p>
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString()} - {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
        </div>

        {/* Receipt Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
          {!checkoutSelection ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-40">
                  <div className="w-16 h-16 border-4 border-gray-300 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-3xl">?</span>
                  </div>
                  <p className="text-sm text-center font-sans">Selecciona un cliente<br/>para abrir caja</p>
              </div>
          ) : cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center opacity-50">
                <p className="text-sm mb-1 font-sans">CARRITO VACÍO</p>
                <p className="text-xs font-sans">--- Esperando productos ---</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex justify-between items-start group cursor-pointer hover:bg-black hover:bg-opacity-5 p-1 rounded">
                <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 uppercase">{item.name}</p>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>{item.cartQuantity} x ${item.price.toLocaleString('es-CO')}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end pl-2">
                    <span className="text-sm font-bold text-gray-900">${(item.price * item.cartQuantity).toLocaleString('es-CO')}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="text-red-500 hover:text-red-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity font-sans font-bold">
                        [X]
                    </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Receipt Footer */}
        <div className="p-6 border-t-2 border-dashed border-gray-300 bg-gray-50 bg-opacity-50">
            <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-gray-600">
                    <span>SUBTOTAL.</span>
                    <span>${subtotal.toLocaleString('es-CO')}</span>
                </div>
                {selectedCustomer && !isAnonymousSale && (
                    <div className="flex justify-between text-gray-600">
                        <span>DOMICILIO..</span>
                        <span>{deliveryCost === 0 ? 'GRATIS' : `$${deliveryCost.toLocaleString('es-CO')}`}</span>
                    </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 border-t-2 border-gray-800 pt-2 mt-2">
                    <span>TOTAL</span>
                    <span>${finalTotal.toLocaleString('es-CO')}</span>
                </div>
            </div>
            
            <button
                onClick={handleFinalizeSale}
                disabled={cart.length === 0 || !checkoutSelection}
                className={`w-full py-4 rounded-none text-base font-bold text-white uppercase tracking-widest transition-all
                    ${cart.length === 0 || !checkoutSelection 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gray-900 hover:bg-black shadow-lg'
                    }
                `}
                style={{ fontFamily: 'Inter, sans-serif' }} // Button back to sans-serif for readability
            >
                {isAnonymousSale ? 'COBRAR (EFECTIVO)' : 'COBRAR Y ENVIAR'}
            </button>
            <div className="text-center mt-4 text-xs text-gray-400">
                *** GRACIAS POR SU COMPRA ***
            </div>
        </div>
        
        {/* Jagged Edge Effect (CSS Trick) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white" style={{
            backgroundImage: 'linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
            backgroundSize: '10px 10px',
            backgroundRepeat: 'repeat-x'
        }}></div>
      </div>
    </div>
  );
};
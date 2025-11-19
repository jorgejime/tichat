
import React, { useState, useEffect } from 'react';
import { Product, AppView, Customer, Sale, SaleStatus, WhatsAppOrder, CartItem, ShopSettings } from './types';
import { InventoryIcon, CheckoutIcon, DashboardIcon, AssistantIcon, ClientsIcon, SettingsIcon } from './components/icons';
import { InventoryView } from './components/InventoryView';
import { CheckoutView } from './components/CheckoutView';
import { DashboardView } from './components/DashboardView';
import { LiveAssistantView } from './components/LiveAssistantView';
import { ClientsView } from './components/ClientsView';
import { SettingsView } from './components/SettingsView';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { parseProductsFromText } from './services/geminiService'; // Re-use Gemini logic

const sampleProducts: Product[] = [
    { id: '1', name: 'Papas Margarita Pollo 25g', quantity: 20, price: 1500, category: 'Snacks', unit: 'unidad' },
    { id: '2', name: 'Gaseosa Postobón Manzana 2L', quantity: 12, price: 4500, category: 'Bebidas', unit: 'unidad' },
    { id: '3', name: 'Chocoramo', quantity: 30, price: 2000, category: 'Postres', unit: 'unidad' },
    { id: '4', name: 'Queso Campesino', quantity: 5, price: 8000, category: 'Lácteos', unit: 'libra' },
    { id: '5', name: 'Leche Colanta 1L', quantity: 15, price: 3200, category: 'Lácteos', unit: 'unidad' },
    { id: '6', name: 'Pan Tajado Bimbo', quantity: 8, price: 5000, category: 'Panadería', unit: 'unidad' },
];

const sampleCustomers: Customer[] = [
    { id: '1', name: 'María Rodriguez', nickname: 'Vecina María', phone: '573001234567', address: 'Calle Falsa 123', email: 'maria@email.com', idNumber: '12345678' },
    { id: '2', name: 'José González', nickname: 'Don José', phone: '573017654321', address: 'Avenida Siempre Viva 742' },
];

const sampleWhatsAppOrders: WhatsAppOrder[] = [
  {
    id: 'wa-1',
    customerPhone: '573001234567',
    customerName: 'Vecina María',
    originalMessage: 'Vecina, buen día, me puede mandar dos leches y un pan tajado porfa. Gracias!',
    parsedItems: [
      { ...sampleProducts.find(p => p.id === '5')!, cartQuantity: 2 },
      { ...sampleProducts.find(p => p.id === '6')!, cartQuantity: 1 },
    ],
    status: 'pending',
    receivedAt: new Date().toISOString(),
  }
];

const initialShopSettings: ShopSettings = {
  storeName: "Mi Tienda de Barrio",
  address: "Calle Falsa 123, Bogotá",
  welcomeMessage: "¡Gracias por tu compra! Tu pedido está en camino.",
  openingTime: "08:00",
  closingTime: "20:00",
  deliveryFee: 3000,
  deliveryStaffCount: 2,
  hasFreeDeliveryOption: true,
  freeDeliveryThreshold: 50000,
};

function App() {
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [customers, setCustomers] = useState<Customer[]>(sampleCustomers);
  const [sales, setSales] = useState<Sale[]>([]);
  const [whatsAppOrders, setWhatsAppOrders] = useState<WhatsAppOrder[]>(sampleWhatsAppOrders);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(initialShopSettings);
  const [view, setView] = useState<AppView>('dashboard');
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  // State for the checkout view
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutSelection, setCheckoutSelection] = useState<Customer | 'anonymous' | null>(null);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!isSupabaseConfigured()) {
        console.log("Supabase not configured. Using sample data.");
        return;
    }

    setSupabaseConnected(true);

    const channel = supabase
      .channel('whatsapp-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
        async (payload) => {
          console.log('New WhatsApp message received:', payload);
          const newMessage = payload.new;
          
          // Process the text with Gemini to extract products
          let parsedItems: CartItem[] = [];
          try {
              // Only parse if we have products loaded to match against
              const extractedData = await parseProductsFromText(newMessage.message_body);
              
              // Match extracted items with existing inventory
              parsedItems = extractedData.map(extracted => {
                  // Simple fuzzy match or direct match logic could go here
                  // For now, we map to a generic item but try to find match by name
                  const existing = products.find(p => p.name.toLowerCase().includes(extracted.name.toLowerCase()));
                  if (existing) {
                      return { ...existing, cartQuantity: extracted.quantity };
                  }
                  // If not found, return as a temporary item (handling this would require more robust logic)
                  return {
                      id: self.crypto.randomUUID(),
                      name: extracted.name,
                      price: extracted.price,
                      quantity: 999, // Virtual stock
                      category: extracted.category,
                      unit: extracted.unit,
                      cartQuantity: extracted.quantity
                  };
              });
          } catch (e) {
              console.error("Error parsing incoming WhatsApp message:", e);
          }

          const newOrder: WhatsAppOrder = {
              id: newMessage.id || self.crypto.randomUUID(),
              customerPhone: newMessage.from_phone,
              customerName: newMessage.profile_name || newMessage.from_phone,
              originalMessage: newMessage.message_body,
              parsedItems: parsedItems,
              status: 'pending',
              receivedAt: newMessage.created_at || new Date().toISOString(),
          };

          setWhatsAppOrders(prev => [newOrder, ...prev]);
          // Optional: Play a sound here
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [products]);

  const handleUpdateSettings = (newSettings: ShopSettings) => {
    setShopSettings(newSettings);
  };

  const handleAddCustomer = (name: string, nickname: string, phone: string, address: string, idNumber?: string, email?: string) => {
    const newCustomer: Customer = {
      id: self.crypto.randomUUID(),
      name,
      nickname,
      phone,
      address,
      idNumber: idNumber || undefined,
      email: email || undefined,
    };
    setCustomers(prev => [...prev, newCustomer]);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  };
  
  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
  };

  const handleAddSale = (sale: Sale) => {
    // 1. Add sale to history
    setSales(prev => [...prev, sale]);
    
    // 2. Update product inventory based on the sale
    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      for (const item of sale.items) {
        const productIndex = updatedProducts.findIndex(p => p.id === item.id);
        if (productIndex > -1) {
          // Ensure quantity doesn't go below zero
          const newQuantity = updatedProducts[productIndex].quantity - item.cartQuantity;
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            quantity: Math.max(0, newQuantity),
          };
        }
      }
      return updatedProducts;
    });

    // 3. Reset checkout state after sale
    setCart([]);
    setCheckoutSelection(null);
  };

  const handleUpdateSaleStatus = (saleId: string, status: SaleStatus) => {
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, status } : s));
  };

  const handleConfirmWhatsAppOrder = (orderId: string) => {
    const order = whatsAppOrders.find(o => o.id === orderId);
    if (!order) return;

    // Find customer by phone, or use a placeholder
    const customer = customers.find(c => c.phone === order.customerPhone) || null;
    
    setCheckoutSelection(customer);
    setCart(order.parsedItems);
    
    // Update order status
    setWhatsAppOrders(prev => prev.map(o => o.id === orderId ? {...o, status: 'confirmed'} : o));

    // Switch to checkout view
    setView('checkout');
  };

  const handleRejectWhatsAppOrder = (orderId: string) => {
     setWhatsAppOrders(prev => prev.map(o => o.id === orderId ? {...o, status: 'rejected'} : o));
  };

  const hasPendingWhatsAppOrders = whatsAppOrders.some(o => o.status === 'pending');

  const renderView = () => {
    switch (view) {
      case 'inventory':
        return <InventoryView products={products} setProducts={setProducts} />;
      case 'checkout':
        return <CheckoutView 
                  products={products} 
                  customers={customers} 
                  onAddCustomer={handleAddCustomer} 
                  onAddSale={handleAddSale}
                  cart={cart}
                  setCart={setCart}
                  checkoutSelection={checkoutSelection}
                  setCheckoutSelection={setCheckoutSelection}
                  shopSettings={shopSettings}
                />;
      case 'dashboard':
        return <DashboardView 
                  products={products} 
                  sales={sales} 
                  onUpdateSaleStatus={handleUpdateSaleStatus}
                  whatsAppOrders={whatsAppOrders}
                  onConfirmWhatsAppOrder={handleConfirmWhatsAppOrder}
                  onRejectWhatsAppOrder={handleRejectWhatsAppOrder}
                />;
      case 'assistant':
        return <LiveAssistantView products={products} sales={sales} customers={customers} />;
      case 'clients':
        return <ClientsView 
                  customers={customers} 
                  onAddCustomer={handleAddCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                  onDeleteCustomer={handleDeleteCustomer} 
                />;
      case 'settings':
        return <SettingsView settings={shopSettings} onUpdateSettings={handleUpdateSettings} />;
      default:
        return <InventoryView products={products} setProducts={setProducts} />;
    }
  };

  const NavButton = ({ targetView, icon, label }: { targetView: AppView, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setView(targetView)}
      className={`relative flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 px-2 py-2 w-full text-sm font-medium rounded-md transition-colors ${
        view === targetView
          ? 'bg-indigo-700 text-white'
          : 'text-indigo-100 hover:bg-indigo-500 hover:bg-opacity-75'
      }`}
    >
      {icon}
      <span>{label}</span>
      {targetView === 'dashboard' && hasPendingWhatsAppOrders && (
        <span className="absolute top-1 right-1 md:top-1/2 md:-translate-y-1/2 md:right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-indigo-600"></span>
      )}
    </button>
  );

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col md:flex-row">
      <header className="bg-indigo-600 text-white md:w-64 p-4 space-y-4 flex flex-col">
        <div className="flex items-center gap-3">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></svg>
            <h1 className="text-2xl font-bold">TICHAT</h1>
        </div>
        
        {!supabaseConnected && (
            <div className="bg-indigo-800 p-2 rounded text-xs text-indigo-200 mb-2">
                Modo Demo (Offline)<br/>
                <span className="text-[10px] opacity-75">Configura Supabase para activar WhatsApp Real</span>
            </div>
        )}

        <nav className="flex-grow">
            <div className="flex md:flex-col md:space-y-2 justify-around md:justify-start">
                <NavButton targetView="dashboard" icon={<DashboardIcon />} label="Dashboard" />
                <NavButton targetView="inventory" icon={<InventoryIcon />} label="Inventario" />
                <NavButton targetView="checkout" icon={<CheckoutIcon />} label="Cajero Rápido" />
                <NavButton targetView="clients" icon={<ClientsIcon />} label="Clientes" />
                <NavButton targetView="assistant" icon={<AssistantIcon />} label="Asistente" />
                <NavButton targetView="settings" icon={<SettingsIcon />} label="Configuración" />
            </div>
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
}

export default App;

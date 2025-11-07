import React, { useState } from 'react';
import { Product, AppView, Customer, Sale, SaleStatus, WhatsAppOrder, CartItem } from './types';
import { InventoryIcon, CheckoutIcon, DashboardIcon, AssistantIcon, ClientsIcon } from './components/icons';
import { InventoryView } from './components/InventoryView';
import { CheckoutView } from './components/CheckoutView';
import { DashboardView } from './components/DashboardView';
import { LiveAssistantView } from './components/LiveAssistantView';
import { ClientsView } from './components/ClientsView';


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

function App() {
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [customers, setCustomers] = useState<Customer[]>(sampleCustomers);
  const [sales, setSales] = useState<Sale[]>([]);
  const [whatsAppOrders, setWhatsAppOrders] = useState<WhatsAppOrder[]>(sampleWhatsAppOrders);
  const [view, setView] = useState<AppView>('dashboard');

  // State lifted from CheckoutView
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);


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
    setSales(prev => [...prev, sale]);
    // Reset checkout state after sale
    setCart([]);
    setSelectedCustomer(null);
  };

  const handleUpdateSaleStatus = (saleId: string, status: SaleStatus) => {
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, status } : s));
  };

  const handleConfirmWhatsAppOrder = (orderId: string) => {
    const order = whatsAppOrders.find(o => o.id === orderId);
    if (!order) return;

    // Find customer by phone, or use a placeholder
    const customer = customers.find(c => c.phone === order.customerPhone) || null;
    
    setSelectedCustomer(customer);
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
                  selectedCustomer={selectedCustomer}
                  setSelectedCustomer={setSelectedCustomer}
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
        return <LiveAssistantView />;
      case 'clients':
        return <ClientsView 
                  customers={customers} 
                  onAddCustomer={handleAddCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                  onDeleteCustomer={handleDeleteCustomer} 
                />;
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
        <nav className="flex-grow">
            <div className="flex md:flex-col md:space-y-2 justify-around md:justify-start">
                <NavButton targetView="dashboard" icon={<DashboardIcon />} label="Dashboard" />
                <NavButton targetView="inventory" icon={<InventoryIcon />} label="Inventario" />
                <NavButton targetView="checkout" icon={<CheckoutIcon />} label="Cajero Rápido" />
                <NavButton targetView="clients" icon={<ClientsIcon />} label="Clientes" />
                <NavButton targetView="assistant" icon={<AssistantIcon />} label="Asistente" />
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
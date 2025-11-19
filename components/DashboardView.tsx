import React, { useState, useMemo } from 'react';
import { Product, Sale, SaleStatus, WhatsAppOrder } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardViewProps {
  products: Product[];
  sales: Sale[];
  whatsAppOrders: WhatsAppOrder[];
  onUpdateSaleStatus: (saleId: string, status: SaleStatus) => void;
  onConfirmWhatsAppOrder: (orderId: string) => void;
  onRejectWhatsAppOrder: (orderId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  products, 
  sales, 
  onUpdateSaleStatus,
  whatsAppOrders,
  onConfirmWhatsAppOrder,
  onRejectWhatsAppOrder 
}) => {
  const [statusFilter, setStatusFilter] = useState<SaleStatus | 'all'>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);
  
  const paidSales = useMemo(() => sales.filter(s => s.status === 'paid'), [sales]);

  const totalConfirmedRevenue = paidSales.reduce((sum, s) => sum + s.total, 0);

  const totalUnitsSold = useMemo(() => 
    paidSales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.cartQuantity, 0), 0)
  , [paidSales]);

  const averageSaleValue = paidSales.length > 0 ? totalConfirmedRevenue / paidSales.length : 0;

  const topProductsByStock = [...products].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  
  // Identify low stock products - Threshold 5
  const lowStockProducts = useMemo(() => {
      return products.filter(p => p.quantity <= 5).sort((a, b) => a.quantity - b.quantity);
  }, [products]);

  const bestSellingProducts = useMemo(() => {
    const productSales: { [key: string]: { name: string, unitsSold: number } } = {};

    paidSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = { name: item.name, unitsSold: 0 };
        }
        productSales[item.id].unitsSold += item.cartQuantity;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);
  }, [paidSales]);

  const recentSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  
  const uniqueCustomers = useMemo(() => {
    const customerSales = sales.filter(s => s.customerId); // Exclude anonymous sales
    return [...new Map(customerSales.map(s => [s.customerId, { id: s.customerId, name: s.customerName }])).values()];
  }, [sales]);

  const filteredSales = useMemo(() => {
    return sales
      .filter(sale => {
        if (statusFilter !== 'all' && sale.status !== statusFilter) return false;
        
        if (customerFilter !== 'all') {
            if (customerFilter === 'anonymous') {
                if (sale.customerId) return false; // Only show sales without a customerId
            } else {
                if (sale.customerId !== customerFilter) return false; // Filter by specific customer
            }
        }

        if (startDate) {
            const saleDate = new Date(sale.date);
            saleDate.setHours(0,0,0,0);
            const filterDate = new Date(startDate);
            filterDate.setHours(0,0,0,0); // Adjust for timezone
            if (saleDate < filterDate) return false;
        }
        if (endDate) {
            const saleDate = new Date(sale.date);
            saleDate.setHours(0,0,0,0);
            const filterDate = new Date(endDate);
            filterDate.setHours(0,0,0,0); // Adjust for timezone
            if (saleDate > filterDate) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, statusFilter, customerFilter, startDate, endDate]);

  const pendingWhatsAppOrders = useMemo(() => {
    return whatsAppOrders.filter(o => o.status === 'pending');
  }, [whatsAppOrders]);


  const getStatusBadge = (status: SaleStatus) => {
      switch (status) {
          case 'paid': return 'bg-green-100 text-green-800';
          case 'pending': return 'bg-yellow-100 text-yellow-800';
          case 'annulled': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  }

  const statusTranslations: Record<SaleStatus, string> = {
    pending: 'Pendiente',
    paid: 'Pagado',
    annulled: 'Anulado'
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h2>
        <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Critical Action Center */}
      {(pendingWhatsAppOrders.length > 0 || lowStockProducts.length > 0) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* WhatsApp Orders Card */}
          {pendingWhatsAppOrders.length > 0 && (
            <div className="bg-indigo-600 rounded-xl shadow-xl overflow-hidden text-white relative">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-xl flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                      Pedidos Pendientes ({pendingWhatsAppOrders.length})
                   </h3>
                   <span className="animate-ping inline-flex h-3 w-3 rounded-full bg-white"></span>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {pendingWhatsAppOrders.map(order => (
                    <div key={order.id} className="bg-indigo-700 bg-opacity-50 p-4 rounded-lg border border-indigo-500 backdrop-blur-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-lg">{order.customerName}</p>
                          <p className="text-indigo-200 text-xs">Hace un momento</p>
                        </div>
                         <div className="flex gap-2">
                            <button onClick={() => onRejectWhatsAppOrder(order.id)} className="p-2 bg-indigo-800 hover:bg-red-600 rounded transition-colors" title="Rechazar">✕</button>
                            <button onClick={() => onConfirmWhatsAppOrder(order.id)} className="p-2 bg-white text-indigo-700 hover:bg-green-400 hover:text-white rounded font-bold transition-colors flex items-center gap-1">
                                Atender ➜
                            </button>
                         </div>
                      </div>
                      <p className="text-sm text-indigo-100 italic">"{order.originalMessage}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Low Stock Card */}
          {lowStockProducts.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
                  <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-red-800 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                          Alerta de Stock ({lowStockProducts.length})
                      </h3>
                      <button className="text-xs font-bold text-red-600 hover:text-red-800 uppercase tracking-wider">Ver todo</button>
                  </div>
                  <div className="p-0">
                      <table className="min-w-full">
                          <tbody className="divide-y divide-gray-100">
                              {lowStockProducts.slice(0, 5).map(p => (
                                  <tr key={p.id} className="hover:bg-red-50 transition-colors">
                                      <td className="px-6 py-3 text-sm text-gray-800 font-medium">{p.name}</td>
                                      <td className="px-6 py-3 text-right">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Quedan {p.quantity}
                                        </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      {lowStockProducts.length > 5 && (
                          <div className="p-2 text-center text-xs text-gray-400 bg-gray-50">
                              + {lowStockProducts.length - 5} productos más
                          </div>
                      )}
                  </div>
              </div>
          )}
      </div>
      )}

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
            { label: 'Productos', value: totalProducts, icon: '📦', color: 'bg-blue-50 text-blue-600' },
            { label: 'Stock Total', value: totalUnits.toLocaleString('es-CO'), icon: '📊', color: 'bg-purple-50 text-purple-600' },
            { label: 'Ventas', value: `$${totalConfirmedRevenue.toLocaleString('es-CO')}`, icon: '💰', color: 'bg-green-50 text-green-600' },
            { label: 'Uds. Vendidas', value: totalUnitsSold.toLocaleString('es-CO'), icon: '🛍️', color: 'bg-orange-50 text-orange-600' },
            { label: 'Ticket Promedio', value: `$${averageSaleValue.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: '📈', color: 'bg-pink-50 text-pink-600' }
        ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 ${stat.color}`}>
                    {stat.icon}
                </div>
                <div>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
            </div>
        ))}
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-6">Inventario (Más Stock)</h3>
            {products.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProductsByStock} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#9ca3af'}} interval={0} angle={-20} textAnchor="end" height={60} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} />
                <Tooltip 
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                    formatter={(value) => [`${(value as number).toLocaleString('es-CO')} uds.`, 'Cantidad']} 
                />
                <Bar dataKey="quantity" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
            </ResponsiveContainer>
            ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">Sin datos</div>
            )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-6">Más Vendidos</h3>
            {bestSellingProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={bestSellingProducts} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#9ca3af'}} interval={0} angle={-20} textAnchor="end" height={60} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} />
                <Tooltip 
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                    formatter={(value) => [`${(value as number).toLocaleString('es-CO')} uds.`, 'Ventas']} 
                />
                <Bar dataKey="unitsSold" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
            </ResponsiveContainer>
            ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">Sin datos de ventas</div>
            )}
        </div>
      </div>
      
      {/* Sales Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-lg text-gray-800">Historial de Transacciones</h3>
            
            {/* Compact Filters */}
            <div className="flex gap-2">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as SaleStatus | 'all')} className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="all">Estado: Todos</option>
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagado</option>
                    <option value="annulled">Anulado</option>
                </select>
                <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 max-w-[150px]">
                    <option value="all">Cliente: Todos</option>
                    <option value="anonymous">Mostrador</option>
                    {uniqueCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSales.length > 0 ? filteredSales.map(sale => (
                        <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{sale.customerName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sale.date).toLocaleDateString('es-CO')} <span className="text-xs text-gray-400">{new Date(sale.date).toLocaleTimeString('es-CO', {hour: '2-digit', minute: '2-digit'})}</span></td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${sale.total.toLocaleString('es-CO')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(sale.status)}`}>
                                    {statusTranslations[sale.status]}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                {sale.status === 'pending' ? (
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => onUpdateSaleStatus(sale.id, 'paid')} className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition-colors">Confirmar</button>
                                        <button onClick={() => onUpdateSaleStatus(sale.id, 'annulled')} className="text-gray-400 hover:text-gray-600 px-2 py-1">Anular</button>
                                    </div>
                                ) : (
                                    <span className="text-gray-300">Completed</span>
                                )}
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={5} className="text-center py-12 px-4 text-gray-500">
                                <div className="flex flex-col items-center">
                                    <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                    No hay ventas registradas con estos filtros.
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
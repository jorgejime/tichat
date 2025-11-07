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
  const totalConfirmedRevenue = sales
    .filter(s => s.status === 'paid')
    .reduce((sum, s) => sum + s.total, 0);

  const topProducts = [...products].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const recentSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  
  const uniqueCustomers = useMemo(() => {
    return [...new Map(sales.map(s => [s.customerId, { id: s.customerId, name: s.customerName }])).values()];
  }, [sales]);

  const filteredSales = useMemo(() => {
    return sales
      .filter(sale => {
        if (statusFilter !== 'all' && sale.status !== statusFilter) return false;
        if (customerFilter !== 'all' && sale.customerId !== customerFilter) return false;
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
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      
      {/* WhatsApp Orders Section */}
      {pendingWhatsAppOrders.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-indigo-500">
          <h3 className="font-bold text-xl mb-4 text-gray-800">Pedidos Pendientes de WhatsApp</h3>
          <div className="space-y-4">
            {pendingWhatsAppOrders.map(order => (
              <div key={order.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{order.customerName}</p>
                    <p className="text-sm text-gray-500">
                      Recibido: {new Date(order.receivedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                   <div className="flex items-center gap-2">
                      <button onClick={() => onRejectWhatsAppOrder(order.id)} className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600">Rechazar</button>
                      <button onClick={() => onConfirmWhatsAppOrder(order.id)} className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Confirmar y Pasar a Caja</button>
                   </div>
                </div>
                <div className="bg-white p-3 rounded text-sm text-gray-600 italic mb-3">"{order.originalMessage}"</div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-800 mb-2">Productos Interpretados:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {order.parsedItems.map(item => (
                       <li key={item.id}>
                          <span className="font-medium">{item.cartQuantity}x</span> {item.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Tipos de Productos</h3>
          <p className="text-3xl font-bold text-gray-800">{totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total de Unidades</h3>
          <p className="text-3xl font-bold text-gray-800">{totalUnits.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Ingresos Confirmados</h3>
          <p className="text-3xl font-bold text-gray-800">${totalConfirmedRevenue.toLocaleString('es-CO')}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Top 5 Productos con Más Stock</h3>
            {products.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip formatter={(value) => `${(value as number).toLocaleString('es-CO')} uds.`} />
                <Legend />
                <Bar dataKey="quantity" name="Cantidad en Stock" fill="#4f46e5" />
                </BarChart>
            </ResponsiveContainer>
            ) : (
                <p className="text-gray-500">No hay suficientes datos para mostrar el gráfico.</p>
            )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
             <h3 className="font-bold text-lg mb-4 text-gray-800">Ventas Recientes</h3>
             {recentSales.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {recentSales.map(sale => (
                        <div key={sale.id} className="p-3 rounded-md bg-gray-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-gray-800">{sale.customerName}</p>
                                    <p className="text-sm text-gray-500">{new Date(sale.date).toLocaleDateString('es-CO', {day: '2-digit', month: 'short', year: 'numeric'})}</p>
                                </div>
                                <div className="text-right">
                                     <p className="font-semibold text-gray-900">${sale.total.toLocaleString('es-CO')}</p>
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(sale.status)}`}>
                                        {statusTranslations[sale.status]}
                                     </span>
                                </div>
                            </div>
                            {sale.status === 'pending' && (
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => onUpdateSaleStatus(sale.id, 'paid')} className="flex-1 text-xs font-semibold bg-green-500 text-white py-1 px-2 rounded hover:bg-green-600">Confirmar Pago</button>
                                    <button onClick={() => onUpdateSaleStatus(sale.id, 'annulled')} className="flex-1 text-xs font-semibold bg-gray-500 text-white py-1 px-2 rounded hover:bg-gray-600">Anular</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
             ) : (
                <p className="text-gray-500">Aún no se han registrado ventas.</p>
             )}
        </div>
      </div>
      
      {/* Sales History Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-4 text-gray-800">Historial de Ventas Completo</h3>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-md border">
            <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="all">Todos</option>
                    {uniqueCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as SaleStatus | 'all')} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="all">Todos</option>
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagado</option>
                    <option value="annulled">Anulado</option>
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Desde</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"/>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Hasta</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"/>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSales.length > 0 ? filteredSales.map(sale => (
                        <tr key={sale.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.customerName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sale.date).toLocaleDateString('es-CO')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${sale.total.toLocaleString('es-CO')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(sale.status)}`}>
                                    {statusTranslations[sale.status]}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {sale.status === 'pending' ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => onUpdateSaleStatus(sale.id, 'paid')} className="text-green-600 hover:text-green-900">Confirmar</button>
                                        <button onClick={() => onUpdateSaleStatus(sale.id, 'annulled')} className="text-gray-600 hover:text-gray-900">Anular</button>
                                    </div>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={5} className="text-center py-10 px-4 text-gray-500">No se encontraron ventas con los filtros seleccionados.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};
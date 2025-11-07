import React, { useState } from 'react';
import { Customer } from '../types';

interface ClientsViewProps {
    customers: Customer[];
    onAddCustomer: (name: string, nickname: string, phone: string, address: string, idNumber?: string, email?: string) => void;
    onUpdateCustomer: (customer: Customer) => void;
    onDeleteCustomer: (customerId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer }) => {
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerNickname, setNewCustomerNickname] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [newCustomerAddress, setNewCustomerAddress] = useState('');
    const [newCustomerIdNumber, setNewCustomerIdNumber] = useState('');
    const [newCustomerEmail, setNewCustomerEmail] = useState('');
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCustomerName && newCustomerNickname && newCustomerPhone && newCustomerAddress) {
            onAddCustomer(newCustomerName, newCustomerNickname, newCustomerPhone, newCustomerAddress, newCustomerIdNumber, newCustomerEmail);
            setNewCustomerName('');
            setNewCustomerNickname('');
            setNewCustomerPhone('');
            setNewCustomerAddress('');
            setNewCustomerIdNumber('');
            setNewCustomerEmail('');
        }
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer({ ...customer });
    };

    const handleSave = () => {
        if (editingCustomer) {
            onUpdateCustomer(editingCustomer);
            setEditingCustomer(null);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (editingCustomer) {
            const { name, value } = e.target;
            setEditingCustomer({ ...editingCustomer, [name]: value });
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h2>

            {/* Add New Customer Form */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Nuevo Cliente</h3>
                <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                     <div>
                        <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">Apodo / Identificador</label>
                        <input
                            type="text"
                            id="nickname"
                            value={newCustomerNickname}
                            onChange={(e) => setNewCustomerNickname(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Ej: Vecina María, El del 405"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                        <input
                            type="text"
                            id="name"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Ej: María Rodriguez"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Número de WhatsApp</label>
                        <input
                            type="tel"
                            id="phone"
                            value={newCustomerPhone}
                            onChange={(e) => setNewCustomerPhone(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Ej: 573001234567"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
                        <input
                            type="text"
                            id="address"
                            value={newCustomerAddress}
                            onChange={(e) => setNewCustomerAddress(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Ej: Calle Falsa 123"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700">Cédula (Opcional)</label>
                        <input
                            type="text"
                            id="idNumber"
                            value={newCustomerIdNumber}
                            onChange={(e) => setNewCustomerIdNumber(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Ej: 123456789"
                        />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo (Opcional)</label>
                        <input
                            type="email"
                            id="email"
                            value={newCustomerEmail}
                            onChange={(e) => setNewCustomerEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Ej: maria@email.com"
                        />
                    </div>
                    <div className="flex items-end h-full sm:col-start-3">
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Agregar Cliente
                        </button>
                    </div>
                </form>
            </div>

            {/* Customers List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apodo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Completo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {customers.map((customer) => (
                            <tr key={customer.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingCustomer?.id === customer.id ? (
                                        <input name="nickname" value={editingCustomer.nickname} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                                    ) : (
                                        <div className="text-sm font-medium text-gray-900">{customer.nickname}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingCustomer?.id === customer.id ? (
                                        <input name="name" value={editingCustomer.name} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                                    ) : (
                                        <div className="text-sm text-gray-500">{customer.name}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingCustomer?.id === customer.id ? (
                                        <input name="phone" value={editingCustomer.phone} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                                    ) : (
                                        <div className="text-sm text-gray-500">{customer.phone}</div>
                                    )}
                                </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    {editingCustomer?.id === customer.id ? (
                                        <input name="address" value={editingCustomer.address} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                                    ) : (
                                        <div className="text-sm text-gray-500">{customer.address}</div>
                                    )}
                                </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    {editingCustomer?.id === customer.id ? (
                                        <input name="email" value={editingCustomer.email || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
                                    ) : (
                                        <div className="text-sm text-gray-500">{customer.email || '-'}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {editingCustomer?.id === customer.id ? (
                                        <button onClick={handleSave} className="text-indigo-600 hover:text-indigo-900">Guardar</button>
                                    ) : (
                                        <button onClick={() => handleEdit(customer)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                                    )}
                                    <button onClick={() => onDeleteCustomer(customer.id)} className="text-red-600 hover:text-red-900 ml-4">Borrar</button>
                                </td>
                            </tr>
                        ))}
                         {customers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-10 px-4 text-gray-500">
                                    No tienes clientes registrados todavía.
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
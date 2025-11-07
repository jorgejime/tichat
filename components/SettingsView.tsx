import React, { useState, useEffect } from 'react';
import { ShopSettings } from '../types';

interface SettingsViewProps {
    settings: ShopSettings;
    onUpdateSettings: (settings: ShopSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
    const [formData, setFormData] = useState<ShopSettings>(settings);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number') {
             setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings(formData);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Configuración de la Tienda</h2>

            <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
                {/* General Information */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Información General</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">Nombre de la Tienda</label>
                            <input type="text" id="storeName" name="storeName" value={formData.storeName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
                            <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                        </div>
                        <div className="sm:col-span-2">
                             <label htmlFor="welcomeMessage" className="block text-sm font-medium text-gray-700">Mensaje para Clientes (WhatsApp)</label>
                             <textarea id="welcomeMessage" name="welcomeMessage" value={formData.welcomeMessage} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Ej: ¡Gracias por tu compra en [Mi Tienda]!"></textarea>
                        </div>
                    </div>
                </div>

                {/* Opening Hours */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Horarios de Atención</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="openingTime" className="block text-sm font-medium text-gray-700">Hora de Apertura</label>
                            <input type="time" id="openingTime" name="openingTime" value={formData.openingTime} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                        </div>
                        <div>
                            <label htmlFor="closingTime" className="block text-sm font-medium text-gray-700">Hora de Cierre</label>
                            <input type="time" id="closingTime" name="closingTime" value={formData.closingTime} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                        </div>
                    </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Información de Domicilios</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="deliveryFee" className="block text-sm font-medium text-gray-700">Costo del Domicilio ($)</label>
                            <input type="number" id="deliveryFee" name="deliveryFee" value={formData.deliveryFee} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required min="0" />
                        </div>
                         <div>
                            <label htmlFor="deliveryStaffCount" className="block text-sm font-medium text-gray-700">Cantidad de Domiciliarios</label>
                            <input type="number" id="deliveryStaffCount" name="deliveryStaffCount" value={formData.deliveryStaffCount} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required min="0" />
                        </div>
                         <div className="sm:col-span-2 space-y-4">
                            <div className="relative flex items-start">
                                <div className="flex items-center h-5">
                                    <input id="hasFreeDeliveryOption" name="hasFreeDeliveryOption" type="checkbox" checked={formData.hasFreeDeliveryOption} onChange={handleChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="hasFreeDeliveryOption" className="font-medium text-gray-700">Ofrecer domicilio gratis por compras superiores a un monto</label>
                                </div>
                            </div>
                            {formData.hasFreeDeliveryOption && (
                                <div>
                                    <label htmlFor="freeDeliveryThreshold" className="block text-sm font-medium text-gray-700">Monto mínimo para domicilio gratis ($)</label>
                                    <input type="number" id="freeDeliveryThreshold" name="freeDeliveryThreshold" value={formData.freeDeliveryThreshold} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required min="0" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end items-center gap-4">
                    {showSuccess && (
                        <span className="text-green-600 font-medium transition-opacity duration-300 ease-in-out">¡Cambios guardados!</span>
                    )}
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
};
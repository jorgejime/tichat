export interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  description?: string;
  category: string;
  unit: string;
}

export interface Customer {
  id: string;
  name: string;
  nickname: string;
  address: string;
  phone: string;
  idNumber?: string;
  email?: string;
}

export interface CartItem extends Product {
  cartQuantity: number;
}

export type SaleStatus = 'pending' | 'paid' | 'annulled';

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  date: string;
  status: SaleStatus;
}

export type WhatsAppOrderStatus = 'pending' | 'confirmed' | 'rejected';

export interface WhatsAppOrder {
  id: string;
  customerPhone: string;
  customerName: string; // Could be just the phone number if not a known customer
  originalMessage: string;
  parsedItems: CartItem[];
  status: WhatsAppOrderStatus;
  receivedAt: string;
}


export type AppView = 'inventory' | 'checkout' | 'dashboard' | 'assistant' | 'clients';
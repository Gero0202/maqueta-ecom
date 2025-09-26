// Opcional: historial de compras
export interface Order {
  order_id: number;
  user_id: number;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  stock?: number;
  image_url?: string
  name?: string
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

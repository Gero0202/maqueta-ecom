// Opcional: historial de compras
export interface Order {
  order_id: number;
  user_id: number;
  item: OrderItem[];
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  stock?: number;
}
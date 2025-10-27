'use client'

import { useEffect, useState } from "react";
import styles from "@/app/styles/orders.module.css"
import { Order, OrderItem } from "../types/Order";
import Image from "next/image";
import Spinner from "../components/Spinner";
import ViewPaymentButton from "../components/ViewPaymentButton";

export default function OrdersPage() {
  const [orders, setOrders] = useState<(Order & { items: OrderItem[]; address?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (res.ok) {
          setOrders(data.orders);
        } else {
          setError(data.message || "Error al obtener órdenes");
        }
      } catch (err) {
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <p className={styles.loading}><Spinner /></p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.titleOne}>Mis Órdenes</h1>
      {orders.length === 0 && <p>No tenés órdenes todavía.</p>}

      {orders.map((order) => (
        <div key={order.order_id} className={styles.orderCard}>
          <div className={styles.orderHeader}>
            <span>ID: {order.order_id}</span>
            <span>Mp Pago: {order.mp_payment_id}</span>
            <span>Pago ID: {order.payment_id}</span>
            <span>Status: {order.status}</span>
            <span>Total: ${Number(order.total_amount).toFixed(2)}</span>
            <span>Fecha: {new Date(order.created_at).toLocaleDateString()}</span>
          </div>

          {order.address && (
            <div className={styles.addressSection}>
              <h4>Dirección de entrega:</h4>
              <p>
                {order.address.street} {order.address.number},{" "}
                {order.address.city}, {order.address.province}
              </p>
              <p>Código Postal: {order.address.postal_code}</p>
              {order.address.description && (
                <p>Descripción: {order.address.description}</p>
              )}
            </div>
          )}

          <div className={styles.items}>
            {order.items.map((item) => (
              <div key={item.product_id} className={styles.item}>
                {item.image_url && (
                  <img src={item.image_url} alt="" className={styles.itemImage} />

                )}
                <div>
                  <p>{item.name}</p>
                  <p>Cantidad: {item.quantity}</p>
                  <p>Precio: ${item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.paymentButtonWrapper}>
            <ViewPaymentButton
              orderId={order.order_id}
              apiPath={`/api/mp/paymentOrder/${order.order_id}`}
            />
          </div>

        </div>
      ))}
    </div>
  );
}

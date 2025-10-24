'use client'

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "@/app/styles/orders.module.css";
import Spinner from "@/app/components/Spinner";

type OrderItem = {
    product_id: number;
    name: string;
    quantity: number;
    price: number;
};

type PaymentData = {
    mp_payment_id: string;
    status: string;
    status_detail: string;
    transaction_amount: number;
    net_received_amount: number;
    currency_id: string;
    payment_method: string;
    installments: number;
    date_created: string;
    date_approved: string;
    user: { user_id: number; name: string; email: string };
    items: OrderItem[];
};

export default function OrderDetailPage() {
    const params = useParams();
    const orderId = params.orderId;
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/mp/paymentOrder/${orderId}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Error al obtener la orden");
                setPaymentData(data.paymentData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    if (loading) return <p className={styles.loading}><Spinner /></p>;
    if (error) return <p className={styles.error}>{error}</p>;
    if (!paymentData) return <p>No se encontró la orden</p>;

    return (
        <div className={styles.container}>
            <h1 className={styles.titleOne}>Detalle de la Orden #{orderId}</h1>

            <div className={styles.paymentDetails}>
                <p><strong>ID de pago:</strong> {paymentData.mp_payment_id}</p>
                <p><strong>Estado:</strong> {paymentData.status}</p>
                <p><strong>Detalle del estado:</strong> {paymentData.status_detail}</p>
                <p><strong>Monto:</strong> ${paymentData.transaction_amount.toFixed(2)}</p>
                <p><strong>Fecha de creación:</strong> {new Date(paymentData.date_created).toLocaleString()}</p>
                <p><strong>Fecha de aprobación:</strong> {paymentData.date_approved ? new Date(paymentData.date_approved).toLocaleString() : "N/A"}</p>
                <p><strong>Usuario:</strong> {paymentData.user.name} ({paymentData.user.email})</p>
                <p><strong>Método de pago:</strong> {paymentData.payment_method}</p>
            </div>

            <h2 className={styles.subtitle}>Items de la orden</h2>
            <ul className={styles.items}>
                {paymentData.items.map(item => (
                    <li key={item.product_id} className={styles.item}>
                        <span>{item.name}</span>
                        <span>Cantidad: {item.quantity}</span>
                        <span>Precio: ${item.price.toFixed(2)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

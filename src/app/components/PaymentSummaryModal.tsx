"use client";
import styles from "@/app/styles/paymentSummaryModal.module.css";
import { useAuth } from "../context/AuthContext";

interface PaymentSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentData: any | null;

}

export default function PaymentSummaryModal({
    isOpen,
    onClose,
    paymentData,

}: PaymentSummaryModalProps) {
    const { currentUser } = useAuth()
    const isAdmin = currentUser?.role === "admin" 
    if (!isOpen) return null;

    return (
        <div className={styles["modal-overlay"]}>
            <div className={styles["modal-content"]}>
                <button onClick={onClose} className={styles["close-button"]}>
                    ✕
                </button>

                <h2 className={styles["modal-title"]}>Resumen de pago</h2>

                <div className={styles["payment-details"]}>
                    <p><strong>ID de pago (Mercado Pago):</strong> {paymentData.mp_payment_id || "N/A"}</p>
                    <p><strong>Email del comprador (Mercado Pago):</strong> {paymentData.payer_email || "N/A"}</p>
                    <p><strong>DNI del comprador (Mercado Pago):</strong> {paymentData.payer_dni || "N/A"}</p>
                    <p><strong>Estado:</strong> {paymentData.status || "N/A"}</p>
                    <p><strong>Detalle de estado:</strong> {paymentData.status_detail || "N/A"}</p>
                    <p><strong>Monto:</strong> ${paymentData.transaction_amount || "N/A"}</p>
                    {isAdmin && (
                        <p><strong>Monto neto recibido:</strong> ${paymentData.net_received_amount || "N/A"}</p>
                    )}
                    <p><strong>Divisa:</strong> {paymentData.currency_id || "N/A"}</p>
                    <p><strong>Método de pago:</strong> {paymentData.payment_method || "N/A"}</p>
                    <p><strong>Cuotas:</strong> {paymentData.installments || "N/A"}</p>
                    <p><strong>Fecha creación:</strong> {paymentData.date_created ? new Date(paymentData.date_created).toLocaleString() : "N/A"}</p>
                    <p><strong>Fecha aprobación:</strong> {paymentData.date_approved ? new Date(paymentData.date_approved).toLocaleString() : "N/A"}</p>

                    <h3>Datos del comprador:</h3>
                    <p><strong>ID:</strong> {paymentData.user?.user_id || "N/A"}</p>
                    <p><strong>Nombre:</strong> {paymentData.user?.name || "N/A"}</p>
                    <p><strong>Email:</strong> {paymentData.user?.email || "N/A"}</p>
                </div>

                {paymentData.items && paymentData.items.length > 0 && (
                    <>
                        <h3>Items de la orden:</h3>
                        <div className={styles["order-items"]}>
                            {paymentData.items.map((item: any) => (
                                <div key={item.product_id} className={styles["item"]}>
                                    <p><strong>Producto:</strong> {item.name}</p>
                                    <p><strong>Cantidad:</strong> {item.quantity}</p>
                                    <p><strong>Precio:</strong> ${item.price}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

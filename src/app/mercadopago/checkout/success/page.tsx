"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "@/app/styles/succesMp.module.css";

interface PaymentInfo {
  id: string;
  status: string;
  transaction_amount: number;
  date_created: string;
  payment_method_id?: string;
  payer?: { email?: string };
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");

  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      if (!paymentId) return;

      try {
        const res = await fetch(`/api/mp/payment-status?payment_id=${paymentId}`);
        if (!res.ok) throw new Error("No se pudo obtener la información del pago.");
        const data = await res.json();
        setPaymentInfo(data);
      } catch (err: any) {
        console.error("Error al obtener el pago:", err);
        setError("Hubo un problema al verificar tu pago. Intenta nuevamente más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentInfo();
  }, [paymentId]);

  if (loading) return <p className={styles["loading"]}>Cargando datos del pago...</p>;

  if (error)
    return (
      <div className={styles["error-container"]}>
        <h1 className={styles["error-title"]}>❌ Error</h1>
        <p className={styles["error-message"]}>{error}</p>
      </div>
    );

  if (!paymentInfo)
    return (
      <div className={styles["error-container"]}>
        <h1 className={styles["error-title"]}>⚠️ Pago no encontrado</h1>
        <p className={styles["error-message"]}>No se pudo recuperar la información del pago.</p>
      </div>
    );

  return (
    <div className={styles["success-container"]}>
      <div className={styles["card"]}>
        <h1 className={styles["title"]}>✅ ¡Pago exitoso!</h1>
        <p className={styles["info"]}>
          <strong>ID del pago:</strong> {paymentInfo.id}
        </p>
        <p className={styles["info"]}>
          <strong>Estado:</strong> {paymentInfo.status}
        </p>
        <p className={styles["info"]}>
          <strong>Monto:</strong> ${paymentInfo.transaction_amount}
        </p>
        <p className={styles["info"]}>
          <strong>Fecha:</strong>{" "}
          {new Date(paymentInfo.date_created).toLocaleString("es-AR")}
        </p>
        {paymentInfo.payer?.email && (
          <p className={styles["info"]}>
            <strong>Pagado por:</strong> {paymentInfo.payer.email}
          </p>
        )}
      </div>
    </div>
  );
}

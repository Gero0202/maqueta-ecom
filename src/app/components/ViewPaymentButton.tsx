"use client";
import { useState } from "react";
import PaymentSummaryModal from "@/app/components/PaymentSummaryModal";
import styles from "@/app/styles/viewPaymentButton.module.css";

interface ViewPaymentButtonProps {
  orderId: number | string;
  apiPath: string; // Ej: /api/mp/paymentOrder/123 o /api/admin/mp/paymentsOrderAdmin/123
}

export default function ViewPaymentButton({ orderId, apiPath }: ViewPaymentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(apiPath);
      if (!res.ok) throw new Error("No se pudo obtener la información del pago");

      const data = await res.json();
      setPaymentData(data.paymentData);
      setIsOpen(true);
    } catch (err: any) {
      setError(err.message || "Error al obtener el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["button-container"]}>
      <button
        className={styles["view-button"]}
        onClick={handleOpen}
        disabled={loading}
      >
        {loading ? "Cargando..." : "Ver pago"}
      </button>

      {error && <p className={styles["error-message"]}>{error}</p>}

      {isOpen && (
        <PaymentSummaryModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          paymentData={paymentData}
        />
      )}
    </div>
  );
}

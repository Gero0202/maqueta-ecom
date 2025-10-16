"use client";
import { useState } from "react";

export default function CheckoutButton({ cartId, userEmail }: { cartId: number; userEmail: string }) {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        try {
            setLoading(true);

            const res = await fetch("/api/mp/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cartId, userEmail }),
            });

            const data = await res.json();

            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                alert("Error al crear la preferencia");
            }
        } catch (error) {
            console.error(error);
            alert("Error al iniciar el pago");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
                backgroundColor: '#2563EB', 
                color: 'white',            
                padding: '0.5rem 1rem',     
                borderRadius: '0.375rem',   
                transition: 'background-color 0.3s',
                cursor: 'pointer'
            }}
        >
            {loading ? "Creando pago..." : "Ir al pago"}
        </button>
    );
}

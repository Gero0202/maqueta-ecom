'use client'

import { useState } from "react"

export default function AddToCartButton({ productId }: { productId: number }) {
  const [loading, setLoading] = useState(false)

  const handleAddToCart = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 400 && data.message?.includes("stock")) {
          alert("❌ Este producto no tiene stock suficiente.")
        } else {
          alert(data.message || "Error al agregar al carrito.")
        }
        return
      }

      console.log("✅ Producto agregado al carrito:", data)
      alert("✅ Producto agregado al carrito.")
    } catch (error: any) {
      console.error("❌ Error agregando al carrito:", error.message)
      alert("Error al conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading}
      style={{
        marginTop: "1rem",
        backgroundColor: "#2563eb",
        color: "white",
        padding: "0.75rem 1.25rem",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontSize: "1rem",
        transition: "background 0.2s",
      }}
    >
      {loading ? "Agregando..." : "Agregar al carrito"}
    </button>
  )
}

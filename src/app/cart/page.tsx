"use client"

import { useEffect, useState } from "react"
import style from "@/app/styles/cart.module.css"

interface CartItem {
    cart_item_id: number
    product_id: number
    name: string
    unit_price: number
    quantity: number
    stock: number
    image_url?: string
}

export default function CartPage() {
    const [cart, setCart] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // 📌 Cargar carrito
    const fetchCart = async () => {
        try {
            setLoading(true)
            const res = await fetch("/api/cart")
            if (!res.ok) throw new Error("Error al cargar el carrito")
            const data = await res.json()
            setCart(data.cart?.items || [])
            // setTotal(data.cart?.total || 0)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCart()
    }, [])

    // 📌 Actualizar cantidad
    const updateQuantity = async (productId: number, newQuantity: number) => {
        if (newQuantity <= 0) return
        try {
            const res = await fetch(`/api/cart/items/${productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantity: newQuantity }),
            })
            if (!res.ok) {
                const errData = await res.json()
                alert(errData.message || "Error al actualizar cantidad")
                return
            }
            await fetchCart()
        } catch {
            alert("Error al actualizar la cantidad")
        }
    }

    // 📌 Eliminar item
    const removeItem = async (itemId: number) => {
        try {
            const res = await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" })
            if (!res.ok) {
                alert("Error al eliminar producto")
                return
            }
            await fetchCart()
        } catch {
            alert("Error al eliminar producto")
        }
    }

    // 📌 Vaciar carrito
    const clearCart = async () => {
        try {
            const res = await fetch("/api/cart", { method: "DELETE" })
            if (!res.ok) {
                alert("Error al vaciar carrito")
                return
            }
            setCart([])
        } catch {
            alert("Error al vaciar carrito")
        }
    }

    const total = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

    if (loading) return <p>Cargando carrito...</p>
    if (error) return <p className={style["error"]}>{error}</p>

    return (
        <div className={style["container"]}>
            <h1 className={style["title"]}>Tu Carrito</h1>

            {cart.length === 0 ? (
                <p>No tienes productos en el carrito.</p>
            ) : (
                <>
                    <ul className={style["cart-list"]}>
                        {cart.map((item) => (
                            <li key={item.cart_item_id} className={style["cart-item"]}>
                                <div className={style["cart-info"]}>
                                    <h2>{item.name}</h2>
                                    <p>
                                        ${item.unit_price} x {item.quantity}
                                    </p>
                                    <p className={style["stock-info"]}>
                                        Stock disponible: {item.stock}
                                    </p>
                                </div>

                                <div className={style["cart-actions"]}>
                                    <button
                                        onClick={() =>
                                            updateQuantity(item.product_id, item.quantity - 1)
                                        }
                                    >
                                        -
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button
                                        onClick={() =>
                                            updateQuantity(item.product_id, item.quantity + 1)
                                        }
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={() => removeItem(item.product_id)}
                                        className={style["remove-btn"]}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className={style["footer"]}>
                        <button onClick={clearCart} className={style["clear-btn"]}>
                            Vaciar Carrito
                        </button>
                        <div className={style["summary"]}>
                            <p>Total: ${total.toFixed(2)}</p>
                            <button className={style["checkout-btn"]}>
                                Ir al Checkout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

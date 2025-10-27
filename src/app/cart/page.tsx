"use client"

import { useEffect, useState } from "react"
import style from "@/app/styles/cart.module.css"
import CheckoutButton from "../components/CheckoutButton"
import { useAuth } from "../context/AuthContext"

interface CartItem {
    cart_item_id: number
    product_id: number
    name: string
    unit_price: number
    quantity: number
    stock: number
    image_url?: string
}

interface Cart {
    cart_id: number;
    items: CartItem[];
    total: string;
    user_email: string;
}

interface Address {
    address_id: number
    street: string
    city: string
    province: string
    zip_code: string
    country: string
    number_house: string
    is_default: boolean
}


export default function CartPage() {
    const [cart, setCart] = useState<Cart | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([])
    const [selectedAddressId, setSelectedAddressId] = useState<number | "new" | null>(null)
    const [newAddress, setNewAddress] = useState({ street: "", city: "", province: "", zip_code: "", number_house: "", country: "" })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const { currentUser } = useAuth()

    useEffect(() => {
        if (!currentUser) return;
        const fetchAddresses = async () => {
            try {
                const res = await fetch(`/api/users/${currentUser.user_id}/addresses`);
                if (!res.ok) throw new Error("Error al cargar direcciones");
                const data = await res.json();
                const validAddresses: Address[] = data.addresses?.filter(Boolean) || [];

                setAddresses(validAddresses);

                if (validAddresses.length > 0) {
                    const defaultAddress = validAddresses.find(addr => addr.is_default === true);

                    if (defaultAddress) {
                        setSelectedAddressId(defaultAddress.address_id);
                    } else {
                        setSelectedAddressId(validAddresses[0].address_id);
                    }
                }
            } catch (err: any) {
                console.error(err);
            }
        };

        fetchAddresses();
    }, [currentUser]);


    // 📌 Cargar carrito
    const fetchCart = async () => {
        try {
            setLoading(true)
            const res = await fetch("/api/cart")
            if (!res.ok) throw new Error("Error al cargar el carrito")
            const data = await res.json()
            setCart(data.cart)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCart()
    }, [])


    // 📌 Agregar nueva dirección
    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (!currentUser) return;
            const res = await fetch(`/api/users/${currentUser.user_id}/addresses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAddress),
            })
            if (!res.ok) throw new Error("Error al agregar dirección")
            const data = await res.json()
            setAddresses((prev) => [...prev, data])
            setSelectedAddressId(data.address_id)
            setNewAddress({ street: "", city: "", province: "", zip_code: "", number_house: "", country: "" })
        } catch (err: any) {
            alert(err.message)
        }
    }

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
            setCart(null)
        } catch {
            alert("Error al vaciar carrito")
        }
    }

    const total = cart?.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

    if (loading) return <p>Cargando carrito...</p>
    if (error) return <p className={style["error"]}>{error}</p>

    return (
        <div className={style["container"]}>
            <h1 className={style["title"]}>Tu Carrito</h1>

            {!cart || cart.items.length === 0 ? (
                <p>No tienes productos en el carrito.</p>
            ) : (
                <>
                    <ul className={style["cart-list"]}>
                        {cart.items.map((item) => (
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

                    {/* 🔹 Selección de dirección */}
                    <div className={style["address-section"]}>
                        <h3>Seleccionar dirección de entrega</h3>
                        <select
                            value={selectedAddressId ?? ""}
                            onChange={(e) => {
                                const value = e.target.value
                                setSelectedAddressId(value === "new" ? "new" : Number(value))
                            }}
                        >
                            {addresses.map((addr) => (
                                <option key={addr.address_id} value={addr.address_id}>
                                    Calle: {addr.street} | Núm: {addr.number_house} | Ciudad: {addr.city} | Provincia: {addr.province} | CP: {addr.zip_code}

                                    {addr.is_default && " (Por Defecto)"}
                                </option>
                            ))}
                            <option value="new"> + Agregar nueva dirección</option>
                        </select>

                        {selectedAddressId === "new" && (
                            <form onSubmit={handleAddAddress} className={style["new-address-form"]}>
                                <input
                                    type="text"
                                    placeholder="Calle"
                                    value={newAddress.street}
                                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Ciudad"
                                    value={newAddress.city}
                                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Provincia"
                                    value={newAddress.province}
                                    onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Pais"
                                    value={newAddress.country}
                                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Numero de casa/dpto"
                                    value={newAddress.number_house}
                                    onChange={(e) => setNewAddress({ ...newAddress, number_house: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Código postal"
                                    value={newAddress.zip_code}
                                    onChange={(e) => setNewAddress({ ...newAddress, zip_code: e.target.value })}
                                    required
                                />
                                <button type="submit">Guardar dirección</button>
                            </form>
                        )}
                    </div>

                    <div className={style["footer"]}>
                        <button onClick={clearCart} className={style["clear-btn"]}>
                            Vaciar Carrito
                        </button>
                        <div className={style["summary"]}>
                            <p>Total: ${(total ?? 0).toFixed(2)}</p>
                            <CheckoutButton
                                cartId={cart.cart_id}
                                userEmail={cart.user_email}
                                addressId={selectedAddressId && selectedAddressId !== "new" ? selectedAddressId : null}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

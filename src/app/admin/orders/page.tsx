'use client'

import SearchBarAdmin from "@/app/components/SearchBarAdmin"
import ViewPaymentButton from "@/app/components/ViewPaymentButton"
import styles from "@/app/styles/adminOrder.module.css"
import { Order, OrderStatus } from "@/app/types/Order"
import { useEffect, useState, useCallback } from "react"

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // 🔍 función para traer todas las órdenes (cuando no hay búsqueda)
    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/orders")
            if (!res.ok) throw new Error("Error al obtener órdenes")
            const data = await res.json()
            const raw = data?.orders ?? []
            normalizeAndSetOrders(raw)
        } catch (err: any) {
            setError(err.message || "Error desconocido")
        } finally {
            setLoading(false)
        }
    }, [])

    // 🔍 función para buscar órdenes
    const handleSearch = useCallback(async (term: string) => {
        if (!term) {
            fetchOrders()
            return
        }

        try {
            const res = await fetch(`/api/searchAdmin/orders?q=${encodeURIComponent(term)}`)
            if (!res.ok) throw new Error("Error al buscar órdenes")
            const data = await res.json()
            const raw = data?.orders ?? []
            normalizeAndSetOrders(raw)
        } catch (err: any) {
            console.error("Error en búsqueda:", err)
        }
    }, [fetchOrders])

    // 🧩 función de normalización compartida
    const normalizeAndSetOrders = (raw: any[]) => {
        const normalized: Order[] = raw.map((o: any) => ({
            order_id: Number(o.order_id),
            mp_payment_id: Number(o.mp_payment_id),
            payment_id: Number(o.payment_id),
            user_id: Number(o.user_id),
            user_name: o.user_name ?? o.name ?? "",
            user_email: o.user_email ?? "",
            items: Array.isArray(o.items)
                ? o.items.map((it: any) => ({
                    product_id: Number(it.product_id),
                    quantity: Number(it.quantity),
                    price: Number(it.price),
                    stock: it.stock !== undefined ? Number(it.stock) : undefined,
                    image_url: it.image_url ?? it.image ?? "",
                    name: it.name ?? it.product_name ?? "",
                }))
                : [],
            total_amount: Number(o.total_amount ?? o.total ?? 0),
            status: o.status,
            created_at: o.created_at,
            updated_at: o.updated_at ?? undefined,
            address: {
                street: o.address?.street ?? "",
                city: o.address?.city ?? "",
                province: o.address?.province ?? "",
                zip_code: o.address?.zip_code ?? "",
                number_house: o.address?.number ?? "",
                description: o.address?.description ?? "",
            },
        }))

        setOrders(normalized)
    }

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])
    const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                alert(body?.message || "Error al actualizar el estado");
                return;
            }

            const { order } = await res.json();

            setOrders((prev) =>
                prev.map((o) => (o.order_id === order.order_id ? order : o))
            );
        } catch (err) {
            console.error(err);
            alert("Error de conexión al actualizar la orden");
        }
    };

    const handleDeleteOrder = async (orderId: number) => {
        if (!confirm("¿Seguro que quieres eliminar esta orden?")) return;

        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                alert(body?.message || "Error al eliminar la orden");
                return;
            }

            setOrders(prev => prev.filter(o => o.order_id !== orderId));
            alert("Orden eliminada correctamente");
        } catch (error) {
            console.error("Error al eliminar orden:", error);
            alert("Error de conexión al intentar eliminar la orden");
        }
    };



    if (loading) return <p className={styles["loading"]}>Cargando órdenes...</p>
    if (error) return <p className={styles["error"]}>{error}</p>

    return (
        <div className={styles["container"]}>
            <h1 className={styles["title"]}>Órdenes</h1>

            <SearchBarAdmin
                onSearch={handleSearch}
                placeholder="Buscar por ID, email o nombre de usuario..."
                debounceMs={400}
                minChars={1}
            />


            <div className={styles["table"]}>
                <div className={styles["table-header"]}>
                    <span>ID</span>
                    <span>MercadoPago ID Pago</span>
                    <span>Usuario</span>
                    <span>Email</span>
                    <span>Estado</span>
                    <span>Total</span>
                    <span>Fecha</span>
                    <span>Items</span>
                    <span>Direcciones</span>
                    <span>Acciones</span>
                </div>

                {orders.map(order => (
                    <div key={order.order_id} className={styles["table-row"]}>
                        <span data-label="ID">{order.order_id}</span>
                        <span data-label="MercadoPago ID Pago">{order.mp_payment_id}</span>
                        <span data-label="Usuario">{order.user_name}</span>
                        <span data-label="Email">{order.user_email}</span>
                        <span data-label="Estado">
                            <select
                                value={order.status}
                                onChange={(e) =>
                                    handleUpdateStatus(order.order_id, e.target.value as OrderStatus)
                                }
                                className={styles["status-select"]}
                            >
                                {["pending", "paid", "shipped", "delivered", "cancelled"].map((s) => (
                                    <option key={s} value={s}>
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </span>
                        <span data-label="Total">${(order.total_amount ?? 0).toFixed(2)}</span>
                        <span data-label="Fecha">
                            {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span data-label="Items">
                            {order.items && order.items.length > 0 ? (
                                <ul className={styles["item-list"]}>
                                    {order.items.map(item => (
                                        <li key={`${order.order_id}-${item.product_id}`} className={styles["item"]}>
                                            {item.image_url && (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className={styles["item-img"]}
                                                />
                                            )}
                                            <span className={styles["item-name"]}>{item.name || `#${item.product_id}`}</span>
                                            <span className={styles["item-qty"]}>x{item.quantity}</span>
                                            <span className={styles["item-price"]}>${(item.price ?? 0).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles["no-items"]}>Sin productos</p>
                            )}
                        </span>
                        <span data-label="Dirección">
                            {order.address?.street
                                ? `Calle: ${order.address.street}, 
                                   Ciudad: ${order.address.city},
                                   Provincia ${order.address.province},
                                   Numero de casa: ${order.address.number_house},
                                   Codigo Postal: ${order.address.zip_code}`
                                : "Sin dirección"}
                        </span>
                        <span data-label="Acciones">
                            <button
                                className={styles["btn-delete"]}
                                onClick={() => handleDeleteOrder(order.order_id)}
                            >
                                Eliminar
                            </button>

                            <ViewPaymentButton
                                orderId={order.order_id}
                                apiPath={`/api/admin/mp/paymentsOrderAdmin/${order.order_id}`}
                            />
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
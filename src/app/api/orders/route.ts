import { NextResponse } from "next/server"
import pool from "@/app/lib/db"
import { getAuthUser } from "@/app/lib/auth"
import { Order, OrderItem } from "@/app/types/Order"

export async function POST(): Promise<NextResponse> {
  const client = await pool.connect()
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 })
    }

    // Traer items del carrito activo
    const cartRes = await client.query(
      `SELECT ci.product_id, ci.quantity, ci.unit_price as price, p.stock
       FROM cart_items ci
       JOIN carts c ON c.cart_id = ci.cart_id
       JOIN products p ON p.product_id = ci.product_id
       WHERE c.user_id = $1 AND c.status = 'active'`,
      [user.user_id]
    )

    const items: OrderItem[] = cartRes.rows.map((row) => ({
      product_id: row.product_id,
      quantity: row.quantity,
      price: Number(row.price)
    }))

    if (items.length === 0) {
      return NextResponse.json({ message: "El carrito está vacío" }, { status: 400 })
    }

    // calcular total
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

    await client.query("BEGIN")

    // crear orden
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING *`,
      [user.user_id, total, "pending"]
    )

    const order = orderRes.rows[0] as Order

    // insertar items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
        [order.order_id, item.product_id, item.quantity, item.price]
      )
    }

    // opcional: marcar carrito como "completed"
    await client.query(
      `UPDATE carts SET status = 'completed' WHERE user_id = $1 AND status = 'active'`,
      [user.user_id]
    )

    await client.query("COMMIT")

    return NextResponse.json({ order, items }, { status: 201 })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error(error)
    return NextResponse.json({ message: "Error creando orden" }, { status: 500 })
  } finally {
    client.release()
  }
}

import { NextResponse } from "next/server"
import pool from "@/app/lib/db"
import { getAuthUser } from "@/app/lib/auth"
import { Order, OrderItem } from "@/app/types/Order"

export async function POST() {
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
      price: Number(row.price),
      stock: row.stock, // <-- Agregamos el stock para la verificación
    }))

    if (items.length === 0) {
      return NextResponse.json({ message: "El carrito está vacío" }, { status: 400 })
    }

    // Validar stock
    for (const item of items) {
      if (item.stock! < item.quantity) {
        return NextResponse.json(
          { message: `Stock insuficiente para el producto ${item.product_id}` },
          { status: 409 }
        );
      }
    }

    // calcular total
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

    await client.query("BEGIN")

    // Reducir stock
    for (const item of items) {
      await client.query(
        `UPDATE products SET stock = stock - $1 WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }



    // crear orden
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, total, status) VALUES ($1, $2, 'pending') RETURNING *`,
      [user.user_id, total]
    );

    const order = orderRes.rows[0] as Order

    // Insertar items en order_items
    const insertPromises = items.map((item) =>
      client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
        [order.order_id, item.product_id, item.quantity, item.price]
      )
    );

    await Promise.all(insertPromises);

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

export async function GET() {
  const client = await pool.connect();

  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    // 🔹 Traer órdenes del usuario con total y datos de la dirección
    const ordersRes = await client.query(
      `
      SELECT 
        o.*,
        COALESCE(SUM(oi.price * oi.quantity), 0) AS total_amount,
        a.street,
        a.number_house,
        a.city,
        a.province,
        a.zip_code,
        a.description
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      LEFT JOIN addresses a ON a.address_id = o.address_id
      WHERE o.user_id = $1
      GROUP BY 
        o.order_id,
        a.street, a.number_house, a.city, a.province, a.zip_code, a.description
      ORDER BY o.created_at DESC
      `,
      [user.user_id]
    );

    const orders: (Order & { items: OrderItem[]; address?: any })[] = [];

    for (const order of ordersRes.rows) {
      const itemsRes = await client.query(
        `SELECT oi.*, p.name, p.image_url
         FROM order_items oi
         JOIN products p ON p.product_id = oi.product_id
         WHERE order_id = $1`,
        [order.order_id]
      );

      orders.push({
        ...order,
        total_amount: Number(order.total_amount),
        address: {
          street: order.street,
          number: order.number,
          city: order.city,
          province: order.province,
          postal_code: order.postal_code,
          description: order.description ?? null,
        },
        items: itemsRes.rows.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: Number(item.price),
          name: item.name,
          image_url: item.image_url,
        })),
      });
    }

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error al obtener órdenes" }, { status: 500 });
  } finally {
    client.release();
  }
}

import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/auth";
import { OrderItem } from "@/app/types/Order";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: Request, { params }: Params) {
  const client = await pool.connect();
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const orderRes = await client.query(
      `SELECT * FROM orders WHERE order_id = $1 AND user_id = $2`,
      [id, user.user_id]
    );

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ message: "Orden no encontrada" }, { status: 404 });
    }

    const order = orderRes.rows[0];

    const itemsRes = await client.query(
      `SELECT oi.*, p.name, p.image_url
       FROM order_items oi
       JOIN products p ON p.product_id = oi.product_id
       WHERE order_id = $1`,
      [id]
    );

    const items: OrderItem[] = itemsRes.rows.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: Number(item.price),
      name: item.name,
      image_url: item.image_url,
    }));

    return NextResponse.json({ order: { ...order, items } }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error obteniendo la orden" }, { status: 500 });
  } finally {
    client.release();
  }
}

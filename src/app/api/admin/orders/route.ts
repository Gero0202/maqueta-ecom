import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/auth";
import { OrderItem } from "@/app/types/Order";

export async function GET(req: Request) {
  const client = await pool.connect();

  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const userId = url.searchParams.get("user_id");

    let query = `
      SELECT
        o.*,
        u.name AS user_name,
        u.email AS user_email,
        oi.product_id,
        oi.quantity,
        oi.price,
        p.name AS product_name,
        p.image_url
      FROM orders o
      JOIN users u ON u.user_id = o.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON p.product_id = oi.product_id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      params.push(status);
      conditions.push(`o.status = $${params.length}`);
    }

    if (userId) {
      params.push(userId);
      conditions.push(`o.user_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY o.created_at DESC";

    const ordersRes = await client.query(query, params);
    
    // Mapeo de resultados para agrupar ítems por orden
    const ordersMap = new Map();
    
    for (const row of ordersRes.rows) {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          order_id: row.order_id,
          user_id: row.user_id,
          total_amount: Number(row.total),
          status: row.status,
          created_at: row.created_at,
          user_name: row.user_name,
          user_email: row.user_email,
          items: [],
        });
      }
      
      // Agrega el ítem a la orden correspondiente
      if (row.product_id) {
        ordersMap.get(row.order_id).items.push({
          product_id: row.product_id,
          quantity: Number(row.quantity),
          price: Number(row.price),
          name: row.product_name,
          image_url: row.image_url,
        });
      }
    }

    const ordersWithItems = Array.from(ordersMap.values());

    return NextResponse.json({ orders: ordersWithItems }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error al obtener órdenes" }, { status: 500 });
  } finally {
    client.release();
  }
}
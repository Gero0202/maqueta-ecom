import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q");

    let query = `
      SELECT
        o.order_id,
        o.mp_payment_id,
        o.user_id,
        o.status,
        o.created_at,
        o.total AS total_amount,
        u.name AS user_name,
        u.email AS user_email,
        oi.product_id,
        oi.quantity,
        oi.price,
        p.name AS product_name,
        p.image_url,
        a.street AS address_street,
        a.city AS address_city,
        a.province AS address_province,
        a.number_house AS address_number,
        a.zip_code AS address_zip_code,
        a.description AS address_description
      FROM orders o
      JOIN users u ON u.user_id = o.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON p.product_id = oi.product_id
      LEFT JOIN addresses a ON a.address_id = o.address_id
    `;

    let values: string[] = [];

    if (search) {
      query += `
        WHERE 
          CAST(o.order_id AS TEXT) ILIKE $1
          OR u.email ILIKE $2
          OR u.name ILIKE $3
        ORDER BY
          CASE
            WHEN CAST(o.order_id AS TEXT) ILIKE $1 THEN 1
            WHEN u.email ILIKE $2 THEN 2
            WHEN u.name ILIKE $3 THEN 3
            ELSE 4
          END,
          o.created_at DESC
      `;
      values = [`${search}`, `${search}%`, `%${search}%`];
    } else {
      query += ` ORDER BY o.created_at DESC`;
    }

    const result = await pool.query(query, values);

    // 🔹 Agrupamos los resultados por order_id
    const ordersMap = new Map<number, any>();

    for (const row of result.rows) {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          order_id: row.order_id,
          mp_payment_id: row.mp_payment_id,
          user_id: row.user_id,
          status: row.status,
          created_at: row.created_at,
          total_amount: row.total_amount,
          user_name: row.user_name,
          user_email: row.user_email,
          items: [],
          address: {
            street: row.address_street ?? "",
            city: row.address_city ?? "",
            province: row.address_province ?? "",
            number_house: row.address_number ?? "",
            zip_code: row.address_zip_code ?? "",
            description: row.address_description ?? "",
          },
        });
      }

      // Si hay producto, lo agregamos al array de items
      if (row.product_id) {
        const order = ordersMap.get(row.order_id);
        order.items.push({
          product_id: row.product_id,
          name: row.product_name ?? "",
          price: Number(row.price ?? 0),
          quantity: Number(row.quantity ?? 0),
          image_url: row.image_url ?? "",
        });
      }
    }

    const orders = Array.from(ordersMap.values());

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("❌ Error al buscar órdenes:", error);
    return NextResponse.json(
      { message: "Error interno del servidor al buscar órdenes." },
      { status: 500 }
    );
  }
}

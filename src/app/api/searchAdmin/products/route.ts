import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("q");

        let query = `
      SELECT 
          product_id,
          name,
          description,
          price,
          stock,
          category,
          image_url,
          created_at,
          updated_at
      FROM products
    `;

        let values: string[] = [];

        if (search) {
            query += `
        WHERE name ILIKE $1
           OR name ILIKE $2
           OR name ILIKE $3
        ORDER BY
          CASE
            WHEN name ILIKE $1 THEN 1
            WHEN name ILIKE $2 THEN 2
            WHEN name ILIKE $3 THEN 3
            ELSE 4
          END,
          name ASC
      `;
            values = [`${search}`, `${search}%`, `%${search}%`];
        } else {
            query += ` ORDER BY created_at DESC`;
        }

        const result = await pool.query(query, values);
        return NextResponse.json({ products: result.rows }, { status: 200 });
    } catch (error) {
        console.error("❌ Error al buscar productos:", error);
        return NextResponse.json(
            { message: "Error interno del servidor al buscar productos." },
            { status: 500 }
        );
    }
}

// ESTO ESTA SIN USAR

import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

interface RouteParams {
    params: Promise<{ category: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
    try {
        const { category } = await params;

        if (!category || category.trim() === "") {
            return NextResponse.json(
                { message: "El parámetro de categoría es obligatorio." },
                { status: 400 }
            );
        }

        const categoryFinal = category.trim().toLowerCase();

        const result = await pool.query(
            `SELECT 
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
       WHERE LOWER(category) = $1
       ORDER BY created_at DESC`,
            [categoryFinal]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { message: `No se encontraron productos en la categoría '${categoryFinal}'.` },
                { status: 404 }
            );
        }

        return NextResponse.json({ products: result.rows }, { status: 200 });
    } catch (error) {
        console.error("❌ Error al filtrar productos por categoría:", error);
        return NextResponse.json(
            { message: "Error interno al filtrar productos por categoría." },
            { status: 500 }
        );
    }
}

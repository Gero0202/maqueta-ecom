import pool from "@/app/lib/db";
import { NextResponse } from "next/server";


export async function GET(req: Request,  { params }: { params: Promise<{ category: string }> }) {
    try {
        const { category } = await params;

        if (!category) {
            return NextResponse.json(
                { message: "El parámetro de categoría es obligatorio" },
                { status: 400 }
            );
        }

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
            WHERE category = $1`,
            [category]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { message: "No se encontraron productos en esta categoría" },
                { status: 404 }
            );
        }

        return NextResponse.json({ products: result.rows }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: "Error al filtrar productos por categoría" },
            { status: 500 }
        );
    }
}

import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query")?.trim().toLowerCase() || "";

        if (!query) {
            return NextResponse.json({ results: [] }, { status: 200 });
        }

        if (query.length < 3) {
            return NextResponse.json(
                { message: "La búsqueda debe tener al menos 3 caracteres", results: [] },
                { status: 400 }
            );
        }
        if (query.length > 50) {
            return NextResponse.json(
                { message: "El término de búsqueda es demasiado largo", results: [] },
                { status: 400 }
            );
        }

        const safeQuery = query.replace(/[%_]/g, "\\$&");
        const searchText = `%${safeQuery}%`;

        const productResult = await pool.query(
            `
            SELECT 
                product_id AS id,
                name,
                description,
                category,
                price,
                stock,
                image_url
            FROM products
            WHERE LOWER(name) LIKE $1 ESCAPE '\\'
                OR LOWER(description) LIKE $1 ESCAPE '\\'
                OR LOWER(category) LIKE $1 ESCAPE '\\'
            ORDER BY name ASC
            LIMIT 30;
      `,
            [searchText]
        );

        const products = productResult.rows.map((product) => ({
            type: "product",
            id: product.id,
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            stock: product.stock,
            image_url: product.image_url,
        }));

        return NextResponse.json({ results: products }, { status: 200 });
    } catch (error: any) {
        console.error("Error en /api/searchs:", error.message);
        return NextResponse.json(
            { message: "Error interno del servidor en búsqueda" },
            { status: 500 }
        );
    }
}

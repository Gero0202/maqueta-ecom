import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query");

        if (!query) {
            return NextResponse.json({ results: [] });
        }

        const searchText = `%${query.toLowerCase()}%`;

        const productResult = await pool.query(
            `SELECT 
                product_id AS id,
                name,
                description,
                category,
                price,
                stock,
                image_url
            FROM products
            WHERE LOWER(name) LIKE $1 
               OR LOWER(description) LIKE $1
               OR LOWER(category) LIKE $1
            LIMIT 50;`,
            [searchText]
        );

        const products = (productResult?.rows || []).map((product) => ({
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
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Error del servidor en search" },
            { status: 500 }
        );
    }
}

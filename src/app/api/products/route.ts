import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { buildInsertQuery } from "@/app/lib/insertBuilder";
import { getAuthUser } from "@/app/lib/auth";


interface NewProduct {
    name: string;
    description?: string;
    price: number;
    stock: number;
    category: string;
    image_url?: string;
}



export async function GET(req: Request) {
    try {
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
            ORDER BY created_at DESC`
        );

        return NextResponse.json({ products: result.rows }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Error interno del servidor al obtener los productos." },
            { status: 500 }
        );
    }
}




export async function POST(req: Request) {
    try {
        const userObj = await getAuthUser();
        if (!userObj || userObj.role !== "admin") {
            return NextResponse.json(
                { message: "Solo administradores pueden crear productos" },
                { status: 403 }
            );
        }

        const { name, description, price, stock, category, image_url } =
            (await req.json()) as NewProduct;

        if (!name || !price || !stock || !category) {
            return NextResponse.json(
                { message: "Los campos name, price, stock y category son obligatorios" },
                { status: 400 }
            );
        }

        if (typeof price !== "number" || price <= 0) {
            return NextResponse.json(
                { message: "El precio debe ser un número mayor a 0" },
                { status: 400 }
            );
        }

        if (!Number.isInteger(stock) || stock < 0) {
            return NextResponse.json(
                { message: "El stock debe ser un número entero positivo" },
                { status: 400 }
            );
        }

        const productData = {
            name,
            description,
            price,
            stock,
            category,
            image_url,
        };

        const { text, values } = buildInsertQuery("products", productData, [
            "product_id",
            "name",
            "price",
            "stock",
            "category",
        ]);

        const result = await pool.query(text, values);

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Error interno al crear un producto" },
            { status: 500 }
        );
    }
}
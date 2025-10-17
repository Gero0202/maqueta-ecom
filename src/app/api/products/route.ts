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
        console.error("❌ Error al obtener productos:", error);
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

        const body = (await req.json()) as Partial<NewProduct>;
        const { name, description, price, stock, category, image_url } = body;

        if (!name || !price || stock === undefined || !category) {
            return NextResponse.json(
                { message: "Los campos name, price, stock y category son obligatorios" },
                { status: 400 }
            );
        }

        const trimmedName = name.trim();
        const trimmedCategory = category.trim().toLowerCase();

        if (trimmedName.length < 2 || trimmedName.length > 100) {
            return NextResponse.json(
                { message: "El nombre del producto debe tener entre 2 y 100 caracteres." },
                { status: 400 }
            );
        }

        if (typeof price !== "number" || isNaN(price) || price <= 0) {
            return NextResponse.json(
                { message: "El precio debe ser un número mayor a 0." },
                { status: 400 }
            );
        }

        if (!Number.isInteger(stock) || stock < 0) {
            return NextResponse.json(
                { message: "El stock debe ser un número entero positivo" },
                { status: 400 }
            );
        }


        //ACA CAMBIAR LAS CATEOGRIAS
        const allowedCategories = ["accesorios", "ropa", "libros", "musica"];
        if (!allowedCategories.includes(trimmedCategory)) {
            return NextResponse.json(
                { message: `Categoría no válida. Solo se permiten: ${allowedCategories.join(", ")}` },
                { status: 400 }
            );
        }

        if (image_url) {
            const validExtensions = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i;
            if (!validExtensions.test(image_url)) {
                return NextResponse.json(
                    { message: "Formato de imagen no válido. Solo se permiten jpg, jpeg, png, gif, webp." },
                    { status: 400 }
                );
            }
        }

        // ❌ Evitar duplicados por nombre
        const duplicateCheck = await pool.query(
            "SELECT 1 FROM products WHERE LOWER(name) = LOWER($1) LIMIT 1",
            [trimmedName]
        );

        if ((duplicateCheck?.rowCount ?? 0) > 0) {
            return NextResponse.json(
                { message: "Ya existe un producto con ese nombre." },
                { status: 409 }
            );
        }

        const productData = {
            name: trimmedName,
            description: description?.trim() || null,
            price,
            stock,
            category: trimmedCategory,
            image_url: image_url?.trim() || null,
        };

        const { text, values } = buildInsertQuery("products", productData, [
            "product_id",
            "name",
            "price",
            "stock",
            "category",
        ]);

        const result = await pool.query(text, values);

        return NextResponse.json(
            { message: "Producto creado correctamente.", product: result.rows[0] },
            { status: 201 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Error interno al crear un producto" },
            { status: 500 }
        );
    }
}
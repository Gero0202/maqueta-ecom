import { getAuthUser } from "@/app/lib/auth";
import pool from "@/app/lib/db";
import { Product } from "@/app/types/Product";
import { NextResponse } from "next/server";

interface UpdateData {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    category?: string;
    image_url?: string;
    updated_at: string;
}

interface RouteParams {
    params: Promise<{
        id: string
    }>
}


export async function GET(req: Request, context: RouteParams) {
    try {
        const { id } = await context.params

        if (!/^\d+$/.test(id)) {
            return NextResponse.json(
                { message: "El ID del producto debe ser un número entero válido." },
                { status: 400 }
            );
        }

        const productId = parseInt(id, 10);

        const currentUser = await getAuthUser()


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
            WHERE product_id = $1`,
            [productId]
        );


        if (result.rows.length === 0) {
            return NextResponse.json(
                { message: "No se encontró ningún producto con ese ID." },
                { status: 404 }
            )
        }

        const rawProduct = result.rows[0] as Product

        const formattedProduct: Product = { ...rawProduct }

        return NextResponse.json({ product: formattedProduct }, { status: 200 })
    } catch (error) {
        return NextResponse.json(
            { message: "No se pudo obtener el product. error internal server" },
            { status: 500 }
        )
    }
}

export async function PUT(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        if (!/^\d+$/.test(id)) {
            return NextResponse.json(
                { message: "El ID del producto debe ser un número entero válido." },
                { status: 400 }
            );
        }
        const productId = parseInt(id, 10);

        const userObj = await getAuthUser();
        if (!userObj || userObj.role !== "admin") {
            return NextResponse.json(
                { message: "Solo administradores pueden actualizar productos." },
                { status: 403 }
            );
        }

        const body = (await req.json()) as Partial<UpdateData>;
        const { name, description, price, stock, category, image_url } = body;

        const productCheck = await pool.query(
            "SELECT * FROM products WHERE product_id = $1",
            [productId]
        );

        if (productCheck.rowCount === 0) {
            return NextResponse.json(
                { message: "Producto no encontrado." },
                { status: 404 }
            );
        }

        if (name && (name.trim().length < 2 || name.trim().length > 100)) {
            return NextResponse.json(
                { message: "El nombre debe tener entre 2 y 100 caracteres." },
                { status: 400 }
            );
        }

        if (description && description.trim().length > 500) {
            return NextResponse.json(
                { message: "La descripción no puede exceder 500 caracteres." },
                { status: 400 }
            );
        }

        if (price !== undefined) {
            const numericPrice = Number(price);
            if (isNaN(numericPrice) || numericPrice <= 0) {
                return NextResponse.json(
                    { message: "El precio debe ser un número mayor a 0." },
                    { status: 400 }
                );
            }
        }

        if (stock !== undefined) {
            const numericStock = Number(stock);
            if (!Number.isInteger(numericStock) || numericStock < 0) {
                return NextResponse.json(
                    { message: "El stock debe ser un número entero mayor o igual a 0." },
                    { status: 400 }
                );
            }
        }

        const allowedCategories = ["accesorios", "ropa", "libros", "musica"];
        if (category && !allowedCategories.includes(category.toLowerCase())) {
            return NextResponse.json(
                { message: `Categoría no válida. Solo se permiten: ${allowedCategories.join(", ")}` },
                { status: 400 }
            );
        }

        if (image_url) {
            const validImageUrl = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i;
            if (!validImageUrl.test(image_url)) {
                return NextResponse.json(
                    { message: "Formato de imagen no válido. Debe ser una URL válida (jpg, jpeg, png, gif o webp)." },
                    { status: 400 }
                );
            }
        }

        if (name) {
            const duplicateCheck = await pool.query(
                "SELECT 1 FROM products WHERE LOWER(name) = LOWER($1) AND product_id != $2 LIMIT 1",
                [name.trim(), productId]
            );
            if ((duplicateCheck?.rowCount ?? 0) > 0) {
                return NextResponse.json(
                    { message: "Ya existe otro producto con ese nombre." },
                    { status: 409 }
                );
            }
        }

        const updateFields = {
            name: name?.trim(),
            description: description?.trim(),
            price,
            stock,
            category: category?.trim().toLowerCase(),
            image_url: image_url?.trim(),
            updated_at: new Date(),
        };

        const entries = Object.entries(updateFields).filter(
            ([, value]) => value !== undefined && value !== null
        );

        if (entries.length === 0) {
            return NextResponse.json(
                { message: "No se proporcionaron datos para actualizar." },
                { status: 400 }
            );
        }

        const setClause = entries.map(([key], i) => `${key} = $${i + 1}`).join(", ");
        const values = entries.map(([, value]) => value);

        const sql = `
            UPDATE products 
            SET ${setClause}
            WHERE product_id = $${entries.length + 1}
            RETURNING product_id, name, description, price, stock, category, image_url, updated_at
    `;

        const result = await pool.query(sql, [...values, productId]);

        return NextResponse.json(
            { message: "Producto actualizado correctamente.", product: result.rows[0] },
            { status: 200 }
        );

    } catch (error) {
        console.error("❌ Error al actualizar producto:", error);
        return NextResponse.json(
            { message: "Error interno del servidor al actualizar el producto." },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        if (!/^\d+$/.test(id)) {
            return NextResponse.json(
                { message: "El ID del producto debe ser un número entero válido." },
                { status: 400 }
            );
        }

        const productId = parseInt(id, 10);

        const userObj = await getAuthUser();
        if (!userObj) {
            return NextResponse.json(
                { message: "No autenticado. Debes iniciar sesión." },
                { status: 401 }
            );
        }

        if (userObj.role !== "admin") {
            return NextResponse.json(
                { message: "Solo los administradores pueden eliminar productos." },
                { status: 403 }
            );
        }

        const checkProduct = await pool.query(
            "SELECT product_id, name FROM products WHERE product_id = $1",
            [productId]
        );

        if (checkProduct.rowCount === 0) {
            return NextResponse.json(
                { message: "El producto que intenta eliminar no existe." },
                { status: 404 }
            );
        }

        const productName = checkProduct.rows[0].name;

        const result = await pool.query(
            "DELETE FROM products WHERE product_id = $1",
            [productId]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { message: "No se pudo eliminar el producto." },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: `Producto '${productName}' eliminado correctamente.` },
            { status: 200 }
        );

    } catch (error) {
        console.error("❌ Error al eliminar producto:", error);
        return NextResponse.json(
            { message: "Error interno del servidor al eliminar el producto." },
            { status: 500 }
        );
    }
}
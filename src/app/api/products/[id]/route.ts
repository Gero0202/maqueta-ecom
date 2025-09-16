import { getAuthUser } from "@/app/lib/auth";
import pool from "@/app/lib/db";
import { Product } from "@/app/types/Product";
import { NextResponse } from "next/server";

interface UpdateData {
    title?: string;
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

        const productId = parseInt(id, 10)
        if (isNaN(productId)) {
            return NextResponse.json(
                { message: "El ID del product no es un numero" },
                { status: 404 }
            )
        }

        const currentUser = await getAuthUser()


        const result = await pool.query(
            `SELECT 
                product_id,
                title,
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
                { message: "No se encontraron loops con ese ID" },
                { status: 404 }
            )
        }

        const rawProduct = result.rows[0] as Product

        const formattedProduct: Product = { ...rawProduct }

        return NextResponse.json({ product: formattedProduct }, { status: 200 })
    } catch (error) {
        return NextResponse.json(
            { message: "No se pudo obtener el loop. error internal server" },
            { status: 500 }
        )
    }
}

export async function PUT(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params

        const productId = parseInt(id, 10)
        if (isNaN(productId)) {
            return NextResponse.json(
                { message: "El ID del product no es un formato valido" },
                { status: 404 }
            )
        }

        const userObj = await getAuthUser()
        if (!userObj || userObj.role !== "admin") {
            return NextResponse.json(
                { message: "Solo admins pueden actualizar productos" },
                { status: 401 }
            );
        }


        const { title, description, price, stock, category, image_url } = (await req.json()) as UpdateData;

        const fields = {
            title,
            description,
            price,
            stock,
            category,
            image_url,
            updated_at: new Date(),
        };

        if (title && title.length > 255)
            return NextResponse.json(
                { message: "El título es demasiado largo" },
                { status: 400 }
            );

        if (description && description.length > 500)
            return NextResponse.json(
                { message: "La descripción es demasiado larga" },
                { status: 400 }
            );

        if (price !== undefined && (typeof price !== "number" || price < 0))
            return NextResponse.json(
                { message: "El precio debe ser un número mayor o igual a 0" },
                { status: 400 }
            );

        if (stock !== undefined && (typeof stock !== "number" || stock < 0))
            return NextResponse.json(
                { message: "El stock debe ser un número mayor o igual a 0" },
                { status: 400 }
            );

        if (image_url && !image_url.startsWith("http"))
            return NextResponse.json(
                { message: "La URL de la imagen no es válida" },
                { status: 400 }
            );


        const entries = Object.entries(fields).filter(
            ([_, value]) => value !== undefined && value !== null
        );

        if (entries.length === 0) {
            return NextResponse.json(
                { message: "Datos insuficientes para actualizar" },
                { status: 400 }
            );
        }

        const setClause = entries
            .map(([key], index) => `${key} = $${index + 1}`)
            .join(", ")

        const values = entries.map(([_, value]) => value)

        const sql = `UPDATE products SET ${setClause} WHERE product_id = $${entries.length + 1
            } RETURNING product_id, title, description, price, stock, category, image_url`;

        const result = await pool.query(sql, [...values, productId]);


        if (result.rowCount === 0) {
            return NextResponse.json(
                { message: "Producto no encontrado" },
                { status: 400 }
            );
        }

        return NextResponse.json(result.rows[0], { status: 200 })

    } catch (error) {
        return NextResponse.json(
            { message: "No se pudo actualizar el producto. error internal server" },
            { status: 500 }
        )
    }
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        const productId = parseInt(id, 10);
        if (isNaN(productId)) {
            return NextResponse.json(
                { message: "El ID del producto no es un formato válido" },
                { status: 400 }
            );
        }

        const getProduct = await pool.query(
            "SELECT * FROM products WHERE product_id = $1",
            [productId]
        );

        if (getProduct.rowCount === 0) {
            return NextResponse.json(
                { message: "No existe el producto que intenta eliminar" },
                { status: 404 }
            );
        }

        const userObj = await getAuthUser();
        if (!userObj || userObj.role !== "admin") {
            return NextResponse.json(
                { message: "Solo administradores pueden eliminar productos" },
                { status: 401 }
            );
        }

        const result = await pool.query(
            "DELETE FROM products WHERE product_id = $1",
            [productId]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { message: "No se pudo eliminar el producto" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Producto eliminado correctamente" },
            { status: 200 }
        )

    } catch (error) {
        return NextResponse.json(
            { message: "No se pudo eliminar el loop. error internal server" },
            { status: 500 }
        )
    }
}
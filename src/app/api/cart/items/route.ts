import { getAuthUser } from "@/app/lib/auth";
import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

interface Body {
    product_id: number;
    quantity?: number;
}

export async function POST(req: Request) {
    const client = await pool.connect();
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ message: "No autenticado" }, { status: 401 });

        if (user.role === "admin") {
            return NextResponse.json(
                { message: "Los administradores no pueden agregar productos al carrito" },
                { status: 403 }
            );
        }

        const { product_id, quantity = 1 } = (await req.json()) as Body;

        if (typeof product_id !== "number" || typeof quantity !== "number") {
            return NextResponse.json({ message: "Tipos de datos inválidos" }, { status: 400 });
        }

        if (!product_id || quantity <= 0) {
            return NextResponse.json({ message: "product_id y quantity válidos son requeridos" }, { status: 400 });
        }

        await client.query('BEGIN');

        const prodRes = await client.query(
            `SELECT product_id, stock, price FROM products WHERE product_id = $1`,
            [product_id]
        );
        if (prodRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: `El producto con ID ${product_id} no existe` }, { status: 404 });
        }
        const prod = prodRes.rows[0];

        if (prod.stock <= 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Producto sin stock disponible" }, { status: 400 });
        }

        let cartRes = await client.query(
            `SELECT cart_id FROM carts WHERE user_id = $1 AND status = 'active' LIMIT 1`,
            [user.user_id]
        );
        let cartId;
        if (cartRes.rows.length === 0) {
            const insertRes = await client.query(
                `INSERT INTO carts (user_id, status) VALUES ($1, 'active') RETURNING cart_id`,
                [user.user_id]
            );
            cartId = insertRes.rows[0].cart_id;
        } else {
            cartId = cartRes.rows[0].cart_id;
        }

        const existing = await client.query(
            `SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
            [cartId, product_id]
        );

        let newQty = quantity;

        if (existing.rows.length > 0) {
            newQty += existing.rows[0].quantity;

            if (newQty > prod.stock) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { message: "La cantidad total en el carrito excede el stock disponible" },
                    { status: 400 }
                );
            }

            await client.query(
                `UPDATE cart_items SET quantity = $1, updated_at = now() WHERE cart_item_id = $2`,
                [newQty, existing.rows[0].cart_item_id]
            );
        } else {
            if (newQty > prod.stock) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { message: "La cantidad total en el carrito excede el stock disponible" },
                    { status: 400 }
                );
            }

            await client.query(
                `INSERT INTO cart_items (cart_id, product_id, quantity, unit_price, created_at)
                 VALUES ($1, $2, $3, $4, now())`,
                [cartId, product_id, newQty, prod.price]
            );
        }

        await client.query('COMMIT');

        return NextResponse.json(
            {
                message: "Ítem agregado/actualizado en el carrito",
                cart_id: cartId,
                total_quantity: newQty
            },
            { status: 200 }
        );
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    } finally {
        client.release();
    }
}

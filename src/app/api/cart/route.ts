import { getAuthUser } from "@/app/lib/auth";
import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ message: "No autenticado" }, { status: 401 });

        const cartRes = await pool.query(
            `SELECT cart_id, user_id, status, created_at FROM carts WHERE user_id = $1 AND status = 'active' LIMIT 1`,
            [user.user_id]
        );

        if (cartRes.rows.length === 0) {
            return NextResponse.json({ cart: null }, { status: 200 });
        }

        const cart = cartRes.rows[0];

        const itemsRes = await pool.query(
            `SELECT ci.cart_item_id, ci.product_id, ci.quantity, ci.unit_price,
              p.name, p.image_url, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.cart_id = $1`,
            [cart.cart_id]
        );

        const items = itemsRes.rows.map((r) => ({
            cart_item_id: r.cart_item_id,
            product_id: r.product_id,
            quantity: r.quantity,
            unit_price: r.unit_price,
            name: r.name,
            image_url: r.image_url,
            stock: r.stock
        }));

        const total = items.reduce((s, it) => s + Number(it.unit_price) * Number(it.quantity), 0);

        return NextResponse.json({ cart: { ...cart, items, total: total.toFixed(2) } }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    }
}

export async function DELETE() {
    const client = await pool.connect();
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ message: "No autenticado" }, { status: 401 });

        await client.query('BEGIN');

        const cartRes = await client.query(
            `SELECT cart_id, status FROM carts WHERE user_id = $1 AND status = 'active' LIMIT 1`,
            [user.user_id]
        );

        if (cartRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Carrito no encontrado" }, { status: 404 });
        }

        const { cart_id, status } = cartRes.rows[0];
        if (status === 'abandoned') {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Carrito ya abandonado" }, { status: 400 });
        }

        const deleteRes = await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cart_id]);

        await client.query(
            `UPDATE carts SET status = 'abandoned', updated_at = now() WHERE cart_id = $1`,
            [cart_id]
        );

        await client.query('COMMIT');

        return NextResponse.json({
            message: "Carrito vaciado",
            cart_id,
            deleted_items: deleteRes.rowCount
        }, { status: 200 });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    } finally {
        client.release();
    }
}

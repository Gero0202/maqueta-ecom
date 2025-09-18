import { getAuthUser } from "@/app/lib/auth";
import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

interface Body {
    quantity?: number;
}

interface Params {
    params: Promise<{
        productId: string
    }>
}

export async function PUT(req: Request, { params }: Params) {
    const client = await pool.connect();
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ message: "No autenticado" }, { status: 401 });

        const { productId } = await params;
        const productIdConst = parseInt(productId, 10);
        const { quantity } = (await req.json()) as Body;

        if (quantity === undefined || isNaN(quantity)) {
            return NextResponse.json({ message: "quantity es obligatorio" }, { status: 400 });
        }

        await client.query("BEGIN");

        const cartRes = await client.query(
            `SELECT cart_id FROM carts WHERE user_id = $1 AND status = 'active' LIMIT 1 FOR UPDATE`,
            [user.user_id]
        );
        if (cartRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json({ message: "Carrito no encontrado" }, { status: 404 });
        }
        const cartId = cartRes.rows[0].cart_id;

        const prodRes = await client.query(
            `SELECT stock FROM products WHERE product_id = $1`,
            [productIdConst]
        );
        if (prodRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 });
        }
        const stock = prodRes.rows[0].stock;

        const currentItemRes = await client.query(
            `SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
            [cartId, productIdConst]
        );
        const currentQuantity = currentItemRes.rows[0]?.quantity || 0;

        if (quantity > stock) {
            await client.query("ROLLBACK");
            return NextResponse.json(
                { message: "La cantidad solicitada supera el stock disponible" },
                { status: 400 }
            );
        }

        if (quantity <= 0) {
            await client.query(
                `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
                [cartId, productIdConst]
            );
            await client.query("COMMIT");
            return NextResponse.json({ message: "Item eliminado" }, { status: 200 });
        } else {
            const updateRes = await client.query(
                `UPDATE cart_items 
                 SET quantity = $1, updated_at = now() 
                 WHERE cart_id = $2 AND product_id = $3 
                 RETURNING *`,
                [quantity, cartId, productIdConst]
            );

            if (updateRes.rowCount === 0) {
                await client.query("ROLLBACK");
                return NextResponse.json({ message: "Item no encontrado en el carrito" }, { status: 404 });
            }

            await client.query("COMMIT");
            return NextResponse.json(
                { message: "Cantidad actualizada", item: updateRes.rows[0] },
                { status: 200 }
            );
        }
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    } finally {
        client.release();
    }
}


export async function DELETE(req: Request, { params }: Params) {
    const client = await pool.connect();
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ message: "No autenticado" }, { status: 401 });
        }

        await client.query("BEGIN");

        const { productId } = await params;
        const productIdConst = parseInt(productId, 10);

        const cartRes = await client.query(
            `SELECT cart_id FROM carts WHERE user_id = $1 AND status = 'active' FOR UPDATE`,
            [user.user_id]
        );
        if (cartRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json({ message: "Carrito no encontrado" }, { status: 404 });
        }
        const cartId = cartRes.rows[0].cart_id;

        const delRes = await client.query(
            `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2 RETURNING *`,
            [cartId, productIdConst]
        );

        if (delRes.rowCount === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json({ message: "Item no encontrado en carrito" }, { status: 404 });
        }

        await client.query("COMMIT");

        return NextResponse.json(
            { message: "Item eliminado", item: delRes.rows[0] },
            { status: 200 }
        );
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    } finally {
        client.release();
    }
}

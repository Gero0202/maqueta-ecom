import { getAuthUser } from "@/app/lib/auth";
import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

interface Body {
    quantity?: number;
}

export async function PUT(req: Request, { params }: { params: { productId: string } }) {
    const client = await pool.connect();
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ message: "No autenticado" }, { status: 401 });

        const productId = parseInt(params.productId, 10);
        const { quantity } = (await req.json()) as Body;
        if (quantity === undefined || isNaN(quantity)) {
            return NextResponse.json({ message: "quantity es obligatorio" }, { status: 400 });
        }

        await client.query('BEGIN');

        // obtener carrito activo
        const cartRes = await pool.query(`SELECT cart_id FROM carts WHERE user_id = $1 AND status = 'active' LIMIT 1`, [user.user_id]);
        if (cartRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Carrito no encontrado" }, { status: 404 });
        }
        const cartId = cartRes.rows[0].cart_id;

        // validar producto y stock
        const prodRes = await pool.query(`SELECT stock FROM products WHERE product_id = $1`, [productId]);
        if (prodRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 });
        }
        const stock = prodRes.rows[0].stock;

        // Obtener la cantidad actual del artículo en el carrito
        const currentItemRes = await client.query(`SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`, [cartId, productId]);
        const currentQuantity = currentItemRes.rows[0]?.quantity || 0;

        const quantityChange = quantity - currentQuantity;

        if (quantityChange > stock) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "La cantidad solicitada supera el stock disponible" }, { status: 400 });
        }

        if (quantity <= 0) {
            // Eliminar artículo
            const deleteRes = await client.query(`DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2 RETURNING quantity`, [cartId, productId]);
            if (deleteRes.rows[0]) {
                await client.query(`UPDATE products SET stock = stock + $1 WHERE product_id = $2`, [deleteRes.rows[0].quantity, productId]);
            }

            await client.query('COMMIT');
            return NextResponse.json({ message: "Item eliminado" }, { status: 200 });
        } else {
            // Actualizar
            const updateRes = await client.query(
                `UPDATE cart_items SET quantity = $1, updated_at = now() WHERE cart_id = $2 AND product_id = $3 RETURNING *`,
                [quantity, cartId, productId]
            );
            if (updateRes.rowCount === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: "Item no encontrado en el carrito" }, { status: 404 });
            }

            // Ajustar el stock en función del cambio de cantidad
            // await client.query(`UPDATE products SET stock = stock - $1 WHERE product_id = $2`, [quantityChange, productId]);

            await client.query('COMMIT');
            return NextResponse.json({ message: "Cantidad actualizada", item: updateRes.rows[0] }, { status: 200 });
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    } finally{
        client.release();
    }
}

export async function DELETE(req: Request, { params }: { params: { productId: string } }) {
    const client = await pool.connect();
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ message: "No autenticado" }, { status: 401 });

        await client.query('BEGIN');

        const productId = parseInt(params.productId, 10);
        
        const cartRes = await client.query(`SELECT cart_id FROM carts WHERE user_id = $1 AND status = 'active' FOR UPDATE`, [user.user_id]);
        if (cartRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Carrito no encontrado" }, { status: 404 });
        }
        const cartId = cartRes.rows[0].cart_id;

        // Elimina el artículo del carrito y devuelve la cantidad para restaurar el stock
        const delRes = await client.query(
            `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2 RETURNING quantity`,
            [cartId, productId]
        );

        if (delRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Item no encontrado en carrito" }, { status: 404 });
        }

        // Restaura la cantidad eliminada al stock del producto
        // const deletedQuantity = delRes.rows[0].quantity;
        // await client.query(
        //     `UPDATE products SET stock = stock + $1 WHERE product_id = $2`,
        //     [deletedQuantity, productId]
        // );

        await client.query('COMMIT');

        return NextResponse.json({ message: "Item eliminado y stock restaurado" }, { status: 200 });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    } finally {
        client.release();
    }
}
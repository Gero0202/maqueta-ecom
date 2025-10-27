import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/auth";
import { Order, OrderItem } from "@/app/types/Order";

type Params = {
    params: Promise<{ id: string }>;
};

type OrderStatus = Order["status"];

export async function GET(req: Request, { params }: Params) {
    const client = await pool.connect();

    try {
        const user = await getAuthUser();

        if (!user || user.role !== "admin") {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        const { id } = await params
        const orderId = parseInt(id);
        if (isNaN(orderId)) {
            return NextResponse.json({ message: "ID de orden inválido" }, { status: 400 });
        }

        const query = `
      SELECT
        o.*,
        u.name AS user_name,
        u.email AS user_email,
        oi.product_id,
        oi.quantity,
        oi.price,
        p.name AS product_name,
        p.image_url
      FROM orders o
      JOIN users u ON u.user_id = o.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON p.product_id = oi.product_id
      WHERE o.order_id = $1
    `;

        const res = await client.query(query, [orderId]);

        if (res.rows.length === 0) {
            return NextResponse.json({ message: "Orden no encontrada" }, { status: 404 });
        }

        const firstRow = res.rows[0];
        const order: Order & { user_name: string; user_email: string } = {
            order_id: firstRow.order_id,
            user_id: firstRow.user_id,
            payment_id: firstRow.payment_id,
            mp_payment_id: firstRow.mp_payment_id,
            total_amount: Number(firstRow.total),
            status: firstRow.status,
            created_at: firstRow.created_at,
            updated_at: firstRow.updated_at,
            user_name: firstRow.user_name,
            user_email: firstRow.user_email,
            items: [],
        };

        for (const row of res.rows) {
            if (row.product_id) {
                order.items.push({
                    product_id: row.product_id,
                    quantity: Number(row.quantity),
                    price: Number(row.price),
                });
            }
        }

        return NextResponse.json({ order }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error al obtener orden" }, { status: 500 });
    } finally {
        client.release();
    }
}


export async function PATCH(req: Request, { params }: Params) {
    const client = await pool.connect();

    try {
        const user = await getAuthUser();
        if (!user || user.role !== "admin") {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status: newStatus } = body as { status: OrderStatus };

        if (!newStatus) {
            return NextResponse.json(
                { message: "El campo 'status' es requerido" },
                { status: 400 }
            );
        }

        const validStatuses: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(newStatus)) {
            return NextResponse.json(
                { message: `Estado inválido. Debe ser uno de: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        const result = await client.query(
            `
            UPDATE orders
            SET status = $1, updated_at = NOW()
            WHERE order_id = $2
            RETURNING *
            `,
            [newStatus, id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ message: "Orden no encontrada" }, { status: 404 });
        }

        const updatedOrder = result.rows[0];

        const detailsRes = await client.query(
            `
            SELECT
                o.*,
                u.name AS user_name,
                u.email AS user_email,
                oi.product_id,
                oi.quantity,
                oi.price,
                p.name AS product_name,
                p.image_url
            FROM orders o
            JOIN users u ON u.user_id = o.user_id
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN products p ON p.product_id = oi.product_id
            WHERE o.order_id = $1
            `,
            [id]
        );

        const orderWithItems = {
            order_id: updatedOrder.order_id,
            user_id: updatedOrder.user_id,
            total_amount: Number(updatedOrder.total),
            status: updatedOrder.status,
            created_at: updatedOrder.created_at,
            updated_at: updatedOrder.updated_at,
            user_name: detailsRes.rows[0].user_name,
            user_email: detailsRes.rows[0].user_email,
            items: detailsRes.rows
                .filter((r) => r.product_id)
                .map((r) => ({
                    product_id: r.product_id,
                    quantity: Number(r.quantity),
                    price: Number(r.price),
                    name: r.product_name,
                    image_url: r.image_url,
                })),
        };

        return NextResponse.json({ order: orderWithItems }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error al actualizar orden" }, { status: 500 });
    } finally {
        client.release();
    }
}


export async function DELETE(req: Request, { params }: Params) {
    const client = await pool.connect();

    try {
        const user = await getAuthUser();
        if (!user || user.role !== "admin") {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        const { id } = await params;

        const orderResult = await client.query(
            `SELECT status FROM orders WHERE order_id = $1`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            return NextResponse.json({ message: "Orden no encontrada" }, { status: 404 });
        }

        const currentStatus = orderResult.rows[0].status;

        // 2. Solo se puede borrar si está "pending"
        // if (currentStatus !== "pending") {
        //     return NextResponse.json(
        //         { message: `No se puede eliminar una orden con estado '${currentStatus}'` },
        //         { status: 400 }
        //     );
        // }

        // 3. Eliminar la orden y sus ítems asociados
        await client.query("BEGIN");

        await client.query(`DELETE FROM order_items WHERE order_id = $1`, [id]);
        await client.query(`DELETE FROM orders WHERE order_id = $1`, [id]);

        await client.query("COMMIT");

        return NextResponse.json(
            { message: "Orden eliminada correctamente" },
            { status: 200 }
        );
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);
        return NextResponse.json({ message: "Error al eliminar orden" }, { status: 500 });
    } finally {
        client.release();
    }
}
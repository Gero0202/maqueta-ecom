// src/app/api/admin/mp/paymentsOrderAdmin/[orderId]/route.ts
import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/auth";

interface Params {
    params: { orderId: string };
}

export async function GET(req: Request, { params }: Params) {
    const client = await pool.connect();

    try {
        const user = await getAuthUser();
        if (!user || !user.is_admin) {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        const { orderId } = params;

        // Traemos el pago asociado a la orden y la info del usuario
        const res = await client.query(
            `
      SELECT 
        p.mp_payment_id,
        p.status AS payment_status,
        p.status_detail,
        p.transaction_amount,
        p.net_received_amount,
        p.currency_id,
        p.payment_method,
        p.installments,
        p.date_created,
        p.date_approved,
        u.user_id,
        u.name AS user_name,
        u.email AS user_email
      FROM payments p
      JOIN orders o ON o.mp_payment_id = p.mp_payment_id
      JOIN users u ON u.user_id = o.user_id
      WHERE o.order_id = $1
      `,
            [orderId]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ message: "Orden no encontrada" }, { status: 404 });
        }

        const payment = res.rows[0];

        // Traemos los items de la orden
        const itemsRes = await client.query(
            `
      SELECT oi.product_id, pr.name, oi.quantity, oi.price
      FROM order_items oi
      JOIN products pr ON pr.product_id = oi.product_id
      WHERE oi.order_id = $1
      `,
            [orderId]
        );

        const paymentData = {
            mp_payment_id: payment.mp_payment_id,
            status: payment.payment_status,
            status_detail: payment.status_detail,
            transaction_amount: Number(payment.transaction_amount),
            net_received_amount: Number(payment.net_received_amount),
            currency_id: payment.currency_id,
            payment_method: payment.payment_method,
            installments: payment.installments,
            date_created: payment.date_created,
            date_approved: payment.date_approved,
            user: {
                user_id: payment.user_id,
                name: payment.user_name,
                email: payment.user_email
            },
            items: itemsRes.rows.map(i => ({
                product_id: i.product_id,
                name: i.name,
                quantity: i.quantity,
                price: i.price
            }))
        };

        return NextResponse.json({ paymentData }, { status: 200 });

    } catch (error) {
        console.error("❌ Error al obtener pago por orden admin:", error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    } finally {
        client.release();
    }
}

import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { payment } from "@/app/lib/mp/mp.config";
import { validateSignature } from "@/app/lib/mp/validSignature";
import { mapMpStatusToOrderState } from "@/app/lib/mp/mpStatusMapper";

export async function POST(req: Request) {
    const client = await pool.connect();

    try {
        // 1️⃣ Validamos la firma
        const result = await validateSignature(req);

        if (result.ignored) {
            console.log(`🔕 Tipo de webhook ignorado: ${result.type}`);
            return NextResponse.json({ message: "Tipo ignorado" }, { status: 200 });
        }

        if (!result.valid) {
            console.warn("⚠️", result.reason);
            return NextResponse.json({ message: result.reason }, { status: 403 });
        }

        console.log("✅ Firma válida. Procesando webhook...");

        // 2️⃣ Obtenemos los datos del pago desde Mercado Pago
        let paymentData;
        try {
            const paymentMp = await payment.get({ id: result.dataId! });
            paymentData = paymentMp;
           
        } catch (err) {
            console.error("❌ Error al consultar el pago en Mercado Pago:", err);
            return NextResponse.json({ message: "Error al obtener el pago de Mercado Pago" }, { status: 502 });
        }

        console.log("💬 Notificación recibida. Payment ID:", result.dataId);
        console.log("🧾 PAYMENT DATA:", paymentData);

        const userId = paymentData.metadata?.user_id;
        const cartId = paymentData.metadata?.cart_id;

        if (!userId || !cartId) {
            return NextResponse.json(
                { message: "Faltan metadatos en el pago" },
                { status: 400 }
            );
        }

        const mpStatus = paymentData.status;
        const mpStatusDetail = paymentData.status_detail;
        const internalStatus = mapMpStatusToOrderState(mpStatus!, mpStatusDetail);

        // 3️⃣ Guardamos la orden solo si el pago fue aprobado
        if (internalStatus === "paid") {
            await client.query("BEGIN");

            // Creamos la orden en la tabla `orders`
            const orderRes = await client.query(
                `
        INSERT INTO orders (user_id, total, status, mp_payment_id, created_at, updated_at)
        SELECT c.user_id,
               SUM(ci.unit_price * ci.quantity) AS total,
               $1, $2, NOW(), NOW()
        FROM carts c
        JOIN cart_items ci ON c.cart_id = ci.cart_id
        WHERE c.cart_id = $3
        GROUP BY c.user_id
        RETURNING order_id
        `,
                [internalStatus, paymentData.id, cartId]
            );

            const orderId = orderRes.rows[0].order_id;

            // Copiamos los ítems del carrito a order_items
            await client.query(
                `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        SELECT $1, product_id, quantity, unit_price
        FROM cart_items
        WHERE cart_id = $2
        `,
                [orderId, cartId]
            );

            // Actualizamos estado del carrito
            await client.query(
                `UPDATE carts SET status = 'completed', updated_at = NOW() WHERE cart_id = $1`,
                [cartId]
            );

            await client.query("COMMIT");
            console.log("✅ Orden creada correctamente:", orderId);
        } else {
            // Si el pago está pendiente o rechazado, igual actualizamos el carrito
            await client.query(
                `UPDATE carts SET status = $1, updated_at = NOW() WHERE cart_id = $2`,
                [internalStatus, cartId]
            );
            console.log(`ℹ️ Carrito actualizado con estado ${internalStatus}`);
        }

        console.log(`WEBHOOK CORRECTO, ${paymentData}`);
        return NextResponse.json(
            { message: "Webhook procesado correctamente" },
            { status: 200 }
        );
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("❌ Error en el webhook:", error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    } finally {
        client.release();
    }
}

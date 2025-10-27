import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { payment } from "@/app/lib/mp/mp.config";
import { validateSignature } from "@/app/lib/mp/validSignature";
import { mapMpStatusToOrderState } from "@/app/lib/mp/mpStatusMapper";
import sendEmailPaymentStatus from "@/app/lib/sendEmailPaymentStatus";
import { getAuthUser } from "@/app/lib/auth";

export async function POST(req: Request) {
    const client = await pool.connect();
    let inTransaction = false

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

        const paymentRes = await client.query(
            `
            INSERT INTO payments (
                mp_payment_id, cart_id, user_id, address_id, status, status_detail,
                transaction_amount, net_received_amount, currency_id, payment_method,
                installments, payer_email, payer_dni, description, date_created, date_approved, updated_at,
                rejection_notified
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, NOW(), FALSE)
            ON CONFLICT (mp_payment_id) DO UPDATE
            SET
                status = EXCLUDED.status,
                status_detail = EXCLUDED.status_detail,
                transaction_amount = EXCLUDED.transaction_amount,
                net_received_amount = EXCLUDED.net_received_amount,
                payment_method = EXCLUDED.payment_method,
                installments = EXCLUDED.installments,
                updated_at = NOW()
            RETURNING payment_id;   
    `,
            [
                paymentData.id,
                paymentData.metadata?.cart_id ?? null,
                paymentData.metadata?.user_id ?? null,
                paymentData.metadata?.address_id ?? null,
                paymentData.status,
                paymentData.status_detail,
                paymentData.transaction_amount,
                paymentData.transaction_details?.net_received_amount ?? null,
                paymentData.currency_id,
                paymentData.payment_method_id,
                paymentData.installments,
                paymentData.payer?.email ?? null,
                paymentData.payer?.identification?.number ?? null,
                paymentData.description,
                paymentData.date_created,
                paymentData.date_approved
            ]
        );

        const paymentId = paymentRes.rows[0].payment_id

        console.log("💬 Notificación recibida. Payment ID:", result.dataId);
        console.log("🧾 PAYMENT DATA:", paymentData);

        const userId = paymentData.metadata?.user_id;
        const cartId = paymentData.metadata?.cart_id;
        const addressId = paymentData.metadata.address_id

        if (!userId || !cartId || !addressId) {
            return NextResponse.json(
                { message: "Faltan metadatos en el pago" },
                { status: 400 }
            );
        }

        const mpStatus = paymentData.status;
        const mpStatusDetail = paymentData.status_detail;
        const internalStatus = mapMpStatusToOrderState(mpStatus!, mpStatusDetail);

        console.log("INTERNAL STATUS=", internalStatus);

        // Datos del comprador (para email de MP)
        // const payerEmail = paymentData.payer?.email;
        // const payerName = paymentData.payer?.first_name || "Cliente";
        //////////////////////////

        // Datos del comprador (para email de user ONLINE)
        const userRes = await client.query(
            `SELECT email, name FROM users WHERE user_id = $1`,
            [userId]
        );

        if (userRes.rows.length === 0) {
            console.warn("⚠️ Usuario no encontrado para enviar el email");
        }

        const userEmail = userRes.rows[0]?.email || null;
        const userName = userRes.rows[0]?.name || "Cliente";
        /////////////////////////////////////////

        const amount = paymentData.transaction_amount;


        // 3️⃣ Guardamos la orden solo si el pago fue aprobado
        if (internalStatus === "paid") {
            try {
                await client.query("BEGIN");
                inTransaction = true // ACTIVAMOS FLAG

                // Creamos la orden en la tabla `orders`
                const orderRes = await client.query(
                    `
                INSERT INTO orders (
                user_id, 
                total, 
                status, 
                mp_payment_id, 
                payment_id,
                address_id, 
                created_at, 
                updated_at, 
                notificado
                )
                SELECT 
                c.user_id,
                    SUM(ci.unit_price * ci.quantity) AS total,
                    $1, 
                    $2, 
                    $3,
                    $4, 
                    NOW(), 
                    NOW(), 
                    false
                FROM carts c
                JOIN cart_items ci ON c.cart_id = ci.cart_id
                WHERE c.cart_id = $5
                GROUP BY c.user_id
                RETURNING order_id
                 `,
                    [internalStatus, paymentData.id, paymentId, addressId, cartId]
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

                // 🔻 Descontamos el stock de cada producto del carrito
                await client.query(
                    `
                UPDATE products
                SET stock = stock - ci.quantity
                FROM cart_items ci
                WHERE products.product_id = ci.product_id
                AND ci.cart_id = $1
                `,
                    [cartId]
                );

                // Actualizamos estado del carrito
                await client.query(
                    `UPDATE carts SET status = 'completed', updated_at = NOW() WHERE cart_id = $1`,
                    [cartId]
                );

                await client.query("COMMIT");
                inTransaction = false
                console.log("✅ Orden creada correctamente:", orderId);

                // 📧 Enviar email de pago aprobado
                const existingOrder = await client.query(
                    `SELECT notificado FROM orders WHERE mp_payment_id = $1`,
                    [paymentData.id]
                );

                const alreadyNotified = existingOrder.rows[0]?.notificado;

                if (userEmail && !alreadyNotified) {
                    await sendEmailPaymentStatus({
                        to: userEmail,
                        name: userName,
                        status: "approved",
                        orderId,
                        amount,
                    });

                    await client.query(
                        `UPDATE orders SET notificado = true WHERE mp_payment_id = $1`,
                        [paymentData.id]
                    );
                }

            } catch (error) {
                if (inTransaction) {
                    await client.query("ROLLBACK")
                    console.warn("⚠️ ROLLBACK ejecutado debido a un error en la transacción (stock, orden, etc.).")
                }
                throw error
            }

        } else {
            // Si el pago está pendiente o rechazado, igual actualizamos el carrito
            await client.query(
                `UPDATE carts SET status = $1, updated_at = NOW() WHERE cart_id = $2`,
                [internalStatus, cartId]
            );
            console.log(`ℹ️ Carrito actualizado con estado ${internalStatus}`);

            // 📧 Enviar email si fue rechazado
            if (internalStatus === "cancelled" && userEmail) {
                const paymentNotificationRes = await client.query(
                    `SELECT rejection_notified FROM payments WHERE mp_payment_id = $1`,
                    [paymentData.id]
                );
                const alreadyNotified = paymentNotificationRes.rows[0]?.notificado;

                if (!alreadyNotified) {
                    await sendEmailPaymentStatus({
                        to: userEmail,
                        name: userName,
                        status: "rejected",
                    });

                    await client.query(
                        `UPDATE payments SET rejection_notified = true WHERE mp_payment_id = $1`,
                        [paymentData.id]
                    );
                }
            }
        }

        console.log(`WEBHOOK PAYER, ${paymentData.payer}`);
        return NextResponse.json(
            { message: "Webhook procesado correctamente" },
            { status: 200 }
        );
    } catch (error) {
        // await client.query("ROLLBACK");
        if (inTransaction) {
            await client.query("ROLLBACK");
            console.warn("⚠️ ROLLBACK ejecutado en el catch final como salvaguarda.");
        }
        console.error("❌ Error en el webhook:", error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    } finally {
        client.release();
    }
}
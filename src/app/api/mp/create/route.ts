import { NextResponse } from "next/server";
import { preference, payment } from "@/app/lib/mp/mp.config";
import { getAuthUser } from "@/app/lib/auth";
import pool from "@/app/lib/db";

export async function POST(req: Request) {
    const client = await pool.connect()
    try {
        const user = await getAuthUser()
        if (!user) return NextResponse.json({ message: "No autenticado" }, { status: 401 })

        // 1️⃣ Traemos el carrito activo
        const cartRes = await client.query(
            `SELECT cart_id FROM carts WHERE user_id = $1 AND status = 'active' LIMIT 1`,
            [user.user_id]
        );

        if (cartRes.rows.length === 0) {
            return NextResponse.json({ message: "Carrito vacío" }, { status: 404 });
        }

        const cartId = cartRes.rows[0].cart_id


        // 2️⃣ Traemos los ítems
        const itemsRes = await client.query(
            `SELECT ci.product_id, ci.quantity, ci.unit_price, p.name, p.image_url
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.product_id
            WHERE ci.cart_id = $1`,
            [cartId]
        );

        if (itemsRes.rows.length === 0) {
            return NextResponse.json({ message: "Carrito vacío" }, { status: 404 });
        }

        const items = itemsRes.rows.map((p) => ({
            id: p.product_id,
            title: p.name,
            quantity: Number(p.quantity),
            unit_price: Number(p.unit_price),
            currency_id: "ARS",
        }));

        // TOTAL SOLO PARA PROBAR SI HACE BIEN EL CALCULO EN MERCADOPAGO
        const total = items.reduce(
            (sum, item) => sum + item.unit_price * item.quantity,
            0
        );

        console.log("TOTAL LOGEADO DE COIGO: ", total);


        const preferenceData = {
            items,
            payer: { email: user.email },
            metadata: { 
                user_id: user.user_id,
                cartId: cartId
            },
            back_urls: {
                success: `${process.env.FRONT_URL}/mercadopago/success`,
                failure: `${process.env.FRONT_URL}/mercadopago/failure`,
                pending: `${process.env.FRONT_URL}/mercadopago/pending`,
            },
            notification_url: `${process.env.BACK_URL}/api/mp/webhook`,
            auto_return: "approved",
        };

        const result = await preference.create({ body: preferenceData })
        if (!result.id) {
            return NextResponse.json({ error: "No se pudo crear la preferencia" }, { status: 500 });
        }
        return NextResponse.json(result.id, { status: 201 });
    } catch (error) {
        console.error("Error creating MP preference:", error);
        return NextResponse.json({ message: "Error interno" }, { status: 500 });
    } finally {
        client.release()
    }
}
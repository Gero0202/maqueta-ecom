import { NextResponse } from "next/server";
import { preference, payment } from "@/app/lib/mp/mp.config";
import { getAuthUser } from "@/app/lib/auth";
import pool from "@/app/lib/db";

export async function POST(req: Request) {
    const client = await pool.connect()
    try {
        const user = await getAuthUser()
        if (!user) return NextResponse.json({ message: "No autenticado" }, { status: 401 })

        // Traer items del carrito (adaptá a tu esquema)
        const cartRes = await client.query(
            `SELECT p.product_id, p.name as title, p.price, ci.quantity
       FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.cart_id
       JOIN products p ON p.product_id = ci.product_id
       WHERE c.user_id = $1 AND c.status = 'active'`,
            [user.user_id]
        );

        const products = cartRes.rows;
        if (!products.length) return NextResponse.json({ message: "Carrito vacío" }, { status: 400 });

        const items = products.map((p: any) => ({
            id: p.product_id,
            title: p.title,
            quantity: Number(p.quantity),
            unit_price: Number(p.price),
            currency_id: "ARS",
        }));

        const preferenceData = {
            items,
            payer: { email: user.email },
            metadata: { user_id: user.user_id },
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
    }finally{
        client.release()
    }
}
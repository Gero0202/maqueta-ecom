import { NextResponse } from "next/server";
import { getAuthUser } from "@/app/lib/auth";
import pool from "@/app/lib/db";

export async function GET() {
    try {
        const userPayload = await getAuthUser()

        if (!userPayload) {
            return NextResponse.json(
                { message: 'No autenticado' },
                { status: 401 }
            )
        }

        const userRes = await pool.query(
            `SELECT user_id, email, username, avatar, role, name, phone 
             FROM users 
             WHERE user_id = $1`,
            [userPayload.user_id]
        );
        const user = userRes.rows[0];

        if (!user) {
            return NextResponse.json(
                { message: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        const addrRes = await pool.query(
            `SELECT address_id, street, city, state, zip_code, country, is_default 
             FROM addresses 
             WHERE user_id = $1`,
            [userPayload.user_id]
        );


        return NextResponse.json({
            message: 'Usuario autenticado',
            user: {
                ...user,
                addresses: addrRes.rows
            }
        })
    } catch (error) {
        console.error("❌ Error en register:", error); // 👈 agrega esto
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
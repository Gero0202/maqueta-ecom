import { NextResponse } from "next/server";
import { getAuthUser } from "@/app/lib/auth";
import pool from "@/app/lib/db";

export async function GET() {
    const client = await pool.connect();
    try {
        const userPayload = await getAuthUser()

        if (!userPayload || !userPayload.user_id) {
            return NextResponse.json(
                { message: "No autenticado o token inválido." },
                { status: 401 }
            );
        }

        const userRes = await pool.query(
            `SELECT user_id, email, username, avatar, role, name, phone, is_verified
             FROM users 
             WHERE user_id = $1`,
            [userPayload.user_id]
        );

        if (userRes.rowCount === 0) {
            return NextResponse.json(
                { message: "Usuario no encontrado." },
                { status: 404 }
            );
        }

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
             WHERE user_id = $1
             ORDER BY is_default DESC, created_at ASC`,
            [userPayload.user_id]
        );

        const addresses = addrRes.rows || [];

        const formattedUser = {
            ...user,
            name: user.name?.trim(),
            username: user.username?.trim(),
            avatar:
                user.avatar ||
                "https://i.pinimg.com/736x/3f/94/70/3f9470b34a8e3f526dbdb022f9f19cf7.jpg",
            addresses,
        };


        return NextResponse.json({
            message: 'Usuario autenticado',
            user: formattedUser
        })
    } catch (error) {
        console.error("❌ Error en register:", error);
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        );
    }finally{
        client.release()
    }
}
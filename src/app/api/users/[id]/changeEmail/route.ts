import { NextResponse } from "next/server";
import { getAuthUser, requireRole } from "@/app/lib/auth";
import pool from "@/app/lib/db";

interface Params {
    params: Promise<{
        id: string
    }>
}

export async function PUT(req: Request, { params }: Params) {
    try {
        const { id } = await params
        if (!/^\d+$/.test(id)) {
            return NextResponse.json({ message: "ID inválido" }, { status: 400 });
        }
        const userId = Number(id);


        const authUser = await getAuthUser()


        if (!authUser || (authUser.user_id !== userId && authUser.role !== "admin")) {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        const { email } = await req.json()

        if (!email || email.trim() === "") {
            return NextResponse.json(
                { message: "Email requerido" },
                { status: 400 }
            )
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ message: "Email inválido" }, { status: 400 });
        }

        const existing = await pool.query(
            'SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );

        if ((existing.rowCount ?? 0) > 0 && existing.rows[0].user_id !== userId) {
            return NextResponse.json({ message: "El email ya esta en uso" }, { status: 409 })
        }

        const result = await pool.query(
            'UPDATE users SET email = $1, updated_at = NOW() where user_id = $2 RETURNING user_id, email',
            [email, userId]
        )

        return NextResponse.json({ message: "Email actualizado", user: result.rows[0] })

    } catch (error) {
        return NextResponse.json(
            { message: "Error en el servidor al cambiar el email" },
            { status: 500 }
        )
    }
}
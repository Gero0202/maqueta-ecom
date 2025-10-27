import { NextResponse } from "next/server";
import { getAuthUser, requireRole } from "@/app/lib/auth";
import pool from "@/app/lib/db";
import { comparePassword } from "@/app/lib/hash";

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

        const { email, currentPassword } = await req.json()

        if (!currentPassword) {
            return NextResponse.json({ message: "Se requiere la contraseña actual para cambiar el email" }, { status: 400 });
        }

        if (!email || email.trim() === "") {
            return NextResponse.json(
                { message: "Email requerido" },
                { status: 400 }
            )
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ message: "Email inválido" }, { status: 400 });
        }

        const userResult = await pool.query(
            'SELECT password FROM users WHERE user_id = $1', 
            [userId]
        );

        if (userResult.rowCount === 0) {
             return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
        }
        
        const storedHash = userResult.rows[0].password;

        const passwordMatch = await comparePassword(currentPassword, storedHash);

        if (!passwordMatch) {
            return NextResponse.json({ message: "Contraseña incorrecta. No se puede cambiar el email." }, { status: 401 });
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
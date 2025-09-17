import { getAuthUser, requireRole } from "@/app/lib/auth";
import pool from "@/app/lib/db";
import { User } from "@/app/types/User";
import { NextResponse } from "next/server";


interface RouteParams {
    params: Promise<{
        id: string
    }>
}


export async function GET(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const userId = parseInt(id, 10)
        if (isNaN(userId)) {
            return NextResponse.json(
                { message: "ID no válido, debe ser un número" },
                { status: 400 }
            )
        }

        const currentUser = await getAuthUser()

        if (!currentUser) {
            return NextResponse.json(
                { message: "No autenticado" },
                { status: 401 }
            )
        }

        if (currentUser.role !== "admin" && currentUser.user_id !== userId) {
            return NextResponse.json(
                { message: "No tienes permiso para ver este perfil" },
                { status: 403 }
            )
        }

        const selectColumns = `
            u.user_id, u.name, u.avatar, u.username, u.bio,
            u.email, u.phone, u.created_at, u.updated_at
             `

        const sql = `
        SELECT 
                    ${selectColumns},
        COALESCE(
            json_agg(
                json_build_object(
                    'address_id', a.address_id,
                    'street', a.street,
                    'city', a.city,
                    'state', a.state,
                    'zip_code', a.zip_code,
                    'country', a.country,
                    'is_default', a.is_default
                )
            ) FILTER(WHERE a.address_id IS NOT NULL), '[]'
        ) AS addresses
                FROM users u
                LEFT JOIN addresses a ON u.user_id = a.user_id
                WHERE u.user_id = $1
                GROUP BY u.user_id;
        `;

        const result = await pool.query(sql, [userId]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { message: "No se encontró usuario con ese ID" },
                { status: 404 }
            );
        }

        return NextResponse.json({ user: result.rows[0] }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: "No se pudo obtener el usuario", error },
            { status: 500 }
        )
    }
}


export async function PUT(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params

        const userId = parseInt(id, 10)
        if (isNaN(userId)) {
            return NextResponse.json(
                { message: "ID no valido debe ser un numero" },
                { status: 400 }
            )
        }

        const authUser = await getAuthUser()
        if (!authUser) {
            return NextResponse.json(
                { message: "No estas autenticado" },
                { status: 401 }
            )
        }

        if (authUser.user_id !== userId && authUser.role !== 'admin') {
            return NextResponse.json(
                { message: "No tienes permiso para modificar este usuario" },
                { status: 403 }
            )
        }

        const existingRes = await pool.query('SELECT avatar FROM users WHERE user_id = $1', [userId])
        const existingUser = existingRes.rows[0]

        const { name, avatar, bio, username, phone } = (await req.json()) as Partial<User>

        const avatarFinal = avatar?.trim() ? avatar : existingUser?.avatar || "https://i.pinimg.com/736x/3f/94/70/3f9470b34a8e3f526dbdb022f9f19cf7.jpg"


        if (username !== undefined) {
            if (username.trim() === "") {
                return NextResponse.json(
                    { message: "El nombre de usuario no puede estar vacío" },
                    { status: 400 }
                )
            }
        }

        if (name !== undefined) {
            if (name.trim() === "") {
                return NextResponse.json(
                    { message: "El nombre no puede estar vacío" },
                    { status: 400 }
                )
            }
        }

        if (phone !== undefined) {
            if (!/^\+?[0-9]{7,15}$/.test(phone)) {
                return NextResponse.json(
                    { message: "Número de teléfono inválido" },
                    { status: 400 }
                )
            }
        }

        if (bio !== undefined) {
            if (bio.trim() === "") {
                return NextResponse.json(
                    { message: "La biografía no puede estar vacía si se incluye" },
                    { status: 400 }
                )
            }
            if (bio.length > 400) {
                return NextResponse.json(
                    { message: "La biografía no puede superar los 400 caracteres" },
                    { status: 400 }
                )
            }
        }


        const fields = { name, avatar: avatarFinal, bio, username, phone, updated_at: new Date() }

        const entries = Object.entries(fields).filter(
            (([_, value]) => value !== undefined && value !== null)
        )

        if (entries.length === 0) {
            return NextResponse.json(
                { message: "Datos insuficientes para actualizar" },
                { status: 400 }
            )
        }

        if (username) {
            const check = await pool.query(
                'SELECT user_id FROM users WHERE username = $1', [username]
            )

            const usernameExists = check.rows.length > 0 && check.rows[0].user_id !== userId

            if (usernameExists) {
                return NextResponse.json(
                    { message: "El nombre de usuario ya esta en uso" },
                    { status: 409 }
                )
            }
        }

        const setClause = entries
            .map(([key], index) => `${key} = $${index + 1} `)
            .join(", ")

        const values = entries.map(([_, value]) => value)

        const sql = `UPDATE users SET ${setClause} WHERE user_id = $${entries.length + 1} RETURNING user_id, name, username, avatar, bio, phone, updated_at`

        const result = await pool.query(sql, [...values, userId])

        if (result.rowCount === 0) {
            return NextResponse.json(
                { message: "Usuario no encontrado" },
                { status: 404 }
            )
        }

        return NextResponse.json(result.rows[0], { status: 200 })

    } catch (error) {
        return NextResponse.json(
            { message: "Error interno al actualizar el usuario" },
            { status: 500 }
        )
    }
}


export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params

        const userId = parseInt(id, 10)
        if (isNaN(userId)) {
            return NextResponse.json(
                { message: "ID no valido debe ser un numero" },
                { status: 400 }
            )
        }

        const authUser = await getAuthUser()
        if (!authUser) {
            return NextResponse.json(
                { message: "No estas autenticado" },
                { status: 401 }
            )
        }

        if (authUser.user_id !== userId && authUser.role !== 'admin') {
            return NextResponse.json(
                { message: "No tienes permiso para eliminar este usuario" },
                { status: 403 }
            )
        }

        // Borramos primero addresses (si no hay ON DELETE CASCADE en la FK)
        await pool.query(`DELETE FROM addresses WHERE user_id = $1`, [userId])

        const result = await pool.query(`DELETE FROM users WHERE user_id = $1`, [userId])
        if (result.rowCount === 0) {
            return NextResponse.json(
                { message: "No existe usuario con ese ID" },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { message: "Usuario eliminado correctamente" },
            { status: 200 }
        )

    } catch (error) {
        return NextResponse.json(
            { message: "No se pudo eliminar al usuario", error: error },
            { status: 500 }
        )
    }

}


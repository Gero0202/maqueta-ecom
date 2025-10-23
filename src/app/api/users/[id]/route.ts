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
        if (!/^\d+$/.test(id)) {
            return NextResponse.json(
                { message: "ID inválido, debe ser un número entero" },
                { status: 400 }
            );
        }
        const userId = parseInt(id, 10);

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
            u.user_id, u.name, u.avatar, u.username,
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
                    'province', a.province,
                    'zip_code', a.zip_code,
                    'country', a.country,
                    'is_default', a.is_default,
                    'description', a.description
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
        console.error("Error en /api/users/[id]:", error);
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}


export async function PUT(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        if (!/^\d+$/.test(id)) {
            return NextResponse.json(
                { message: "ID inválido, debe ser un número entero" },
                { status: 400 }
            );
        }
        const userId = parseInt(id, 10);

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

        const body = (await req.json()) as Record<string, any>;

        // === 5. Lista blanca: campos permitidos para actualizar ===
        const allowedKeys = ["name", "avatar", "username", "phone"];
        for (const key of Object.keys(body)) {
            if (!allowedKeys.includes(key)) {
                return NextResponse.json(
                    { message: `Campo no permitido: ${key}` },
                    { status: 400 }
                );
            }
        }

        // === 6. Validación de URL para avatar (antes de usar avatarFinal) ===
        if (body.avatar !== undefined && body.avatar !== null && body.avatar !== "") {
            const avatarCandidate = String(body.avatar).trim();
            try {
                const u = new URL(avatarCandidate);
                if (!["http:", "https:"].includes(u.protocol)) {
                    throw new Error("Protocolo inválido");
                }
            } catch {
                return NextResponse.json(
                    { message: "URL de avatar no válida" },
                    { status: 400 }
                );
            }
        }

        // === Ahora destructuramos usando el body ya validado ===
        const { name, avatar, username, phone } = body as Partial<User>;

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



        const fields = { name, avatar: avatarFinal, username, phone, updated_at: new Date() }

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
                'SELECT user_id FROM users WHERE LOWER(username) = LOWER($1)', [username]
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

        const sql = `UPDATE users SET ${setClause} WHERE user_id = $${entries.length + 1} RETURNING user_id, name, username, avatar, phone, updated_at`

        const result = await pool.query(sql, [...values, userId])

        if (result.rowCount === 0) {
            return NextResponse.json(
                { message: "Usuario no encontrado" },
                { status: 404 }
            )
        }

        return NextResponse.json({ user: result.rows[0] }, { status: 200 })

    } catch (error) {
        console.error("Error en /api/users/[id]:", error);
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}


export async function DELETE(req: Request, { params }: RouteParams) {
    const client = await pool.connect();

    try {
        const { id } = await params;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
            return NextResponse.json(
                { message: "ID no válido, debe ser un número" },
                { status: 400 }
            );
        }

        const authUser = await getAuthUser();
        console.log("AuthUser en DELETE:", authUser);

        if (!authUser) {
            return NextResponse.json(
                { message: "No estás autenticado" },
                { status: 401 }
            );
        }

        // Evitar que el admin se borre a sí mismo
        if (authUser.user_id === userId && authUser.role === "admin") {
            return NextResponse.json(
                { message: "No puedes eliminar tu propia cuenta de administrador" },
                { status: 403 }
            );
        }

        // Solo admin o el propio usuario pueden borrar
        if (authUser.user_id !== userId && authUser.role !== "admin") {
            return NextResponse.json(
                { message: "No tienes permiso para eliminar este usuario" },
                { status: 403 }
            );
        }

        // Verificar si existe el usuario
        const existingUser = await client.query(
            `SELECT user_id FROM users WHERE user_id = $1`,
            [userId]
        );

        if (existingUser.rowCount === 0) {
            return NextResponse.json(
                { message: "No existe un usuario con ese ID" },
                { status: 404 }
            );
        }

        // Iniciar transacción
        await client.query("BEGIN");

        // Eliminar registros relacionados (si no hay ON DELETE CASCADE)
        await client.query(`DELETE FROM carts WHERE user_id = $1`, [userId]);
        await client.query(`DELETE FROM addresses WHERE user_id = $1`, [userId]);

        // Eliminar usuario
        await client.query(`DELETE FROM users WHERE user_id = $1`, [userId]);

        // Confirmar transacción
        await client.query("COMMIT");

        return NextResponse.json(
            { message: "Usuario eliminado correctamente" },
            { status: 200 }
        );
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error en DELETE /users/:id", error);
        return NextResponse.json(
            { message: "No se pudo eliminar el usuario", error },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}


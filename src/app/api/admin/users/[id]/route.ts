import { NextResponse } from "next/server"
import pool from "@/app/lib/db"
import { getAuthUser } from "@/app/lib/auth"

type Params = {
  params: Promise<{
    id: string
  }>
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const userId = parseInt(id, 10)
    if (isNaN(userId)) {
      return NextResponse.json(
        { message: "ID no válido, debe ser un número" },
        { status: 400 }
      )
    }

    // Verificamos que el usuario autenticado sea admin
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json(
        { message: "No tienes permisos para modificar usuarios" },
        { status: 403 }
      )
    }

    // Datos que puede editar un admin
    const { name, username, email, phone, avatar, role } =
      (await req.json()) as {
        name?: string
        username?: string
        email?: string
        phone?: string
        avatar?: string
        role?: string
      }

    const fields = {
      name,
      username,
      email,
      phone,
      avatar,
      role,
      updated_at: new Date(),
    }

    // Filtrar nulos/undefined
    const entries = Object.entries(fields).filter(
      ([, value]) => value !== undefined && value !== null
    )

    if (entries.length === 0) {
      return NextResponse.json(
        { message: "No hay datos para actualizar" },
        { status: 400 }
      )
    }

    // ✅ Validaciones adicionales
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Formato de email inválido" },
        { status: 400 }
      );
    }

    if (phone && !/^[0-9+\-() ]{6,20}$/.test(phone)) {
      return NextResponse.json(
        { message: "Formato de teléfono inválido" },
        { status: 400 }
      );
    }

    if (role && !["admin", "customer", "seller"].includes(role)) {
      return NextResponse.json(
        { message: "Rol inválido. Solo se permiten 'admin' o 'customer'" },
        { status: 400 }
      );
    }

    // Verificar username único si viene actualizado
    if (username) {
      const check = await pool.query(
        "SELECT user_id FROM users WHERE username = $1",
        [username]
      )
      if (check.rows.length > 0 && check.rows[0].user_id !== userId) {
        return NextResponse.json(
          { message: "El nombre de usuario ya está en uso" },
          { status: 409 }
        )
      }
    }

    if (email) {
      const checkEmail = await pool.query(
        "SELECT user_id FROM users WHERE email = $1",
        [email]
      );
      if (checkEmail.rows.length > 0 && checkEmail.rows[0].user_id !== userId) {
        return NextResponse.json(
          { message: "El email ya está en uso" },
          { status: 409 }
        );
      }
    }

    // Construir SQL dinámico
    const setClause = entries
      .map(([key], index) => `${key} = $${index + 1}`)
      .join(", ")
    const values = entries.map(([, value]) => value)

    await pool.query(
      `UPDATE users SET ${setClause} WHERE user_id = $${entries.length + 1
      }`,
      [...values, userId]
    )

    // Ahora volvemos a consultar al usuario con sus direcciones
    const result = await pool.query(
      `SELECT 
        u.user_id, u.username, u.name, u.email, u.role, u.created_at, 
        u.avatar, u.phone,
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
          ) FILTER (WHERE a.address_id IS NOT NULL), '[]'
        ) AS addresses
       FROM users u
       LEFT JOIN addresses a ON a.user_id = u.user_id
       WHERE u.user_id = $1
       GROUP BY u.user_id`,
      [userId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0], { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Error interno al actualizar usuario como admin" },
      { status: 500 }
    )
  }
}

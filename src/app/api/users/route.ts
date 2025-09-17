import { requireRole } from "@/app/lib/auth";
import pool from "@/app/lib/db";
import { hashpassword } from "@/app/lib/hash";
import { NextResponse } from "next/server";

interface UserData {
    username: string;
    name: string;
    email: string;
    password: string;
    avatar?: string;
    phone?: string;
    role?: "customer" | "admin" | "seller";
    is_verified?: boolean;
}



export async function GET(req: Request) {
    try {
        const auth = await requireRole(['admin'])
        if (!auth) {
            return NextResponse.json(
                { message: "No tenes permisos para ver los usuarios" },
                { status: 403 }
            )
        }

        const sql = `
            SELECT 
                u.user_id,
                u.username,
                u.name,
                u.email,
                u.avatar,
                u.phone,
                u.role,
                u.created_at,
                u.phone,
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
            LEFT JOIN addresses a ON u.user_id = a.user_id
            GROUP BY u.user_id
            ORDER BY u.created_at DESC;
    `

        const result = await pool.query(sql)

        return NextResponse.json(result.rows, { status: 200 })
    } catch (error) {
        return NextResponse.json(
            { message: "Error al intentar obtener usuarios", error },
            { status: 500 }
        )
    }
}



export async function POST(req: Request) {
    try {
        const auth = await requireRole(['admin'])
        const { name, username, email, password, avatar, phone, role, is_verified } = (await req.json()) as UserData

        if (!name || !username || username.length > 50 || !email || !password) {
            return NextResponse.json(
                { message: "Faltan algunos de los campos obligatorios: Nombre, email y contraseña" },
                { status: 400 }
            )
        }

        if (username.length > 50) {
            return NextResponse.json({ message: "El username es demasiado largo" }, { status: 400 })
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ message: "El email no es válido" }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ message: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
        }

        const existingEmail = await pool.query(
            'SELECT user_id FROM users WHERE email = $1',
            [email]
        )

        if ((existingEmail.rowCount ?? 0) > 0) {
            return NextResponse.json(
                { message: "El email proporcionado ya está registrado" },
                { status: 409 }
            )
        }

        const hashedPassowrd = await hashpassword(password)

        const defaultAvatar = "https://i.pinimg.com/736x/3f/94/70/3f9470b34a8e3f526dbdb022f9f19cf7.jpg"
        const finalAvatar = avatar || defaultAvatar

        const finalRole = role || "customer"
        const verified = true

        const ipAddress = "admin-created";

        const userData = {
            name,
            username,
            email,
            password: hashedPassowrd,
            avatar: finalAvatar,
            phone: phone || null,
            role: finalRole,
            is_verified: verified,
            verify_code: null,
            ip_address: ipAddress,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const columns = Object.keys(userData);
        const values = Object.values(userData);
        const filteredColumns: string[] = [];
        const filteredValues: any[] = [];
        const placeholders: string[] = [];

        for (let i = 0; i < values.length; i++) {
            if (values[i] !== undefined && values[i] !== null) {
                filteredColumns.push(columns[i]);
                placeholders.push(`$${filteredValues.length + 1}`);
                filteredValues.push(values[i]);
            }
        }

        const sql = `INSERT INTO users (${filteredColumns.join(", ")})
                     VALUES (${placeholders.join(", ")})
                     RETURNING user_id, username, name, email, role, avatar, phone, is_verified`;

        const result = await pool.query(sql, filteredValues);

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        const isDatabaseError = (e: any): e is { code: string; constraint: string } => {
            return (
                e instanceof Object &&
                'code' in e &&
                typeof e.code === 'string' &&
                'constraint' in e &&
                typeof e.constraint === 'string'
            );
        };

        if (isDatabaseError(error) && error.code === '23505' && error.constraint.includes('email')) {
            return NextResponse.json(
                { message: 'El email proporcionado ya está registrado' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Error interno del servidor al intentar crear usuario: ", error: error },
            { status: 500 }
        )
    }
}


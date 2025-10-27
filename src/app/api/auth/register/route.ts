import pool from "@/app/lib/db";
import { NextResponse } from "next/server";
import { hashpassword } from "@/app/lib/hash";
import { buildInsertQuery } from "@/app/lib/insertBuilder";
import sendEmailOfRegister from "@/app/lib/email";

interface RegisterData {
    username: string;
    name: string;
    email: string;
    password: string;
    avatar?: string;
    phone?: string;
}

const PASSWORD_MIN_LENGTH = 10;
const strongPasswordRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{" + PASSWORD_MIN_LENGTH + ",})");

export async function POST(req: Request) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const body = (await req.json()) as RegisterData;
        const { username, name, email, password, avatar, phone } = body;

        const cleanUsername = username?.trim();
        const cleanName = name?.trim();
        const cleanEmail = email?.trim().toLowerCase();
        const cleanPhone = phone?.trim();


        if (
            !cleanUsername ||
            cleanUsername.length < 3 ||
            cleanUsername.length > 50 ||
            !/^[a-zA-Z0-9_]+$/.test(cleanUsername) ||
            !cleanName ||
            cleanName.length < 2 ||
            cleanName.length > 70 ||
            !cleanEmail ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
            !password ||
            !strongPasswordRegex.test(password) ||
            (cleanPhone && !/^[0-9+\-\s()]{6,20}$/.test(cleanPhone))
        ) {
            await client.query("ROLLBACK");

            let message = "Datos de registro inválidos. Verifica los campos: username, nombre, email, y teléfono. ";

            if (!password || !strongPasswordRegex.test(password)) {
                message = `La contraseña es inválida. Debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres, incluyendo mayúsculas, minúsculas y números.`;
            } else if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
                message = "Email inválido.";
            }

            return NextResponse.json(
                { message: message },
                { status: 400 }
            );
        }


        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { message: "El formato de email no es valido" },
                { status: 400 }
            );
        }


        const existingUser = await client.query(
            "SELECT user_id FROM users WHERE email = $1 OR username = $2",
            [cleanEmail, cleanUsername]
        );

        if (existingUser.rows.length > 0) {
            await client.query("ROLLBACK");
            return NextResponse.json(
                {
                    message:
                        "El email o nombre de usuario ya están registrados. Usa otros.",
                },
                { status: 400 }
            );
        }

        const hashedPassword = await hashpassword(password);

        const defaultAvatar = "https://i.pinimg.com/736x/3f/94/70/3f9470b34a8e3f526dbdb022f9f19cf7.jpg";
        let finalAvatar = avatar?.trim() || defaultAvatar;

        if (avatar) {
            const validImageExtensions = /\.(jpg|jpeg|png)$/i;
            if (!validImageExtensions.test(avatar)) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { message: "El formato de la URL del avatar no es válido. Debe ser .jpg, .jpeg o .png." },
                    { status: 400 }
                );
            }
        }
        const forwardedFor = req.headers.get('x-forwarded-for');
        const ip =
            (forwardedFor?.split(",")[0]?.trim()) ||
            (req.headers.get("x-real-ip")) ||
            "IP no disponible";



        const checkLimit = await client.query(`
            SELECT COUNT(*) FROM users 
            WHERE ip_address = $1 AND created_at >= NOW() - INTERVAL '5 days'
        `, [ip]);

        const registrosRecientes = parseInt(checkLimit.rows[0].count, 10);

        if (registrosRecientes >= 3) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { message: "Se ha alcanzado el limite de registros desde esta IP en los ultimos 5 días" },
                { status: 429 }
            );
        }

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        const userData = {
            username: cleanUsername,
            name: cleanName,
            email: cleanEmail,
            password: hashedPassword,
            avatar: finalAvatar,
            phone: cleanPhone || null,
            role: 'customer',
            ip_address: ip,
            verify_code: verifyCode,
            is_verified: false,
            created_at: new Date(),
            updated_at: new Date()
        };

        const { text, values } = buildInsertQuery('users', userData, [
            'user_id',
            'name',
            'username',
            'email',
            'avatar',
            'phone',
            'role',
            'created_at'
        ]);
        const result = await client.query(text, values);


        await sendEmailOfRegister({ email, verifyCode });
        await client.query('COMMIT');

        return NextResponse.json(result.rows[0], { status: 201 });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Error en register:", error); 

        return NextResponse.json(
            { message: "Error interno del servidor al registrar usuario." },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}


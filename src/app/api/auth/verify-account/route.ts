import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {

    const client = await pool.connect()

    try {
        await client.query("BEGIN")

        const { email, code } = await req.json();

        if (!email || !code) {
            return NextResponse.json({ message: "Faltan campos obligatorios" }, { status: 400 });
        }

        const cleanEmail = email?.trim().toLowerCase();
        const cleanCode = code?.toString().trim();

        if (!cleanEmail || !cleanCode) {
            await client.query("ROLLBACK");
            return NextResponse.json(
                { message: "Faltan campos obligatorios: email y código." },
                { status: 400 }
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            await client.query("ROLLBACK");
            return NextResponse.json(
                { message: "El formato del email no es válido." },
                { status: 400 }
            );
        }

        if (!/^\d{6}$/.test(cleanCode)) {
            await client.query("ROLLBACK");
            return NextResponse.json(
                { message: "El código de verificación debe tener 6 dígitos numéricos." },
                { status: 400 }
            );
        }

        const result = await client.query(
            `
            UPDATE users
            SET is_verified = TRUE, verify_code = NULL, updated_at = NOW()
            WHERE email = $1 AND verify_code = $2
            RETURNING user_id, email, role, is_verified
          `,
            [cleanEmail, cleanCode]
        );


        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json(
                { message: "El código de verificación o el email son incorrectos." },
                { status: 401 }
            );
        }

        const user = result.rows[0]

        await client.query("COMMIT");

        return NextResponse.json(
            {
                message: "Cuenta verificada con exito",
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    role: user.role,
                    is_verified: user.is_verified,
                },
            },
            { status: 200 }
        );

    } catch (error) {
        await client.query("ROLLBACK");
        return NextResponse.json(
            { message: "Error interno del servidor al verificar la cuenta" },
            { status: 500 }
        );
    }finally{
        client.release()
    }
}



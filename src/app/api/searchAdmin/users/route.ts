import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q");

    try {
        let query = `
      SELECT 
        user_id,
        name,
        email,
        role,
        created_at
      FROM users
    `;

        let values: string[] = [];

        if (search) {
            query += `
        WHERE 
          CAST(user_id AS TEXT) ILIKE $1
          OR name ILIKE $2
          OR email ILIKE $3
          OR role ILIKE $4
        ORDER BY
          CASE
            WHEN CAST(user_id AS TEXT) ILIKE $1 THEN 1
            WHEN name ILIKE $2 THEN 2
            WHEN email ILIKE $3 THEN 3
            WHEN role ILIKE $4 THEN 4
            ELSE 5
          END,
          created_at DESC
      `;

            values = [
                `%${search}%`, // user_id
                `%${search}%`, // name
                `%${search}%`, // email
                `%${search}%`, // role
            ];
        } else {
            query += ` ORDER BY created_at DESC`;
        }

        const result = await pool.query(query, values);

        return NextResponse.json({ users: result.rows }, { status: 200 });
    } catch (error) {
        console.error("❌ Error al buscar usuarios:", error);
        return NextResponse.json(
            { message: "Error interno del servidor al buscar usuarios." },
            { status: 500 }
        );
    }
}

import { getAuthUser } from "@/app/lib/auth";
import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
            return NextResponse.json({ message: "ID no valido" }, { status: 400 });
        }

        const authUser = await getAuthUser();
        if (!authUser) {
            return NextResponse.json({ message: "No estás autenticado" }, { status: 401 });
        }

        if (authUser.user_id !== userId && authUser.role !== "admin") {
            return NextResponse.json({ message: "No tienes permiso" }, { status: 403 });
        }

        const result = await pool.query(
            `SELECT address_id, street, city, state, zip_code, number_house ,country, is_default
       FROM addresses
       WHERE user_id = $1`,
            [userId]
        );

        return NextResponse.json({ addresses: result.rows }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error al obtener direcciones" }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
            return NextResponse.json({ message: "ID no válido" }, { status: 400 });
        }

        const authUser = await getAuthUser();
        if (!authUser) {
            return NextResponse.json({ message: "No estás autenticado" }, { status: 401 });
        }

        if (authUser.user_id !== userId && authUser.role !== "admin") {
            return NextResponse.json({ message: "No tienes permiso" }, { status: 403 });
        }

        const { street, city, state, zip_code, number_house, country } = await req.json();

        if (!street || !city || !zip_code || !country || !number_house) {
            return NextResponse.json({ message: "Faltan campos obligatorios" }, { status: 400 });
        }

        const repeatAddress = await pool.query(
            `SELECT 1 
            FROM addresses 
            WHERE user_id = $1 AND number_house = $2`,
            [userId, number_house]
        );

        if ((repeatAddress.rowCount ?? 0) > 0) {
            return NextResponse.json(
                { message: "Ya existe una dirección con esa calle y número de casa" },
                { status: 409 }
            );
        }

        const existing = await pool.query(
            `SELECT COUNT(*) FROM addresses WHERE user_id = $1`,
            [userId]
        );
        const hasAddresses = parseInt(existing.rows[0].count, 10) > 0;

        const result = await pool.query(
            `INSERT INTO addresses (user_id, street, city, state, zip_code, number_house ,country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING address_id, street, city, state, zip_code, number_house ,country, is_default`,
            [userId, street, city, state || null, zip_code, number_house, country, hasAddresses ? false : true]
        );

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error al crear dirección" }, { status: 500 });
    }
}

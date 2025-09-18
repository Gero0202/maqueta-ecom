import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/auth";

interface RouteParams {
    params: Promise<{
        id: string;
        addressId: string;
    }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
    try {
        const { id, addressId } = await params;
        const userId = parseInt(id, 10);
        const addrId = parseInt(addressId, 10);

        if (isNaN(userId) || isNaN(addrId)) {
            return NextResponse.json({ message: "IDs inválidos" }, { status: 400 });
        }

        const authUser = await getAuthUser();
        if (!authUser) {
            return NextResponse.json({ message: "No autenticado" }, { status: 401 });
        }

        if (authUser.user_id !== userId && authUser.role !== "admin") {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        const addrRes = await pool.query(
            "SELECT * FROM addresses WHERE address_id = $1 AND user_id = $2",
            [addrId, userId]
        );

        if (addrRes.rows.length === 0) {
            return NextResponse.json({ message: "Dirección no encontrada" }, { status: 404 });
        }

        await pool.query(
            "UPDATE addresses SET is_default = false WHERE user_id = $1",
            [userId]
        );

        const result = await pool.query(
            "UPDATE addresses SET is_default = true WHERE address_id = $1 AND user_id = $2 RETURNING *",
            [addrId, userId]
        );

        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (error) {
        console.error("Error al establecer dirección por defecto:", error);
        return NextResponse.json({ message: "Error interno del servidor", error }, { status: 500 });
    }
}

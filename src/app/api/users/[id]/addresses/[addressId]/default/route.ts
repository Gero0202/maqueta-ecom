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
    const client = await pool.connect();

    try {
        const { id, addressId } = await params;

        if (!/^\d+$/.test(id) || !/^\d+$/.test(addressId)) {
            return NextResponse.json({ message: "IDs inválidos" }, { status: 400 });
        }

        const userId = parseInt(id, 10);
        const addrId = parseInt(addressId, 10);

        const authUser = await getAuthUser();
        if (!authUser) {
            return NextResponse.json({ message: "No autenticado" }, { status: 401 });
        }

        if (authUser.user_id !== userId && authUser.role !== "admin") {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        const addrRes = await client.query(
            "SELECT address_id FROM addresses WHERE address_id = $1 AND user_id = $2",
            [addrId, userId]
        );

        if (addrRes.rowCount === 0) {
            return NextResponse.json({ message: "Dirección no encontrada" }, { status: 404 });
        }

        await client.query("BEGIN");

        await client.query("UPDATE addresses SET is_default = false WHERE user_id = $1", [userId]);

        const result = await client.query(
            "UPDATE addresses SET is_default = true, updated_at = NOW() WHERE address_id = $1 AND user_id = $2 RETURNING *",
            [addrId, userId]
        );

        await client.query("COMMIT");

        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (error) {
        await client.query("ROLLBACK").catch(() => { });
        console.error("Error al establecer dirección por defecto:", error);
        return NextResponse.json(
            { message: "Error al establecer dirección predeterminada" },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}
import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { getAuthUser } from "@/app/lib/auth";

export async function GET() {
    const client = await pool.connect();
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "admin") {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        const result = await client.query(
            `SELECT 
          COALESCE(SUM(total), 0) AS total_sales,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders,
          COUNT(*) AS total_orders
          FROM orders
          WHERE status IN ('paid', 'shipped', 'delivered', 'pending')`
        );

        const { total_sales, pending_orders, total_orders } = result.rows[0];

        return NextResponse.json(
            {
                totalSales: Number(total_sales),
                pendingOrders: Number(pending_orders),
                totalOrders: Number(total_orders)
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error al obtener ventas" }, { status: 500 });
    } finally {
        client.release();
    }
}

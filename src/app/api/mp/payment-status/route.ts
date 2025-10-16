// src/app/api/mp/payment-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { payment } from "@/app/lib/mp/mp.config";

export async function GET(req: NextRequest) {
    const paymentId = req.nextUrl.searchParams.get("payment_id");
    if (!paymentId)
        return NextResponse.json({ message: "Falta el parámetro payment_id" }, { status: 400 });

    try {
        const result = await payment.get({ id: paymentId });
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error al obtener el pago:", error);
        return NextResponse.json({ message: "Error al obtener pago" }, { status: 500 });
    }
}

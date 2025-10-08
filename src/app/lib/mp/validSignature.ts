/**
 * 🔐 validateSignature.js
 * 
 * Utilidad para validar la firma HMAC-SHA256 enviada por Mercado Pago en los webhooks.
 * Asegura que la notificacion recibida provenga realmente de Mercado Pago, comparando
 * la firma (`x-signature`) con una generada localmente usando el secreto de Webhooks.
 * 
 * Devuelve un objeto con:
 * - valid: boolean → si la firma es valida
 * - ignored: boolean → si el tipo de notificacion no es de interes (por ejemplo, "merchant_order")
 * - reason: string → motivo del rechazo o de la omision
 * - dataId: string → id del pago (si es valido)
 * 
 * 👉 Usado en: controller de webhook (`receivewebhook`) para evitar procesar notificaciones maliciosas o irrelevantes.
 */


import crypto from "crypto"
import { NextRequest } from "next/server"

interface ValidationResult {
    valid: boolean
    ignored: boolean
    reason?: string
    dataId?: string
    type?: string
}

/**
 * Valida la firma del webhook de Mercado Pago (Next.js)
 * @param req NextRequest recibido por la ruta /api/mercadopago/webhook
 * @param body Cuerpo ya parseado del request (si lo necesitas)
 */

export const validateSignature = async (req: NextRequest, body?: any): Promise<ValidationResult> => {
    const signatureHeader = req.headers.get("x-signature")
    const requestId = req.headers.get("x-request-id")

    const { searchParams } = new URL(req.url)

    const dataId =
        searchParams.get("data.id") ||
        searchParams.get("id") ||
        body?.data?.id ||
        undefined

    const type =
        searchParams.get("type") ||
        searchParams.get("topic") ||
        body?.type ||
        undefined

    if (type !== "payment") {
        return { valid: false, ignored: true, reason: "Tipo ignorado", type }
    }

    if (!signatureHeader || !requestId || !dataId || !type) {
        return { valid: false, ignored: false, reason: "Faltan datos para validar firma" }
    }

    if (!signatureHeader.includes("ts=") || !signatureHeader.includes("v1=")) {
        return { valid: false, ignored: false, reason: "Formato de firma inválido" }
    }

    const [tsPart, v1Part] = signatureHeader.split(",")
    const ts = tsPart.split("=")[1]
    const v1 = v1Part.split("=")[1]
    const template = `id:${dataId};request-id:${requestId};ts:${ts};`

    const secret = process.env.MP_WEBHOOK_SECRET

    if (!secret) {
        return { valid: false, ignored: false, reason: "Falta MP_WEBHOOK_SECRET" }
    }

    const hmac = crypto.createHmac("sha256", secret)
    hmac.update(template)
    const generated = hmac.digest("hex")

    if (generated !== v1) {
        return { valid: false, ignored: false, reason: "Firma inválida" }
    }

    return { valid: true, ignored: false, dataId }
}
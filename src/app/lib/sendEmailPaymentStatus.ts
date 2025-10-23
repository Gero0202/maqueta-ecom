import { createTransport } from "nodemailer";

const transporter = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.GOOGLE_EMAIL,
        pass: process.env.GOOGLE_PASS
    }
});

interface PaymentEmailOptions {
    to: string;
    name?: string;
    status: "approved" | "rejected";
    orderId?: number | string;
    amount?: number;
}

const sendEmailPaymentStatus = async ({
    to,
    name = "Cliente",
    status,
    orderId,
    amount,
}: PaymentEmailOptions) => {

    const subject =
        status === "approved"
            ? "🎉 ¡Pago aprobado! Tu pedido está en camino"
            : "⚠️ Tu pago fue rechazado";

    const formattedAmount =
        amount !== undefined
            ? `$${amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
            : "";

    const html =
        status === "approved"
            ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h1 style="color: #2b6cb0;">¡Gracias por tu compra, ${name}!</h1>
            <p>Tu pago fue aprobado correctamente. 🛒</p>
            <p><strong>Pedido #${orderId}</strong> por un total de <strong>${formattedAmount}</strong> está en proceso.</p>
            <p>Te avisaremos cuando tu pedido sea enviado.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}"
               style="display:inline-block; padding:10px 20px; background:#2b6cb0; color:white; text-decoration:none; border-radius:5px; margin-top:10px;">
               Ver mi pedido
            </a>
            <p style="margin-top:20px; font-size:12px; color:#777;">
                Gracias por confiar en <b>Mi tienda</b>.
            </p>
        </div>
        `
            : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h1 style="color: #e53e3e;">Hola ${name}, tu pago fue rechazado 😔</h1>
            <p>Lamentablemente tu pago no pudo ser procesado.</p>
            <p>Podés intentar nuevamente desde tu cuenta o revisar tus medios de pago.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/payments/retry"
               style="display:inline-block; padding:10px 20px; background:#e53e3e; color:white; text-decoration:none; border-radius:5px; margin-top:10px;">
               Reintentar pago
            </a>
            <p style="margin-top:20px; font-size:12px; color:#777;">
                Equipo de <b>Mi tienda</b>.
            </p>
        </div>
        `;

    await transporter.sendMail({
        from: `Mi tienda <${process.env.GOOGLE_EMAIL}>`,
        to,
        subject,
        replyTo: "no-reply@mitienda.com",
        html
    });
};

export default sendEmailPaymentStatus;

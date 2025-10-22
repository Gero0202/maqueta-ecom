import nodemailer from "nodemailer";

interface PaymentEmailOptions {
    to: string;
    name?: string;
    status: "approved" | "rejected";
    orderId?: number | string;
    amount?: number;
}

export async function sendEmailPaymentStatus({
    to,
    name = "Cliente",
    status,
    orderId,
    amount,
}: PaymentEmailOptions) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GOOGLE_EMAIL,
                pass: process.env.GOOGLE_PASS
            },
        });

        const subject =
            status === "approved"
                ? "🎉 ¡Pago aprobado! Tu pedido está en camino"
                : "⚠️ Tu pago fue rechazado";

        const formattedAmount =
            amount !== undefined
                ? `$${amount.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                })}`
                : "";

        const html =
            status === "approved"
                ? `
        <h2>¡Gracias por tu compra, ${name}!</h2>
        <p>Tu pago fue aprobado correctamente. 🛒</p>
        <p><strong>Pedido #${orderId}</strong> por un total de <strong>${formattedAmount}</strong> está en proceso.</p>
        <p>Te avisaremos cuando tu pedido sea enviado.</p>
        <br/>
        <p>Gracias por confiar en <b>Store Maquet</b>.</p>
        `
                : `
        <h2>Hola ${name},</h2>
        <p>Lamentablemente tu pago fue rechazado. 😔</p>
        <p>Podés intentar nuevamente desde tu cuenta o revisar tus medios de pago.</p>
        <br/>
        <p>Equipo de <b>Rolling Store</b>.</p>
        `;

        const mailOptions = {
            from: `"Rolling Store" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Email de estado de pago enviado a ${to} (${status})`);
    } catch (err) {
        console.error("❌ Error al enviar email de pago:", err);
    }
}





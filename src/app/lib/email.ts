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

// CAMBIAR MENSAJE
const sendEmailOfRegister = async ({ email, verifyCode }: { email: string, verifyCode: string }) => {
    await transporter.sendMail({
        from: `Mi tienda <${process.env.GOOGLE_EMAIL}>`,
        to: email,
        subject: "Verifica tu cuenta en MiTienda",
        replyTo: "no-reply@mitienda.com",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h1 style="color: #333;">¡Bienvenido a <span style="color:#2b6cb0;">MiTienda</span>!</h1>
        <p>Gracias por registrarte. Para activar tu cuenta y comenzar a comprar, utiliza el siguiente código:</p>
        <h2 style="background: #f3f3f3; padding: 10px; text-align: center; border-radius: 6px;">${verifyCode}</h2>
        <p>O puedes hacer clic en el siguiente botón:</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-account?email=${encodeURIComponent(
            email
        )}&code=${verifyCode}" 
           style="display:inline-block; padding:10px 20px; background:#2b6cb0; color:white; text-decoration:none; border-radius:5px; margin-top:10px;">
          Verificar mi cuenta
        </a>
        <p style="margin-top:20px; font-size:12px; color:#777;">
          Si no creaste esta cuenta, ignora este mensaje.
        </p>
      </div>
    `
    });
};

export default sendEmailOfRegister;
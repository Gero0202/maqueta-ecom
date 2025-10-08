/**
 * 🚀 Configuracion e inicializacion de las instancias de Mercado Pago para preferencias y pagos.
 * Aqui se establece el token de acceso para la autenticacion y se crean los objetos
 * necesarios para interactuar con la API de Mercado Pago.
 */

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";

if (!ACCESS_TOKEN) {
  console.warn("⚠️ MP_ACCESS_TOKEN no configurado. Mercado Pago EN DESARROLLO.");
}


const mercadopago = new MercadoPagoConfig({
  accessToken: ACCESS_TOKEN,
  options: { timeout: 5000 }
});

export const preference = new Preference(mercadopago);
export const payment = new Payment(mercadopago);
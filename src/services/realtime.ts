/**
 * URL del hub de SignalR (venta instantánea, pedidos, estado de WhatsApp).
 *
 * - Desarrollo: sin VITE_HUB_URL queda relativa y pasa por el proxy de Vite (ws: true).
 * - Producción: Vercel no reenvía WebSockets, así que el hub se conecta directo a Render;
 *   VITE_HUB_URL lleva la URL completa del hub (https://…onrender.com/hubs/venta-instantanea).
 *   Se resuelve al compilar y queda en el bundle público: no poner secretos aquí.
 */
export const VENTA_INSTANTANEA_HUB_URL =
  import.meta.env.VITE_HUB_URL?.trim() || '/hubs/venta-instantanea';

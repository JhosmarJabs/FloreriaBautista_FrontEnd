// Utilidades de autenticación/rol del usuario en el cliente.

/**
 * Determina si el usuario autenticado es un cliente (puede añadir al carrito y comprar).
 *
 * Tolera las dos formas en que se ha guardado el rol en localStorage:
 *  - `role`  (string)  → como lo guarda el registro.
 *  - `roles` (array)   → como venía guardándolo el inicio de sesión.
 *
 * Así funciona aunque la sesión se haya iniciado antes de normalizar `role`.
 */
export function esCliente(user: any): boolean {
  if (!user) return false;

  const rolesCliente = ['cliente', 'customer'];

  const role = typeof user.role === 'string' ? user.role.toLowerCase() : '';
  if (rolesCliente.includes(role)) return true;

  const roles: string[] = Array.isArray(user.roles)
    ? user.roles.map((r: unknown) => String(r).toLowerCase())
    : [];

  return roles.some((r) => rolesCliente.includes(r));
}

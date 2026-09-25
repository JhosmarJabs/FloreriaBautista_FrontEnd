// Utilidades de autenticación/rol del usuario en el cliente.
//
// Este archivo es la ÚNICA copia del vocabulario de roles de la app. Antes cada
// pantalla repetía su propio `['administrador','admin'].includes(...)`, con
// variantes incompatibles entre sí (`useAuth` comparaba contra 'ADMIN' en
// mayúsculas mientras el login guardaba minúsculas), así que una sesión podía
// ser "admin" para un componente y "nadie" para el de al lado.

/** Roles canónicos. Todo lo demás se normaliza a uno de estos tres. */
export const ROL = {
  ADMIN: 'admin',
  EMPLEADO: 'empleado',
  CLIENTE: 'cliente',
} as const;

export type Rol = (typeof ROL)[keyof typeof ROL];

/**
 * Nombres que hemos visto para cada rol: los de la BD (`ADMIN`, `EMPLEADO`,
 * `CLIENTE`, que son los que autorizan los `[Authorize(Roles=…)]` del backend),
 * los que guardaban versiones anteriores del login y los alias en inglés que
 * quedaron en algunas pantallas.
 *
 * La tabla `roles` arrastra además `VENTAS`, `INVENTARIO` y `ENTREGAS`, sin
 * usuarios asignados y sin ningún endpoint que los autorice. No se mapean a
 * propósito: darles acceso al panel solo produciría un 403 en cada llamada.
 */
const ALIAS_ROL: Record<string, Rol> = {
  admin: ROL.ADMIN,
  administrador: ROL.ADMIN,
  empleado: ROL.EMPLEADO,
  staff: ROL.EMPLEADO,
  cliente: ROL.CLIENTE,
  customer: ROL.CLIENTE,
};

/** Claim de rol que emite el backend (ClaimTypes.Role de .NET). */
const CLAIM_ROL = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

/** Convierte un nombre de rol cualquiera a su forma canónica, o `null`. */
export function normalizarRol(valor: unknown): Rol | null {
  if (typeof valor !== 'string') return null;
  return ALIAS_ROL[valor.trim().toLowerCase()] ?? null;
}

/** Normaliza una lista de roles, descartando desconocidos y duplicados. */
export function normalizarRoles(valores: unknown): Rol[] {
  const lista = Array.isArray(valores) ? valores : valores != null ? [valores] : [];
  const canonicos = lista
    .map(normalizarRol)
    .filter((r): r is Rol => r !== null);
  return [...new Set(canonicos)];
}

// ── JWT ────────────────────────────────────────────────────────────────────

/** Payload de un JWT, o `null` si no se puede leer. */
function leerPayloadJwt(token: string): any | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/** `true` si el token venció o no se puede interpretar. */
export function isJwtExpired(token: string): boolean {
  const payload = leerPayloadJwt(token);
  if (!payload?.exp) return true;
  // exp viene en segundos, Date.now() en ms.
  return payload.exp * 1000 < Date.now();
}

/**
 * Roles firmados dentro del access token.
 *
 * Es la fuente de verdad del rol: el objeto `usuario` de localStorage lo puede
 * editar cualquiera y basta con que pierda su campo `roles` para que un admin
 * quede atrapado en la interfaz de cliente. El JWT viene firmado por el backend.
 */
export function rolesDesdeJwt(token: string | null | undefined): Rol[] {
  if (!token) return [];
  const payload = leerPayloadJwt(token);
  if (!payload) return [];
  return normalizarRoles(payload[CLAIM_ROL] ?? payload.role ?? payload.roles);
}

/** Id de usuario firmado en el token (claim `sub`). */
export function idDesdeJwt(token: string | null | undefined): string | null {
  if (!token) return null;
  const payload = leerPayloadJwt(token);
  return payload?.sub ?? payload?.nameid ?? null;
}

// ── Usuario ────────────────────────────────────────────────────────────────

export interface UsuarioSesion {
  id: string | null;
  nombre: string;
  correo: string;
  roles: Rol[];
  /** Compatibilidad: código antiguo lee `user.role` como string suelto. */
  role: Rol | null;
  /** Avatar, cuando la respuesta lo trae (el login no lo incluye). */
  fotoUrl?: string;
}

/**
 * Construye el usuario de sesión a partir de lo que devolvió la API y del JWT.
 *
 * Los roles del token mandan sobre los del DTO; si el token no trae ninguno
 * (tokens de desarrollo, por ejemplo) se cae a los del cuerpo de la respuesta.
 */
export function normalizarUsuario(usuarioApi: any, token?: string | null): UsuarioSesion {
  const rolesJwt = rolesDesdeJwt(token);
  const rolesDto = normalizarRoles(
    usuarioApi?.roles ?? (usuarioApi?.role != null ? [usuarioApi.role] : []),
  );
  const roles = rolesJwt.length > 0 ? rolesJwt : rolesDto;

  return {
    id: usuarioApi?.id ?? usuarioApi?.userId ?? idDesdeJwt(token),
    // El backend serializa `nombre`; varias pantallas leían `name` y mostraban
    // el espacio en blanco que se ve junto al icono de usuario.
    nombre: usuarioApi?.nombre ?? usuarioApi?.name ?? '',
    correo: usuarioApi?.correo ?? usuarioApi?.email ?? '',
    roles,
    role: roles[0] ?? null,
    fotoUrl: usuarioApi?.fotoUrl ?? usuarioApi?.photoURL ?? undefined,
  };
}

// ── Consultas de rol ───────────────────────────────────────────────────────

/** Roles canónicos de un usuario guardado, tolerando `role` o `roles`. */
export function getRoles(user: any): Rol[] {
  if (!user) return [];
  return normalizarRoles(user.roles ?? (user.role != null ? [user.role] : []));
}

export function esAdmin(user: any): boolean {
  return getRoles(user).includes(ROL.ADMIN);
}

export function esEmpleado(user: any): boolean {
  return getRoles(user).includes(ROL.EMPLEADO);
}

/**
 * Determina si el usuario autenticado es un cliente (puede añadir al carrito y
 * comprar). Tolera las dos formas en que se ha guardado el rol en localStorage:
 * `role` (string, como lo guardaba el registro) y `roles` (array, como lo
 * guardaba el inicio de sesión).
 */
export function esCliente(user: any): boolean {
  return getRoles(user).includes(ROL.CLIENTE);
}

/** Pantalla de inicio que le corresponde a un conjunto de roles. */
export function rutaInicialPorRol(roles: Rol[] | any): string {
  const canonicos = Array.isArray(roles) ? normalizarRoles(roles) : getRoles(roles);
  if (canonicos.includes(ROL.ADMIN)) return '/admin/dashboard';
  if (canonicos.includes(ROL.EMPLEADO)) return '/empleado/dashboard';
  if (canonicos.includes(ROL.CLIENTE)) return '/inicio';
  return '/';
}

// ── Almacenamiento de la sesión ────────────────────────────────────────────

/**
 * Claves que componen una sesión. `user` es una clave heredada que ya nadie
 * escribe pero que varias pantallas siguen leyendo como respaldo: si no se
 * borra al cerrar sesión, revive una sesión vieja en la siguiente visita.
 */
export const CLAVES_SESION = ['accessToken', 'refreshToken', 'usuario', 'user'] as const;

/** Borra por completo la sesión del navegador. */
export function limpiarSesion(): void {
  CLAVES_SESION.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* noop */
    }
  });
}

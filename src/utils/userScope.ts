// Aislamiento de datos por usuario en localStorage.
//
// El carrito, el borrador de checkout y el último recibo se guardaban con claves
// globales (compartidas por todos en el mismo navegador), lo que filtraba los
// datos de un usuario a otro (o a una cuenta nueva). Aquí centralizamos un
// identificador por cuenta para aislar esas claves: `cart:<id>`, etc.

const CLAVES_LEGACY = ['cart', 'checkout_draft', 'last_order', 'checkout_dedicatoria'];

/** Identificador estable del usuario actual, o 'guest' si no hay sesión. */
export const getUserScopeId = (): string => {
  try {
    const raw = localStorage.getItem('usuario') || localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      const id = u?.id ?? u?.userId ?? u?.sub;
      if (id) return String(id);
    }
  } catch { /* noop */ }
  return 'guest';
};

/** Clave de localStorage aislada por usuario. */
export const scopedKey = (base: string): string => `${base}:${getUserScopeId()}`;

/** Borra las claves globales viejas (no aisladas) para eliminar fugas previas. */
export const limpiarClavesLegacy = () => {
  CLAVES_LEGACY.forEach(k => {
    try { localStorage.removeItem(k); } catch { /* noop */ }
  });
};

/**
 * Al iniciar sesión, pasa el carrito que se armó como invitado a la cuenta del
 * usuario (fusionando cantidades), para no perder lo que agregó antes de entrar.
 */
export const fusionarCarritoInvitadoEn = (userId: string) => {
  try {
    const guest = JSON.parse(localStorage.getItem('cart:guest') || '[]');
    if (!Array.isArray(guest) || guest.length === 0) return;

    const key = `cart:${userId}`;
    const actual: any[] = JSON.parse(localStorage.getItem(key) || '[]');
    const mapa = new Map(actual.map(i => [i.id, i]));
    for (const item of guest) {
      const ex = mapa.get(item.id);
      if (ex) ex.quantity += item.quantity;
      else mapa.set(item.id, item);
    }
    localStorage.setItem(key, JSON.stringify([...mapa.values()]));
    localStorage.removeItem('cart:guest');
  } catch { /* noop */ }
};

/**
 * Se llama tras iniciar sesión o registrarse: fusiona el carrito de invitado y
 * avisa a la app (evento) para que el carrito y demás se recarguen con el nuevo
 * usuario, ya que login/registro navegan sin recargar la página.
 */
export const notificarCambioDeSesion = () => {
  const id = getUserScopeId();
  if (id !== 'guest') fusionarCarritoInvitadoEn(id);
  window.dispatchEvent(new Event('auth-changed'));
  window.dispatchEvent(new Event('cart-updated'));
};

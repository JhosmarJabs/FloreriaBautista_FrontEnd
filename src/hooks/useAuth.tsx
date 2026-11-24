import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ROL,
  Rol,
  UsuarioSesion,
  idDesdeJwt,
  isJwtExpired,
  limpiarSesion,
  normalizarUsuario,
} from '../utils/auth';
import { notificarCambioDeSesion } from '../utils/userScope';
import { MisPedidosCache } from '../services/misPedidosCache';
import { borrarDedicatoriasEnCurso } from '../utils/checkout';
import { apiCache } from '../services/apiCache';

/**
 * Fuente de verdad de la sesión.
 *
 * Antes cada componente releía `localStorage` por su cuenta dentro de un
 * `useEffect`, así que el primer render siempre ocurría sin rol y la app pintaba
 * la interfaz pública antes de saber quién había entrado. Además, si el objeto
 * `usuario` guardado perdía su campo `roles`, nada lo reparaba: un admin se
 * quedaba viendo la tienda de cliente sin manera de salir. Aquí el rol se deriva
 * del JWT, que viene firmado por el backend.
 */

interface AuthContextValue {
  usuario: UsuarioSesion | null;
  roles: Rol[];
  token: string | null;
  isAuthenticated: boolean;
  esAdmin: boolean;
  esEmpleado: boolean;
  esCliente: boolean;
  /** `true` mientras se hidrata la sesión desde localStorage. */
  cargando: boolean;
  /** Guarda la sesión tras un login/registro correcto. Devuelve los roles. */
  login: (payload: any) => Rol[];
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface EstadoSesion {
  usuario: UsuarioSesion | null;
  token: string | null;
}

const SIN_SESION: EstadoSesion = { usuario: null, token: null };

/** Identidad de la cuenta de una sesión: `sub` del JWT, o el id guardado. */
function identidadDe(s: EstadoSesion): string | null {
  if (!s.token) return null;
  return idDesdeJwt(s.token) ?? s.usuario?.id ?? null;
}

/**
 * Reconstruye la sesión a partir de lo guardado en el navegador.
 *
 * Descarta la sesión si no hay token o si venció, y reconstruye el usuario desde
 * el JWT cuando lo guardado quedó incompleto o no concuerda con el token.
 */
function hidratarSesion(opciones: { reescribir?: boolean } = {}): EstadoSesion {
  const { reescribir = true } = opciones;
  let token: string | null = null;
  let crudo: string | null = null;

  try {
    token = localStorage.getItem('accessToken');
    crudo = localStorage.getItem('usuario') || localStorage.getItem('user');
  } catch {
    return SIN_SESION;
  }

  if (!token) {
    // Puede quedar un `usuario` huérfano de un logout incompleto.
    if (crudo) limpiarSesion();
    return SIN_SESION;
  }

  // Los tokens de desarrollo (`local-token-…`) no son JWT; se dejan pasar y el
  // rol sale entonces del objeto guardado.
  const esJwt = !token.startsWith('local-token-');
  if (esJwt && isJwtExpired(token)) {
    // Si hay refresh token, dejar la sesión activa: el interceptor de api.ts
    // renovará el access token en la primera llamada. Solo limpiar cuando
    // no queda refresh token (sesión irrecuperable).
    let tieneRefresh = false;
    try { tieneRefresh = !!localStorage.getItem('refreshToken'); } catch { /* noop */ }
    if (!tieneRefresh) {
      limpiarSesion();
      return SIN_SESION;
    }
  }

  let guardado: any = null;
  try {
    guardado = crudo ? JSON.parse(crudo) : null;
  } catch {
    guardado = null;
  }

  // Si el objeto guardado es de otra cuenta que el token (otra pestaña a medio
  // escribir), manda el JWT: se descarta lo guardado y se reconstruye de él.
  const idJwt = esJwt ? idDesdeJwt(token) : null;
  const idGuardado = guardado?.id ?? guardado?.userId ?? null;
  if (idJwt && idGuardado && String(idGuardado) !== String(idJwt)) {
    guardado = null;
  }

  const usuario = normalizarUsuario(guardado ?? {}, esJwt ? token : null);

  if (usuario.roles.length === 0) {
    // Sesión sin rol utilizable: mejor obligar a iniciar sesión otra vez que
    // degradar en silencio a cliente, que es lo que escondía el fallo.
    limpiarSesion();
    return SIN_SESION;
  }

  // Reescribe lo guardado si estaba incompleto o desalineado con el token. Desde
  // el oyente `storage` solo se lee: dos pestañas no deben pisarse el `usuario`.
  if (reescribir) {
    try {
      localStorage.setItem('usuario', JSON.stringify(usuario));
    } catch {
      /* noop */
    }
  }

  return { usuario, token };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [sesion, setSesion] = useState<EstadoSesion>(() => hidratarSesion());
  const [cargando] = useState(false);

  // Identidad de la sesión vigente de esta pestaña (también la mueven login y
  // logout propios, porque cambian `sesion`).
  const identidadRef = useRef<string | null>(identidadDe(sesion));
  useEffect(() => {
    identidadRef.current = identidadDe(sesion);
  }, [sesion]);

  // Mantiene sincronizadas las pestañas abiertas (REV-001). Tres casos:
  //  - misma identidad (p. ej. renovación del token): solo se actualiza la sesión;
  //  - X -> nadie o nadie -> Y: se vacía `apiCache` y se actualiza la sesión;
  //  - X -> Y directo: se vacía `apiCache` y se recarga, para reiniciar también
  //    pantallas montadas, campana, modales en vivo y formularios de X.
  // No se llama a `limpiarSesion()`/`DatasetStore.borrarTodo()` si hay sesión
  // nueva: borrarían copias de localStorage que la otra pestaña acaba de escribir.
  useEffect(() => {
    const alCambiarAlmacen = (e: StorageEvent) => {
      if (e.key && !['accessToken', 'usuario', 'user'].includes(e.key)) return;
      const nueva = hidratarSesion({ reescribir: false });
      const antes = identidadRef.current;
      const despues = identidadDe(nueva);
      if (despues !== antes) {
        apiCache.clear();
        if (antes && despues) {
          window.location.reload();
          return;
        }
      }
      setSesion(nueva);
    };
    window.addEventListener('storage', alCambiarAlmacen);
    return () => window.removeEventListener('storage', alCambiarAlmacen);
  }, []);

  /**
   * Centraliza lo que antes duplicaban LoginPage y RegisterPage: guardar
   * tokens, normalizar el usuario y avisar del cambio de sesión.
   */
  const login = useCallback((payload: any): Rol[] => {
    const token = payload?.accessToken ?? payload?.token ?? '';
    const usuarioApi = payload?.usuario ?? payload?.user ?? payload;
    const usuario = normalizarUsuario(usuarioApi, token);

    try {
      localStorage.setItem('accessToken', token);
      if (payload?.refreshToken) {
        localStorage.setItem('refreshToken', payload.refreshToken);
      }
      localStorage.setItem('usuario', JSON.stringify(usuario));
      // Clave heredada: si sobrevive, otras pantallas leen una sesión vieja.
      localStorage.removeItem('user');
    } catch {
      /* noop */
    }

    apiCache.clear();
    setSesion({ usuario, token });

    // Aísla el carrito por usuario y fusiona lo agregado como invitado.
    notificarCambioDeSesion();

    return usuario.roles;
  }, []);

  const logout = useCallback(() => {
    limpiarSesion();
    // La dedicatoria a medio escribir tampoco debe quedar en la pestaña.
    borrarDedicatoriasEnCurso();
    // Lo que el PWA guardó para usarse sin red no debe sobrevivir a la sesión.
    MisPedidosCache.borrarTodo();
    if ('caches' in window) {
      ['api-catalogo', 'api-detalle', 'api-publica'].forEach((nombre) =>
        caches.delete(nombre).catch(() => { /* noop */ }));
    }
    setSesion(SIN_SESION);
    notificarCambioDeSesion();
    navigate('/login');
  }, [navigate]);

  const valor = useMemo<AuthContextValue>(() => {
    const roles = sesion.usuario?.roles ?? [];
    return {
      usuario: sesion.usuario,
      roles,
      token: sesion.token,
      isAuthenticated: !!sesion.token && !!sesion.usuario,
      esAdmin: roles.includes(ROL.ADMIN),
      esEmpleado: roles.includes(ROL.EMPLEADO),
      esCliente: roles.includes(ROL.CLIENTE),
      cargando,
      login,
      logout,
    };
  }, [sesion, cargando, login, logout]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return ctx;
};

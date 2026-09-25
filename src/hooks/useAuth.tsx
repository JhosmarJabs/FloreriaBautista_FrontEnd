import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ROL,
  Rol,
  UsuarioSesion,
  isJwtExpired,
  limpiarSesion,
  normalizarUsuario,
} from '../utils/auth';
import { notificarCambioDeSesion } from '../utils/userScope';

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

/**
 * Reconstruye la sesión a partir de lo guardado en el navegador.
 *
 * Descarta la sesión si no hay token o si venció, y reconstruye el usuario desde
 * el JWT cuando lo guardado quedó incompleto o no concuerda con el token.
 */
function hidratarSesion(): EstadoSesion {
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

  const usuario = normalizarUsuario(guardado ?? {}, esJwt ? token : null);

  if (usuario.roles.length === 0) {
    // Sesión sin rol utilizable: mejor obligar a iniciar sesión otra vez que
    // degradar en silencio a cliente, que es lo que escondía el fallo.
    limpiarSesion();
    return SIN_SESION;
  }

  // Reescribe lo guardado si estaba incompleto o desalineado con el token.
  try {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  } catch {
    /* noop */
  }

  return { usuario, token };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [sesion, setSesion] = useState<EstadoSesion>(() => hidratarSesion());
  const [cargando] = useState(false);

  // Mantiene sincronizadas las pestañas abiertas: cerrar sesión en una debe
  // cerrarla en las demás.
  useEffect(() => {
    const alCambiarAlmacen = (e: StorageEvent) => {
      if (e.key && !['accessToken', 'usuario', 'user'].includes(e.key)) return;
      setSesion(hidratarSesion());
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

    setSesion({ usuario, token });

    // Aísla el carrito por usuario y fusiona lo agregado como invitado.
    notificarCambioDeSesion();

    return usuario.roles;
  }, []);

  const logout = useCallback(() => {
    limpiarSesion();
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

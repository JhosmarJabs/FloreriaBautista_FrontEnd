import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle, Wrench } from "lucide-react";
import { notificarCambioDeSesion } from "../../utils/userScope";

const DEV_ACCOUNTS = [
  { label: "Admin", correo: "admin@gmail.com", contrasena: "J@bs1234" },
  { label: "Empleado", correo: "empleado@gmail.com", contrasena: "J@bs1234" },
  { label: "Cliente", correo: "Jabs@gmail.com", contrasena: "J@bs1234" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const performLogin = async (correoInput: string, contrasenaInput: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: correoInput, contrasena: contrasenaInput }),
      });

      if (!res.ok) {
        setError("Los datos ingresados no son válidos.");
        return;
      }

      const json = await res.json();
      const payload = json.data ?? json;

      localStorage.setItem(
        "accessToken",
        payload.accessToken ?? payload.token ?? "",
      );
      if (payload.refreshToken)
        localStorage.setItem("refreshToken", payload.refreshToken);
      const usuarioBase = payload.usuario ?? payload.user ?? payload;

      const roles: string[] = (
        payload.usuario?.roles ??
        payload.user?.roles ??
        payload.roles ??
        []
      ).map((r: string) => r.toLowerCase());

      // Guardar también `role` (string) para mantener consistencia con el registro
      // y que las validaciones de rol (p. ej. añadir al carrito) funcionen.
      localStorage.setItem(
        "usuario",
        JSON.stringify({ ...usuarioBase, role: roles[0] ?? "cliente" }),
      );

      // Aísla el carrito por usuario: recarga el del nuevo usuario y fusiona
      // lo que se hubiera agregado como invitado.
      notificarCambioDeSesion();

      if (roles.includes("administrador") || roles.includes("admin")) {
        navigate("/admin/dashboard");
      } else if (roles.includes("empleado") || roles.includes("staff")) {
        navigate("/empleado/dashboard");
      } else {
        navigate("/");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(correo, contrasena);
  };

  const handleDevLogin = (correoDev: string, contrasenaDev: string) => {
    setCorreo(correoDev);
    setContrasena(contrasenaDev);
    performLogin(correoDev, contrasenaDev);
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-[#f0f7ff]">
      {/* Split Layout: Image Side */}
      <div className="hidden lg:block lg:w-1/2 relative bg-brand-coral/10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAPzKgR1X_4EoHq1FDeSRZKy1qZkBKVqU-2j0BdJfWITLNmCMp1ml7VtKR4eBz-mxP1NxL3vmNPa_m9AzqYkmfiaS2rVjMRTp3UZ2LbQJclP_sgKT6FjxK7f6FEM0Byg5MAjzn4ZsAEqhXxwwJYG4M8Wk-zCBHWCC07V2fXPaZm1SjffI6qv-w_8oxjdBfzDGivcc4AXBTKfVnbGvp7ucQTAbgVm8kYuGzfeUfWjdpSZ43wXwKFtyH_lUVwY_7tG9EPi-5Mv31-0Oe1')",
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/80 to-transparent"></div>
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            La elegancia de lo natural en tu puerta.
          </h2>
          <p className="text-white/80 text-lg">
            Inicia sesión para personalizar tus pedidos y seguir el envío de tus
            flores favoritas.
          </p>
        </div>
      </div>

      {/* Split Layout: Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-[#f0f7ff]">
        <div className="w-full max-w-md space-y-8">
          <div className="mb-8">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-brand-coral hover:text-brand-coral/80 font-semibold transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Regresar</span>
            </button>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black tracking-tight text-brand-deep mb-2">
              Bienvenido de nuevo
            </h2>
            <p className="text-slate-500">
              Inicia sesión para gestionar tus pedidos florales
            </p>
          </div>

          {/* Botones de acceso rápido — SOLO en modo desarrollo */}
          {import.meta.env.DEV && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-wider">
                <Wrench className="w-4 h-4" />
                Acceso rápido (solo dev)
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DEV_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.label}
                    type="button"
                    disabled={loading}
                    onClick={() => handleDevLogin(acc.correo, acc.contrasena)}
                    className="py-2 px-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-60"
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="correo"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-coral/20 focus:border-brand-coral outline-none transition-all"
                  id="correo"
                  name="correo"
                  placeholder="ejemplo@correo.com"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="contrasena"
              >
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  className="block w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-coral/20 focus:border-brand-coral outline-none transition-all"
                  id="contrasena"
                  name="contrasena"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                />
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-brand-coral"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex justify-end">
                <Link
                  className="text-xs font-semibold text-brand-coral hover:underline"
                  to="/recuperar-contrasena"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <button
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 font-medium">
                O continuar con
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm text-slate-700">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                ></path>
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                ></path>
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                ></path>
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm text-slate-700">
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
              </svg>
              Facebook
            </button>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿No tienes una cuenta?{" "}
            <Link
              to="/registro"
              className="font-bold text-brand-coral hover:underline"
            >
              Crea una ahora
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

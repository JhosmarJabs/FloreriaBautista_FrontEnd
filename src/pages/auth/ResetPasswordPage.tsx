import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Extraemos el token y correo de la URL
  const tokenUrl = searchParams.get('token') || '';
  const emailUrl = searchParams.get('email') || '';

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Prevenimos que carguen la pantalla sin un token o correo válido
  if (!tokenUrl || !emailUrl) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f0f7ff] p-8">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-brand-deep mb-2">Enlace inválido</h2>
          <p className="text-slate-500 mb-6">El enlace de recuperación es inválido o el token ha expirado. Por favor, solicita uno nuevo.</p>
          <button
            onClick={() => navigate("/recuperar-contrasena")}
            className="w-full bg-brand-coral hover:bg-brand-coral/90 text-white font-bold py-3 px-4 rounded-xl transition-all"
          >
            Solicitar nuevo enlace
          </button>
        </div>
      </main>
    );
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor verifica.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailUrl, token: tokenUrl, newPassword: password }),
      });

      if (!res.ok) {
        setError("Ocurrió un error al intentar cambiar la contraseña. El enlace puede haber expirado.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Error de conexión. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-[#f0f7ff]">
      {/* Split Layout: Image Side */}
      <div className="hidden lg:block lg:w-1/2 relative bg-brand-coral/10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1542458428-1f196924ab74?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')",
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/90 via-brand-deep/40 to-transparent"></div>
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-4xl font-black leading-tight mb-4 drop-shadow-md">
            Un nuevo comienzo <br /> empieza ahora.
          </h2>
          <p className="text-white/90 text-lg font-medium drop-shadow">
            Crea una nueva contraseña segura para proteger todos tus pedidos y seguir disfrutando del catálogo.
          </p>
        </div>
      </div>

      {/* Split Layout: Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-[#f0f7ff]">
        <div className="w-full max-w-md space-y-8">
          
          {success ? (
            <div className="bg-white border border-green-200 rounded-2xl p-8 flex flex-col items-center text-center gap-4 shadow-xl animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-brand-deep">¡Contraseña actualizada!</h3>
              <p className="text-slate-500 mb-4">
                Tu contraseña se ha restablecido correctamente. Ya puedes acceder a tu cuenta utilizando tu nueva contraseña.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-3xl font-black tracking-tight text-brand-deep mb-2">
                  Restablecer contraseña
                </h2>
                <p className="text-slate-500">
                  Ingresa tu nueva contraseña para la cuenta <br/>
                  <span className="font-semibold text-brand-coral">{emailUrl}</span>
                </p>
              </div>

              {/* Error Message Alert */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleResetPassword}>
                
                {/* Nueva Contraseña */}
                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-slate-700"
                    htmlFor="password"
                  >
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      className="block w-full pl-10 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-coral/20 focus:border-brand-coral outline-none transition-all shadow-sm"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-brand-coral transition-colors"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-slate-700"
                    htmlFor="confirmPassword"
                  >
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      className="block w-full pl-10 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-coral/20 focus:border-brand-coral outline-none transition-all shadow-sm"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="••••••••"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-brand-coral transition-colors"
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                    type="submit"
                    disabled={loading || !password || !confirmPassword}
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : "Restablecer contraseña"}
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </main>
  );
}

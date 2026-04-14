import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: correo }),
      });

      if (!res.ok) {
        setError("No pudimos procesar tu solicitud. Verifica que el correo esté registrado.");
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
              "url('https://images.unsplash.com/photo-1563241527-3004b7be0ffd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')",
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-deep/90 via-brand-deep/40 to-transparent"></div>
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-4xl font-black leading-tight mb-4 drop-shadow-md">
            Nunca pierdas el acceso <br /> a tus momentos especiales.
          </h2>
          <p className="text-white/90 text-lg font-medium drop-shadow">
            Te ayudamos a recuperar tu cuenta para que sigas enviando emociones a través de las mejores flores.
          </p>
        </div>
      </div>

      {/* Split Layout: Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-[#f0f7ff]">
        <div className="w-full max-w-md space-y-8">
          <div className="mb-8">
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 text-brand-coral hover:text-brand-coral/80 font-semibold transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver a iniciar sesión</span>
            </button>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black tracking-tight text-brand-deep mb-2">
              Recuperar contraseña
            </h2>
            <p className="text-slate-500">
              Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
            </p>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message Alert */}
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center text-center gap-3 animate-in fade-in zoom-in-95">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
              <h3 className="text-lg font-bold text-green-800">¡Correo enviado!</h3>
              <p className="text-sm text-green-700 mb-4">
                Hemos enviado un enlace de recuperación a <strong>{correo}</strong>. Por favor, revisa tu bandeja de entrada o la carpeta de spam.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-green-500/30 transition-all"
              >
                Entendido, ir al login
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleRequestReset}>
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
                    className="block w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-coral/20 focus:border-brand-coral outline-none transition-all shadow-sm"
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

              <button
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                type="submit"
                disabled={loading || !correo}
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : "Enviar enlace de recuperación"}
              </button>
            </form>
          )}

          {!success && (
            <p className="text-center text-sm text-slate-500 mt-6">
              ¿Recordaste tu contraseña?{" "}
              <Link
                to="/login"
                className="font-bold text-brand-coral hover:underline"
              >
                Inicia sesión aquí
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

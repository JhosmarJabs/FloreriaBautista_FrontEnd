import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { notificarCambioDeSesion } from '../../utils/userScope';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    correo: '',
    telefono: '',
    sexo: '',
    fechaNacimiento: '',
  });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordsMatch = confirm.length > 0 && password === confirm;
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasMinLength || !hasUppercase || !hasNumber) {
      setError('La contraseña no cumple los requisitos mínimos.');
      return;
    }
    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      const telefono = form.telefono ? `+521${form.telefono}` : undefined;

      // El backend espera un solo campo "apellido": unimos paterno + materno.
      const apellido = `${form.apellidoPaterno} ${form.apellidoMaterno}`.trim();

      const res = await api.post('/api/auth/register', {
        nombre: form.nombre,
        apellido,
        correo: form.correo,
        contrasena: password,
        ...(telefono && { telefono }),
        ...(form.sexo && { sexo: form.sexo }),
        ...(form.fechaNacimiento && { fechaNacimiento: form.fechaNacimiento }),
      });

      const { accessToken, refreshToken, usuario } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('usuario', JSON.stringify({
        ...usuario,
        role: usuario.roles?.[0]?.toLowerCase() ?? 'cliente',
      }));

      // Aísla el carrito por usuario (cuenta nueva parte de un carrito propio).
      notificarCambioDeSesion();

      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al crear la cuenta. Intenta de nuevo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-brand-coral/20 focus:border-brand-coral outline-none transition-all';

  return (
    <main className="min-h-screen flex items-center justify-center py-4 px-4 sm:px-6 lg:px-8 bg-[#f0f7ff]">
      <div className="max-w-6xl w-full bg-[#f0f7ff] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Side Image Panel */}
        <div className="lg:w-1/2 relative hidden lg:block">
          <div className="absolute inset-0 bg-brand-coral/10 mix-blend-multiply"></div>
          <img
            alt="Premium Bouquet"
            className="h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhiiM0MK5qtvm5FrmQ_lpkQIR_WS5UlVsed3SPmlrHhC0kYmnXaQPF9q0TwADGBra8ObaUbqCnZqTYTEua_nTWhjbaAr2kuubs-PWlHwHhflDCZpmETV5EyIbZvMCoX-6X_L38qcJSuWQSOoeZBZCcObwdxGuanSTogd5DEmqUI21R6wYMV7QNMn-EWvqcMse_NhRhLO1pXpu_UWYcPT_1Mfk787WbdozLAFvnHv1nSRP2HP07uCId1QCU23OznaGP-e6haAeQcoR2"
          />
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
            <h2 className="text-2xl font-bold text-white mb-1">Diseños que cuentan historias</h2>
            <p className="text-slate-200 text-base">Únete a nuestra comunidad exclusiva y recibe las mejores flores frescas en la puerta de tu hogar.</p>
          </div>
        </div>

        {/* Registration Form Panel */}
        <div className="lg:w-1/2 p-6 sm:p-8 lg:p-10">
          <div className="mb-4 text-center lg:text-left">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center lg:justify-start gap-1 text-brand-coral hover:text-brand-coral/80 font-semibold text-sm mb-2 transition-colors w-full lg:w-auto"
              type="button"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <h1 className="text-2xl font-extrabold text-brand-deep mb-1">Crear una cuenta</h1>
            <p className="text-slate-500 text-sm">Regístrate para comenzar tu experiencia floral personalizada.</p>
          </div>

          {error && (
            <div className="mb-3 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-0.5">
              <label className="text-sm font-semibold text-slate-700">Nombre</label>
              <input
                className={`w-full ${inputClass}`}
                placeholder="Ej. Juan"
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <label className="text-sm font-semibold text-slate-700">Apellido paterno</label>
                <input
                  className={`w-full ${inputClass}`}
                  placeholder="Ej. Pérez"
                  type="text"
                  name="apellidoPaterno"
                  value={form.apellidoPaterno}
                  onChange={handleChange}
                  maxLength={100}
                  required
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-sm font-semibold text-slate-700">Apellido materno</label>
                <input
                  className={`w-full ${inputClass}`}
                  placeholder="Ej. García"
                  type="text"
                  name="apellidoMaterno"
                  value={form.apellidoMaterno}
                  onChange={handleChange}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="text-sm font-semibold text-slate-700">Correo electrónico</label>
              <input
                className={`w-full ${inputClass}`}
                placeholder="hola@ejemplo.com"
                type="email"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                maxLength={150}
                required
              />
            </div>

            <div className="space-y-0.5">
              <label className="text-sm font-semibold text-slate-700">Teléfono</label>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-brand-coral/20 focus-within:border-brand-coral transition-all">
                <span className="flex items-center px-3 py-2 bg-slate-100 border-r border-slate-200 text-slate-600 font-semibold text-sm select-none whitespace-nowrap">
                  +52 1
                </span>
                <input
                  className="flex-1 px-3 py-2 bg-transparent outline-none text-slate-700 placeholder-slate-400"
                  placeholder="234 567 890"
                  type="tel"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <label className="text-sm font-semibold text-slate-700">Sexo</label>
                <select
                  className={`w-full ${inputClass}`}
                  name="sexo"
                  value={form.sexo}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="space-y-0.5">
                <label className="text-sm font-semibold text-slate-700">Fecha de nacimiento</label>
                <input
                  className={`w-full ${inputClass}`}
                  type="date"
                  name="fechaNacimiento"
                  value={form.fechaNacimiento}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="text-sm font-semibold text-slate-700">Contraseña</label>
              <div className={`relative rounded-xl border transition-all ${passwordsMatch ? 'border-green-400 bg-green-50 ring-2 ring-green-200' : 'border-slate-200 bg-slate-50'}`}>
                <input
                  className="w-full px-3 py-2 bg-transparent outline-none transition-all"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-coral" type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className={`flex items-center gap-1 text-[11px] font-medium ${hasMinLength ? 'text-green-600' : 'text-slate-500'}`}>
                  <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${hasMinLength ? 'bg-green-500 text-white' : 'border border-slate-300'}`}>{hasMinLength ? '✓' : ''}</span> 8+ caracteres
                </span>
                <span className={`flex items-center gap-1 text-[11px] font-medium ${hasUppercase ? 'text-green-600' : 'text-slate-500'}`}>
                  <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${hasUppercase ? 'bg-green-500 text-white' : 'border border-slate-300'}`}>{hasUppercase ? '✓' : ''}</span> 1 mayúscula
                </span>
                <span className={`flex items-center gap-1 text-[11px] font-medium ${hasNumber ? 'text-green-600' : 'text-slate-500'}`}>
                  <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${hasNumber ? 'bg-green-500 text-white' : 'border border-slate-300'}`}>{hasNumber ? '✓' : ''}</span> 1 número
                </span>
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="text-sm font-semibold text-slate-700">Confirmar contraseña</label>
              <div className={`relative rounded-xl border transition-all ${passwordsMatch ? 'border-green-400 bg-green-50 ring-2 ring-green-200' : 'border-slate-200 bg-slate-50'}`}>
                <input
                  className="w-full px-3 py-2 bg-transparent outline-none transition-all"
                  placeholder="••••••••"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
                  required
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-coral" type="button" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold text-base transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mt-2"
              type="submit"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear cuenta'}
            </button>

            <div className="text-center pt-1">
              <p className="text-sm text-slate-600">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-brand-coral font-bold hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

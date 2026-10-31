// src/pages/Restablecer.tsx
import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { api } from '../services/api';

const requisitos = (clave: string) => [
  { texto: 'Al menos 10 caracteres', ok: clave.trim().length >= 10 },
  { texto: 'Letras y números', ok: /[A-Za-zÀ-ÿ]/.test(clave) && /[0-9]/.test(clave) }
];

export const Restablecer: React.FC = () => {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [estado, setEstado] = useState<'validando' | 'invalido' | 'formulario' | 'listo'>('validando');
  const [tipo, setTipo] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Quita el token de la barra de direcciones y del historial
    window.history.replaceState(null, '', window.location.pathname);
    if (!token) {
      setEstado('invalido');
      return;
    }
    api.post('/auth/restablecer/validar', { token })
      .then(res => {
        setTipo(res.data.tipo);
        setEstado(res.data.valido ? 'formulario' : 'invalido');
      })
      .catch(() => setEstado('invalido'));
  }, [token]);

  const esInvitacion = tipo === 'INVITACION';
  const cumple = requisitos(password).every(r => r.ok);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cumple) return setError('La contraseña no cumple los requisitos.');
    if (password !== confirmacion) return setError('Las contraseñas no coinciden.');
    setEnviando(true);
    setError(null);
    try {
      await api.post('/auth/restablecer', { token, password });
      // La sesión guardada en este navegador ya no es válida
      localStorage.removeItem('token');
      localStorage.removeItem('emisor');
      setEstado('listo');
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo actualizar la contraseña.');
    } finally {
      setEnviando(false);
    }
  };

  const campo = 'w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-10 pr-11 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl">
        {estado === 'validando' && (
          <div className="flex flex-col items-center gap-3 py-8 text-slate-300 text-sm">
            <Loader2 className="animate-spin" size={28} />
            Validando el enlace...
          </div>
        )}

        {estado === 'invalido' && (
          <div className="text-center">
            <AlertCircle className="mx-auto text-amber-400 mb-3" size={36} />
            <h1 className="text-xl font-bold text-white">El enlace ya no es válido</h1>
            <p className="text-sm text-slate-400 mt-2 mb-6">Venció, ya se usó o se pidió uno más reciente. Solicita uno nuevo desde la pantalla de ingreso.</p>
            <a href="/" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl">Ir a ingresar</a>
          </div>
        )}

        {estado === 'listo' && (
          <div className="text-center">
            <CheckCircle className="mx-auto text-emerald-400 mb-3" size={36} />
            <h1 className="text-xl font-bold text-white">Contraseña guardada</h1>
            <p className="text-sm text-slate-400 mt-2 mb-6">Ya puedes ingresar con tu nueva contraseña. Las sesiones anteriores se cerraron.</p>
            <a href="/" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl">Ingresar</a>
          </div>
        )}

        {estado === 'formulario' && (
          <>
            <h1 className="text-xl font-bold text-white">{esInvitacion ? 'Activa tu cuenta' : 'Crea una nueva contraseña'}</h1>
            <p className="text-sm text-slate-400 mt-1 mb-6">{esInvitacion ? 'Define la contraseña con la que vas a ingresar.' : 'Al guardarla se cerrarán las sesiones abiertas.'}</p>

            {error && (
              <div className="mb-4 flex items-start gap-3 bg-red-950/50 border border-red-800 text-red-300 p-3 rounded-lg text-sm">
                <AlertCircle className="flex-shrink-0 mt-0.5" size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nueva" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nueva contraseña</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Lock size={18} /></span>
                  <input id="nueva" type={mostrar ? 'text' : 'password'} autoComplete="new-password" required className={campo} value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setMostrar(!mostrar)} className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-200" aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    {mostrar ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <ul className="space-y-1">
                {requisitos(password).map(r => (
                  <li key={r.texto} className={`flex items-center gap-2 text-xs ${r.ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle size={14} /> {r.texto}
                  </li>
                ))}
              </ul>

              <div>
                <label htmlFor="confirmar" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Confirmar contraseña</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Lock size={18} /></span>
                  <input id="confirmar" type={mostrar ? 'text' : 'password'} autoComplete="new-password" required className={campo} value={confirmacion} onChange={e => setConfirmacion(e.target.value)} />
                </div>
              </div>

              <button type="submit" disabled={enviando} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2">
                {enviando && <Loader2 className="animate-spin" size={18} />}
                Guardar contraseña
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

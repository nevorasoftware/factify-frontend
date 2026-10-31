// src/components/Configuracion/CambiarPassword.tsx
import React, { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export const CambiarPassword: React.FC = () => {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nueva !== confirmacion) {
      setMensaje({ ok: false, texto: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await api.post('/auth/cambiar-password', { actual, nueva });
      localStorage.setItem('token', res.data.token);
      setActual('');
      setNueva('');
      setConfirmacion('');
      setMensaje({ ok: true, texto: 'Contraseña actualizada. Se cerraron las demás sesiones.' });
    } catch (err: any) {
      setMensaje({ ok: false, texto: err.response?.data?.error || 'No se pudo cambiar la contraseña.' });
    } finally {
      setGuardando(false);
    }
  };

  const campo = 'w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors';
  const etiqueta = 'block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2';

  return (
    <form onSubmit={guardar} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 mt-6">
      <h2 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
        <KeyRound size={18} className="text-blue-600" />
        <span>Contraseña de acceso</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="pass-actual" className={etiqueta}>Contraseña actual</label>
          <input id="pass-actual" className={campo} type="password" autoComplete="current-password" value={actual} onChange={e => setActual(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="pass-nueva" className={etiqueta}>Nueva contraseña</label>
          <input id="pass-nueva" className={campo} type="password" autoComplete="new-password" value={nueva} onChange={e => setNueva(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="pass-confirmar" className={etiqueta}>Confirmar nueva</label>
          <input id="pass-confirmar" className={campo} type="password" autoComplete="new-password" value={confirmacion} onChange={e => setConfirmacion(e.target.value)} required />
        </div>
      </div>
      <p className="text-xs text-gray-500">Al menos 10 caracteres, con letras y números.</p>
      {mensaje && <p className={`text-sm font-medium ${mensaje.ok ? 'text-emerald-700' : 'text-red-600'}`}>{mensaje.texto}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={guardando} className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto">
          {guardando && <Loader2 className="animate-spin" size={16} />}
          Cambiar contraseña
        </button>
      </div>
    </form>
  );
};

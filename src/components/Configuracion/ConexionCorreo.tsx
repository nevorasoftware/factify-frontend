// src/components/Configuracion/ConexionCorreo.tsx
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import { conectarCorreo, desconectarCorreo, obtenerConexionCorreo } from '../../services/compra.service';

const CLASE_CAMPO = 'w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors';
const CLASE_ETIQUETA = 'block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2';

const mensajeDe = (err: any, alterno: string) => err.response?.data?.error || err.message || alterno;

// Formulario propio: conectar el correo prueba el acceso de inmediato, sin esperar a "Guardar Configuración".
export const ConexionCorreo: React.FC = () => {
  const [estado, setEstado] = useState<any>(null);
  const [host, setHost] = useState('');
  const [password, setPassword] = useState('');
  const [editando, setEditando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    try {
      const res = await obtenerConexionCorreo();
      setEstado(res);
      setHost(res.host || '');
    } catch (err: any) {
      setError(mensajeDe(err, 'No se pudo consultar la conexión de correo'));
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const conectar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await conectarCorreo(host, password);
      setPassword('');
      setEditando(false);
      await cargar();
    } catch (err: any) {
      setError(mensajeDe(err, 'No se pudo conectar el correo'));
    } finally {
      setEnviando(false);
    }
  };

  const desconectar = async () => {
    if (!window.confirm('¿Desconectar el correo? Las compras ya registradas se conservan.')) return;
    setError(null);
    try {
      await desconectarCorreo();
      await cargar();
    } catch (err: any) {
      setError(mensajeDe(err, 'No se pudo desconectar el correo'));
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4 mt-6">
      <h2 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
        <Mail size={18} className="text-blue-600" />
        <span>Lectura de Compras desde el Correo</span>
      </h2>

      {error && <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm text-red-700">{error}</div>}

      {!estado && !error && <Loader2 size={18} className="animate-spin text-blue-600" />}

      {estado && !estado.disponible && (
        <p className="text-xs text-gray-500">La lectura de correo aún no está habilitada en el servidor.</p>
      )}

      {estado?.disponible && estado.conectado && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <CheckCircle2 size={18} className="shrink-0 text-green-600" />
            <span className="break-all">Conectado: {estado.correo} ({estado.host})</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditando(!editando)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-blue-200 transition-colors">
              {editando ? 'Cancelar' : 'Cambiar contraseña'}
            </button>
            <button type="button" onClick={desconectar} className="bg-white hover:bg-red-50 text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl border border-red-200 transition-colors">
              Desconectar
            </button>
          </div>
        </div>
      )}

      {estado?.disponible && (!estado.conectado || editando) && (
        <form onSubmit={conectar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="correo-compras" className={CLASE_ETIQUETA}>Correo a leer</label>
            <input id="correo-compras" className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-xl py-2.5 px-4 text-sm font-semibold focus:outline-none cursor-not-allowed" value={estado.correo || ''} readOnly />
          </div>
          <div>
            <label htmlFor="servidor-imap" className={CLASE_ETIQUETA}>Servidor de correo (IMAP)</label>
            <input id="servidor-imap" className={`${CLASE_CAMPO} font-mono`} value={host} onChange={e => setHost(e.target.value)} placeholder="Ej. imap.gmail.com" required />
          </div>
          <div>
            <label htmlFor="password-correo" className={CLASE_ETIQUETA}>Contraseña de aplicación</label>
            <input id="password-correo" className={CLASE_CAMPO} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={enviando} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-60">
              {enviando && <Loader2 size={16} className="animate-spin" />} Conectar correo
            </button>
          </div>
          <p className="md:col-span-2 text-xs text-gray-500">
            No use la contraseña normal del correo. En Gmail se crea en{' '}
            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Contraseñas de aplicaciones</a>{' '}
            y requiere tener activa la verificación en dos pasos. El correo solo se lee: no se marca como leído ni se modifica.
          </p>
        </form>
      )}
    </div>
  );
};

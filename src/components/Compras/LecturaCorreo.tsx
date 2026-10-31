// src/components/Compras/LecturaCorreo.tsx
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Mail, Unplug } from 'lucide-react';
import {
  conectarCorreo, desconectarCorreo, iniciarLecturaCorreo, obtenerConexionCorreo, obtenerLecturaCorreo
} from '../../services/compra.service';

type Periodo = 'TODO' | 'MES' | 'DIA';

const OPCIONES: { periodo: Periodo; texto: string }[] = [
  { periodo: 'DIA', texto: 'Leer hoy' },
  { periodo: 'MES', texto: 'Leer este mes' },
  { periodo: 'TODO', texto: 'Leer toda la bandeja' }
];

const mensajeDe = (err: any, alterno: string) => err.response?.data?.error || err.message || alterno;

export const LecturaCorreo: React.FC<{ alTerminar: () => void }> = ({ alTerminar }) => {
  const [estado, setEstado] = useState<any>(null);
  const [host, setHost] = useState('');
  const [password, setPassword] = useState('');
  const [conectando, setConectando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lectura, setLectura] = useState<any>(null);
  const temporizador = useRef<number | undefined>(undefined);

  const seguirLectura = (id: number) => {
    temporizador.current = window.setTimeout(async () => {
      try {
        const res = await obtenerLecturaCorreo(id);
        setLectura(res.importacion);
        if (res.importacion.estado === 'EN_PROCESO') seguirLectura(id);
        else alTerminar();
      } catch {
        seguirLectura(id);
      }
    }, 3000);
  };

  const cargar = async () => {
    try {
      const res = await obtenerConexionCorreo();
      setEstado(res);
      setHost(res.host || '');
      setLectura(res.ultima);
      if (res.ultima?.estado === 'EN_PROCESO') seguirLectura(res.ultima.id);
    } catch (err: any) {
      setError(mensajeDe(err, 'No se pudo consultar la conexión de correo'));
    }
  };

  useEffect(() => {
    cargar();
    return () => window.clearTimeout(temporizador.current);
  }, []);

  const conectar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConectando(true);
    try {
      await conectarCorreo(host, password);
      setPassword('');
      await cargar();
    } catch (err: any) {
      setError(mensajeDe(err, 'No se pudo conectar el correo'));
    } finally {
      setConectando(false);
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

  const leer = async (periodo: Periodo) => {
    setError(null);
    try {
      const res = await iniciarLecturaCorreo(periodo);
      setLectura(res.importacion);
      seguirLectura(res.importacion.id);
    } catch (err: any) {
      setError(mensajeDe(err, 'No se pudo iniciar la lectura'));
    }
  };

  if (!estado) {
    return error ? <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm text-red-700">{error}</div> : null;
  }

  const leyendo = lectura?.estado === 'EN_PROCESO';
  const detalle = (lectura?.detalle || []) as any[];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-150 p-6 mb-6">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary-50 text-primary-600 p-2 rounded-lg"><Mail size={20} /></div>
          <div>
            <h2 className="font-bold text-gray-900">Compras desde el correo</h2>
            <p className="text-sm text-gray-500 break-all">{estado.correo}</p>
          </div>
        </div>

        {estado.conectado && (
          <div className="flex flex-wrap items-center gap-2">
            {OPCIONES.map(({ periodo, texto }) => (
              <button
                key={periodo}
                onClick={() => leer(periodo)}
                disabled={leyendo}
                className="bg-primary-50 hover:bg-primary-100 text-primary-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {texto}
              </button>
            ))}
            <button
              onClick={desconectar}
              disabled={leyendo}
              title="Desconectar correo"
              aria-label="Desconectar correo"
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <Unplug size={18} />
            </button>
          </div>
        )}
      </div>

      {error && <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm text-red-700">{error}</div>}

      {!estado.disponible && (
        <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded-lg text-sm text-amber-800">
          La lectura de correo aún no está habilitada en el servidor.
        </div>
      )}

      {estado.disponible && !estado.conectado && (
        <form onSubmit={conectar} className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Servidor de correo (IMAP) *</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              required
              className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm font-mono"
              placeholder="Ej. imap.gmail.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contraseña de aplicación *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={conectando}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {conectando && <Loader2 size={16} className="animate-spin" />} Conectar correo
          </button>
          <p className="md:col-span-3 text-xs text-gray-500">
            No use la contraseña normal del correo. En Gmail se crea en{' '}
            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">Contraseñas de aplicaciones</a>{' '}
            y requiere tener activa la verificación en dos pasos. El correo solo se lee: no se marca como leído ni se modifica.
          </p>
        </form>
      )}

      {lectura && (
        <div className="mt-5 border-t border-gray-100 pt-4 text-sm">
          {leyendo && (
            <div className="flex items-center gap-2 text-gray-600" role="status">
              <Loader2 size={16} className="animate-spin text-primary-600" />
              Revisando correos: {lectura.revisados} de {lectura.total}. Compras nuevas: {lectura.importadas}.
            </div>
          )}

          {lectura.estado === 'ERROR' && (
            <div className="flex items-start gap-2 text-red-700">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {lectura.error}
            </div>
          )}

          {lectura.estado === 'TERMINADA' && (
            <div className="flex items-start gap-2 text-gray-700">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-600" />
              <span>
                Última lectura: {lectura.total} correos revisados. {lectura.importadas} compras nuevas, {lectura.duplicadas} ya registradas, {lectura.ignoradas} documentos ignorados y {lectura.porRevisar} por revisar.
              </span>
            </div>
          )}

          {!leyendo && detalle.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-primary-700 font-semibold">Ver ignorados y por revisar</summary>
              <ul className="mt-2 divide-y divide-gray-100">
                {detalle.map((d, i) => (
                  <li key={i} className="py-2">
                    <div className="font-medium text-gray-800 break-words">{d.documento || d.asunto}</div>
                    <div className="text-xs text-gray-500">{d.proveedor ? `${d.proveedor}. ` : ''}{d.motivo}</div>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

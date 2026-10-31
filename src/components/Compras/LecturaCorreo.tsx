// src/components/Compras/LecturaCorreo.tsx
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { iniciarLecturaCorreo, obtenerConexionCorreo, obtenerLecturaCorreo } from '../../services/compra.service';

type Periodo = 'TODO' | 'MES' | 'DIA';

const OPCIONES: { periodo: Periodo; texto: string }[] = [
  { periodo: 'DIA', texto: 'Leer hoy' },
  { periodo: 'MES', texto: 'Leer este mes' },
  { periodo: 'TODO', texto: 'Leer toda la bandeja' }
];

// Solo aparece si el correo ya se conectó en Configuración.
export const LecturaCorreo: React.FC<{ alTerminar: () => void }> = ({ alTerminar }) => {
  const [estado, setEstado] = useState<any>(null);
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

  useEffect(() => {
    obtenerConexionCorreo()
      .then((res) => {
        setEstado(res);
        setLectura(res.ultima);
        if (res.conectado && res.ultima?.estado === 'EN_PROCESO') seguirLectura(res.ultima.id);
      })
      .catch((err) => console.error('Error al consultar la conexión de correo:', err));
    return () => window.clearTimeout(temporizador.current);
  }, []);

  const leer = async (periodo: Periodo) => {
    setError(null);
    try {
      const res = await iniciarLecturaCorreo(periodo);
      setLectura(res.importacion);
      seguirLectura(res.importacion.id);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'No se pudo iniciar la lectura');
    }
  };

  if (!estado?.conectado) return null;

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
        </div>
      </div>

      {error && <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm text-red-700">{error}</div>}

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

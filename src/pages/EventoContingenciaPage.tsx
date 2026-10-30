// src/pages/EventoContingenciaPage.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Send, Upload } from 'lucide-react';
import { Toast } from '../components/Common/Toast';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { enviarEventoContingencia, obtenerEstadoContingencia, transmitirContingencia } from '../services/dte.service';
import { CATALOGOS } from '../utils/catalogs';
import { mensajeError } from '../utils/errores';
import { ahoraEnElSalvador, guardarModoContingencia, leerModoContingencia } from '../utils/contingencia';

const TIPOS_DOC = [
  { codigo: '36', nombre: 'NIT' },
  { codigo: '13', nombre: 'DUI' },
  { codigo: '03', nombre: 'Pasaporte' },
  { codigo: '02', nombre: 'Carnet de Residente' },
  { codigo: '37', nombre: 'Otro' }
];
const ESTABLECIMIENTOS = [
  { codigo: '02', nombre: 'Casa Matriz' },
  { codigo: '01', nombre: 'Sucursal' },
  { codigo: '04', nombre: 'Bodega' },
  { codigo: '07', nombre: 'Patio' }
];

export const EventoContingenciaPage: React.FC = () => {
  const [modo, setModo] = useState(leerModoContingencia());
  const [tipo, setTipo] = useState(1);
  const [motivo, setMotivo] = useState('');
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);
  const [toast, setToast] = useState<any>(null);
  const [evento, setEvento] = useState({
    fFin: '', hFin: '', nombreResponsable: '', tipoDocResponsable: '36', numeroDocResponsable: '', tipoEstablecimiento: '02'
  });

  const refrescar = useCallback(async () => {
    try {
      const r = await obtenerEstadoContingencia();
      setDocumentos(r.documentos || []);
      setEventos(r.eventos || []);
    } catch (error: any) {
      setToast({ type: 'error', message: mensajeError(error) });
    }
  }, []);

  useEffect(() => { refrescar(); }, [refrescar]);

  const iniciar = () => {
    const { fecha, hora } = ahoraEnElSalvador();
    const nuevo = { tipoContingencia: tipo, motivoContin: motivo.trim() || null, fInicio: fecha, hInicio: hora };
    guardarModoContingencia(nuevo);
    setModo(nuevo);
  };

  const finalizar = () => {
    const { fecha, hora } = ahoraEnElSalvador();
    setEvento({ ...evento, fFin: fecha, hFin: hora });
    setTipo(modo?.tipoContingencia || 1);
    setMotivo(modo?.motivoContin || '');
  };

  const enviarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modo) return;
    setCargando(true);
    try {
      const r = await enviarEventoContingencia({
        ...evento,
        fInicio: modo.fInicio,
        hInicio: modo.hInicio,
        tipoContingencia: modo.tipoContingencia,
        motivoContingencia: modo.motivoContin
      });
      if (r.success) {
        guardarModoContingencia(null);
        setModo(null);
        setToast({ type: 'success', message: `Evento recibido. Documentos informados: ${r.documentosInformados}` });
      } else {
        setToast({ type: 'error', message: r.error || 'Hacienda rechazó el evento' });
      }
      await refrescar();
    } catch (error: any) {
      setToast({ type: 'error', message: mensajeError(error) });
    } finally {
      setCargando(false);
    }
  };

  const transmitir = async () => {
    setCargando(true);
    try {
      const r = await transmitirContingencia();
      setResultados(r.resultados || []);
      setToast({ type: 'success', message: r.pendientes > 0 ? `Faltan ${r.pendientes} documentos: vuelva a transmitir.` : 'Transmisión terminada.' });
      await refrescar();
    } catch (error: any) {
      setToast({ type: 'error', message: mensajeError(error) });
    } finally {
      setCargando(false);
    }
  };

  const transitorios = documentos.filter(d => d.estado === 'CONTINGENCIA');
  const informados = documentos.filter(d => d.estado === 'INFORMADO_MH');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contingencia</h1>
        <p className="text-gray-600">Para seguir emitiendo cuando no es posible transmitir a Hacienda.</p>
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">1. Emitir en contingencia</h2>
        {!modo ? (
          <>
            <div>
              <label className="label">Tipo de contingencia *</label>
              <select className="input" value={tipo} onChange={e => setTipo(Number(e.target.value))}>
                {CATALOGOS.tipoContingencia.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Motivo{tipo === 5 ? ' *' : ''}</label>
              <textarea className="input" maxLength={500} value={motivo} onChange={e => setMotivo(e.target.value)} />
            </div>
            <button type="button" onClick={iniciar} disabled={tipo === 5 && !motivo.trim()} className="btn-primary disabled:opacity-50">
              Iniciar contingencia en este navegador
            </button>
          </>
        ) : (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
            <AlertTriangle size="20" className="shrink-0" />
            <p>Contingencia activa desde {modo.fInicio} {modo.hInicio}. Los documentos que emita en este navegador se firman y quedan pendientes de transmitir. Entregue al cliente su PDF y JSON. Quedan {transitorios.length} sin informar.</p>
          </div>
        )}
      </div>

      {modo && (
        <form onSubmit={enviarEvento} className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">2. Informar a Hacienda al superar la falla</h2>
          <p className="text-sm text-gray-600">Plazo: 24 horas desde que terminó la falla.</p>
          <button type="button" onClick={finalizar} className="btn-secondary">Marcar el fin de la contingencia ahora</button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha de fin *</label>
              <input type="date" className="input" value={evento.fFin} onChange={e => setEvento({ ...evento, fFin: e.target.value })} required />
            </div>
            <div>
              <label className="label">Hora de fin *</label>
              <input type="time" step="1" className="input" value={evento.hFin} onChange={e => setEvento({ ...evento, hFin: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <label className="label">Responsable del establecimiento *</label>
              <input className="input" maxLength={100} value={evento.nombreResponsable} onChange={e => setEvento({ ...evento, nombreResponsable: e.target.value })} required />
            </div>
            <div>
              <label className="label">Tipo de documento *</label>
              <select className="input" value={evento.tipoDocResponsable} onChange={e => setEvento({ ...evento, tipoDocResponsable: e.target.value })}>
                {TIPOS_DOC.map(t => <option key={t.codigo} value={t.codigo}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Número de documento *</label>
              <input className="input" maxLength={25} value={evento.numeroDocResponsable} onChange={e => setEvento({ ...evento, numeroDocResponsable: e.target.value })} required />
            </div>
            <div>
              <label className="label">Tipo de establecimiento *</label>
              <select className="input" value={evento.tipoEstablecimiento} onChange={e => setEvento({ ...evento, tipoEstablecimiento: e.target.value })}>
                {ESTABLECIMIENTOS.map(t => <option key={t.codigo} value={t.codigo}>{t.nombre}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={cargando || transitorios.length === 0} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {cargando ? <LoadingSpinner /> : <Send size="18" />} Enviar evento de contingencia
          </button>
        </form>
      )}

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">3. Transmitir los documentos informados</h2>
        <p className="text-sm text-gray-600">Plazo: 72 horas desde el sello del evento. Documentos listos: {informados.length}.</p>
        <button type="button" onClick={transmitir} disabled={cargando || informados.length === 0} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          {cargando ? <LoadingSpinner /> : <Upload size="18" />} Transmitir a Hacienda
        </button>
        {resultados.length > 0 && (
          <ul className="text-sm divide-y divide-gray-100">
            {resultados.map(r => (
              <li key={r.codigoGeneracion} className="py-2">
                <span className="font-mono text-xs">{r.numeroControl}</span> <strong>{r.estado}</strong>{r.mensaje ? `: ${r.mensaje}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>

      {eventos.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Eventos recientes</h2>
          <ul className="text-sm divide-y divide-gray-100">
            {eventos.map(ev => (
              <li key={ev.codigo_generacion} className="py-2">
                <span className="font-mono text-xs">{ev.codigo_generacion}</span> <strong>{ev.estado}</strong>
                {ev.sello_recepcion_mh ? <span className="block font-mono text-xs text-gray-500">{ev.sello_recepcion_mh}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

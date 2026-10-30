// src/pages/EventoInvalidacionPage.tsx
import React, { useState } from 'react';
import { Search, Send } from 'lucide-react';
import { Toast } from '../components/Common/Toast';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { enviarEventoInvalidacion, obtenerDteInfo } from '../services/dte.service';
import { mensajeError } from '../utils/errores';

const MOTIVOS = [
  { codigo: 1, nombre: 'Error en la información del documento' },
  { codigo: 2, nombre: 'Rescindir de la operación realizada' },
  { codigo: 3, nombre: 'Otro' }
];
const TIPOS_DOC = [
  { codigo: '36', nombre: 'NIT' },
  { codigo: '13', nombre: 'DUI' },
  { codigo: '03', nombre: 'Pasaporte' },
  { codigo: '02', nombre: 'Carnet de Residente' },
  { codigo: '37', nombre: 'Otro' }
];
// La nota de crédito y el comprobante de liquidación no llevan documento de reemplazo.
const SIN_REEMPLAZO = ['05', '08'];

const motivoInicial = {
  tipoAnulacion: 2,
  motivoAnulacion: '',
  codigoGeneracionR: '',
  nombreResponsable: '',
  tipDocResponsable: '36',
  numDocResponsable: '',
  nombreSolicita: '',
  tipDocSolicita: '36',
  numDocSolicita: ''
};

export const EventoInvalidacionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const [codigo, setCodigo] = useState('');
  const [dte, setDte] = useState<any>(null);
  const [motivo, setMotivo] = useState(motivoInicial);
  const [resultado, setResultado] = useState<any>(null);

  const cambiar = (campo: string, valor: any) => setMotivo({ ...motivo, [campo]: valor });
  const requiereReemplazo = motivo.tipoAnulacion !== 2 && dte && !SIN_REEMPLAZO.includes(dte.tipoDte);

  const buscar = async () => {
    setBuscando(true);
    setDte(null);
    setResultado(null);
    try {
      const respuesta = await obtenerDteInfo(codigo.trim());
      if (respuesta.dte?.estado !== 'PROCESADO') {
        setToast({ type: 'error', message: `Solo se puede invalidar un documento procesado. Estado: ${respuesta.dte?.estado}` });
      } else {
        setDte(respuesta.dte);
      }
    } catch (error: any) {
      setToast({ type: 'error', message: mensajeError(error) });
    } finally {
      setBuscando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm(`¿Invalidar el documento ${dte.numeroControl}? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    try {
      const respuesta = await enviarEventoInvalidacion({
        ...motivo,
        codigoGeneracion: codigo.trim(),
        codigoGeneracionR: requiereReemplazo ? motivo.codigoGeneracionR.trim() : null
      });
      if (respuesta.success) {
        setResultado(respuesta);
        setDte(null);
        setCodigo('');
        setMotivo(motivoInicial);
        setToast({ type: 'success', message: 'Documento invalidado.' });
      } else {
        setToast({ type: 'error', message: respuesta.error || 'Hacienda rechazó el evento' });
      }
    } catch (error: any) {
      setToast({ type: 'error', message: mensajeError(error) });
    } finally {
      setLoading(false);
    }
  };

  const persona = (titulo: string, nombre: string, tipo: string, numero: string) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">{titulo}</h3>
      <div>
        <label className="label">Nombre *</label>
        <input className="input" value={(motivo as any)[nombre]} onChange={e => cambiar(nombre, e.target.value)} required maxLength={100} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tipo de documento *</label>
          <select className="input" value={(motivo as any)[tipo]} onChange={e => cambiar(tipo, e.target.value)}>
            {TIPOS_DOC.map(t => <option key={t.codigo} value={t.codigo}>{t.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Número *</label>
          <input className="input" value={(motivo as any)[numero]} onChange={e => cambiar(numero, e.target.value)} required maxLength={20} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Evento de Invalidación</h1>
        <p className="text-gray-600">El documento no se borra: queda con estado invalidado ante Hacienda.</p>
      </div>

      <div className="card mb-6">
        <label className="label">Código de generación del documento a invalidar</label>
        <div className="flex gap-2">
          <input className="input flex-1 font-mono uppercase" value={codigo} onChange={e => { setCodigo(e.target.value); setDte(null); }} />
          <button type="button" onClick={buscar} disabled={buscando || !codigo.trim()} className="btn-secondary flex items-center gap-2 disabled:opacity-50">
            {buscando ? <LoadingSpinner /> : <Search size="16" />} Buscar
          </button>
        </div>
        {dte && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
            <p><strong>Número de control:</strong> <span className="font-mono text-xs">{dte.numeroControl}</span></p>
            <p><strong>Fecha de emisión:</strong> {dte.fechaEmision}</p>
            <p><strong>Receptor:</strong> {dte.receptor?.nombre || 'Consumidor final'}</p>
            <p><strong>Total:</strong> ${Number(dte.montoTotal).toFixed(2)}</p>
          </div>
        )}
      </div>

      {dte && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Motivo</h2>
            <div>
              <label className="label">Motivo de la invalidación *</label>
              <select className="input" value={motivo.tipoAnulacion} onChange={e => cambiar('tipoAnulacion', Number(e.target.value))}>
                {MOTIVOS.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre}</option>)}
              </select>
            </div>
            {requiereReemplazo && (
              <div>
                <label className="label">Código de generación del documento que lo reemplaza *</label>
                <input className="input font-mono uppercase" value={motivo.codigoGeneracionR} onChange={e => cambiar('codigoGeneracionR', e.target.value)} required />
                <p className="text-xs text-gray-500 mt-1">Primero emita el documento correcto y espere su sello de Hacienda.</p>
              </div>
            )}
            <div>
              <label className="label">Descripción{motivo.tipoAnulacion === 3 ? ' *' : ''}</label>
              <textarea className="input" maxLength={200} value={motivo.motivoAnulacion} onChange={e => cambiar('motivoAnulacion', e.target.value)} required={motivo.tipoAnulacion === 3} />
            </div>
          </div>

          <div className="card grid grid-cols-1 md:grid-cols-2 gap-6">
            {persona('Responsable de la invalidación', 'nombreResponsable', 'tipDocResponsable', 'numDocResponsable')}
            {persona('Quien solicita la invalidación', 'nombreSolicita', 'tipDocSolicita', 'numDocSolicita')}
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {loading ? <LoadingSpinner /> : <Send size="18" />} Invalidar documento
            </button>
          </div>
        </form>
      )}

      {resultado && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-sm space-y-1">
          <h3 className="font-semibold text-green-800">Evento recibido por Hacienda</h3>
          <p><strong>Código del evento:</strong> <span className="font-mono text-xs">{resultado.codigoGeneracion}</span></p>
          <p><strong>Sello de recepción:</strong> <span className="font-mono text-xs">{resultado.selloRecibido}</span></p>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

// src/pages/EventoInvalidacionPage.tsx
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Toast } from '../components/Common/Toast';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { enviarEventoInvalidacion } from '../services/dte.service';
import { CATALOGOS } from '../utils/catalogs';

export const EventoInvalidacionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<any>(null);
  
  const [identificacionDocumento, setIdentificacionDocumento] = useState({
    tipoDocumento: '01', tipoGeneracion: 2, codigoGeneracion: '', selloRecibido: '',
    numeroControl: '', fecha: '', nitReceptor: '', nombreReceptor: '', documentoReemplazo: ''
  });
  
  const [motivo, setMotivo] = useState({
    tipoInvalidacion: '1', motivoInvalidacion: '', nombreResponsable: '', 
    tipoDocResponsable: '36', numDocResponsable: '', nombreSolicita: '', 
    tipoDocSolicita: '36', numDocSolicita: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await enviarEventoInvalidacion({ identificacionDocumento, motivo });
      if (response.success) setToast({ type: 'success', message: `Evento enviado. Código: ${response.codigoGeneracion}` });
      else setToast({ type: 'error', message: response.error });
    } catch (error: any) {
      setToast({ type: 'error', message: error.message });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Evento de Invalidación</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Documento a Invalidar</h2>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="label">Tipo DTE</label>
               <select className="input" value={identificacionDocumento.tipoDocumento} onChange={e => setIdentificacionDocumento({...identificacionDocumento, tipoDocumento: e.target.value})}>
                 {CATALOGOS.tipoDocumento.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
               </select>
             </div>
             <div>
               <label className="label">Código Generación</label>
               <input className="input" value={identificacionDocumento.codigoGeneracion} onChange={e => setIdentificacionDocumento({...identificacionDocumento, codigoGeneracion: e.target.value})} required/>
             </div>
             <div>
               <label className="label">Sello Recibido</label>
               <input className="input" value={identificacionDocumento.selloRecibido} onChange={e => setIdentificacionDocumento({...identificacionDocumento, selloRecibido: e.target.value})} required/>
             </div>
             <div>
               <label className="label">NIT Receptor</label>
               <input className="input" value={identificacionDocumento.nitReceptor} onChange={e => setIdentificacionDocumento({...identificacionDocumento, nitReceptor: e.target.value})} required/>
             </div>
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Motivo de Invalidación</h2>
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
               <label className="label">Motivo</label>
               <textarea className="input" value={motivo.motivoInvalidacion} onChange={e => setMotivo({...motivo, motivoInvalidacion: e.target.value})} required/>
             </div>
             <div>
               <label className="label">Nombre Responsable</label>
               <input className="input" value={motivo.nombreResponsable} onChange={e => setMotivo({...motivo, nombreResponsable: e.target.value})} required/>
             </div>
             <div>
               <label className="label">DUI/NIT Responsable</label>
               <input className="input" value={motivo.numDocResponsable} onChange={e => setMotivo({...motivo, numDocResponsable: e.target.value})} required/>
             </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">{loading ? <LoadingSpinner/> : 'Enviar Evento'}</button>
      </form>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

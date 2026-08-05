// src/pages/EventoContingenciaPage.tsx
import React, { useState } from 'react';
import { Send, Plus, Trash2 } from 'lucide-react';
import { Toast } from '../components/Common/Toast';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { enviarEventoContingencia } from '../services/dte.service';
import { CATALOGOS } from '../utils/catalogs';

export const EventoContingenciaPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<any>(null);
  
  const [contingencia, setContingencia] = useState({
    fechaInicio: '', fechaFin: '', tipoContingencia: '1', motivoContingencia: '',
    documentos: [{ tipoDte: '01', codigoGeneracion: '', fechaGeneracion: '', horaGeneracion: '' }]
  });

  const addDoc = () => {
    setContingencia({...contingencia, documentos: [...contingencia.documentos, { tipoDte: '01', codigoGeneracion: '', fechaGeneracion: '', horaGeneracion: '' }]});
  };

  const updateDoc = (index: number, field: string, value: string) => {
    const newDocs = [...contingencia.documentos];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setContingencia({...contingencia, documentos: newDocs});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await enviarEventoContingencia({ contingencia });
      if (response.success) setToast({ type: 'success', message: 'Evento de contingencia reportado.' });
      else setToast({ type: 'error', message: response.error });
    } catch (error: any) {
      setToast({ type: 'error', message: error.message });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Evento de Contingencia</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Detalles de Contingencia</h2>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="label">Tipo Contingencia</label>
               <select className="input" value={contingencia.tipoContingencia} onChange={e => setContingencia({...contingencia, tipoContingencia: e.target.value})}>
                 {CATALOGOS.tipoContingencia.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
               </select>
             </div>
             <div>
               <label className="label">Motivo</label>
               <input className="input" value={contingencia.motivoContingencia} onChange={e => setContingencia({...contingencia, motivoContingencia: e.target.value})} required/>
             </div>
             <div>
               <label className="label">Fecha Inicio</label>
               <input type="date" className="input" value={contingencia.fechaInicio} onChange={e => setContingencia({...contingencia, fechaInicio: e.target.value})} required/>
             </div>
             <div>
               <label className="label">Fecha Fin</label>
               <input type="date" className="input" value={contingencia.fechaFin} onChange={e => setContingencia({...contingencia, fechaFin: e.target.value})} required/>
             </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">DTEs en Contingencia</h2>
            <button type="button" onClick={addDoc} className="text-primary-600"><Plus size="16"/> Agregar</button>
          </div>
          {contingencia.documentos.map((doc, idx) => (
             <div key={idx} className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded">
               <input className="input" placeholder="Tipo DTE (ej. 01)" value={doc.tipoDte} onChange={e => updateDoc(idx, 'tipoDte', e.target.value)} required />
               <input className="input col-span-2" placeholder="Código Generación" value={doc.codigoGeneracion} onChange={e => updateDoc(idx, 'codigoGeneracion', e.target.value)} required />
               <input type="date" className="input" value={doc.fechaGeneracion} onChange={e => updateDoc(idx, 'fechaGeneracion', e.target.value)} required />
             </div>
          ))}
        </div>

        <button type="submit" disabled={loading} className="btn-primary">{loading ? <LoadingSpinner/> : 'Enviar Contingencia'}</button>
      </form>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

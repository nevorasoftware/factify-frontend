// src/pages/ConsultaPage.tsx
import React, { useState } from 'react';
import { Search, Copy, CheckCircle, XCircle } from 'lucide-react';
import { consultarDTE } from '../services/consulta.service';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { Toast } from '../components/Common/Toast';
import { CATALOGOS } from '../utils/catalogs';
import { formatDateTime } from '../utils/formatters';

export const ConsultaPage: React.FC = () => {
  const [tipoDte, setTipoDte] = useState('01');
  const [codigoGeneracion, setCodigoGeneracion] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoGeneracion) {
      setToast({ type: 'error', message: 'Ingrese el código de generación' });
      return;
    }

    setLoading(true);
    try {
      const response = await consultarDTE(tipoDte, codigoGeneracion);
      if (response.success) {
        setResultado(response.resultado);
      } else {
        setToast({ type: 'error', message: response.error || 'No se encontró el documento' });
      }
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PROCESADO': return 'text-green-600 bg-green-50';
      case 'RECHAZADO': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Consulta de DTE</h1>
        <p className="text-gray-600">Consulte el estado de un Documento Tributario Electrónico</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Tipo de Documento</label>
              <select
                className="input"
                value={tipoDte}
                onChange={(e) => setTipoDte(e.target.value)}
              >
                {CATALOGOS.tipoDocumento.map(td => (
                  <option key={td.code} value={td.code}>{td.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Código de Generación</label>
              <input
                type="text"
                className="input font-mono"
                placeholder="Ej: A22E45B9-DBB4-ABCD-A1E3-7D92C12B4FE5"
                value={codigoGeneracion}
                onChange={(e) => setCodigoGeneracion(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner /> : <Search size="18" />}
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
        </form>

        {resultado && (
          <div className="mt-6 border-t pt-6">
            <h3 className="font-semibold text-gray-800 mb-4">Resultado de la Consulta</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Código de Generación:</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono">{resultado.codigoGeneracion}</code>
                  <button onClick={() => copyToClipboard(resultado.codigoGeneracion)} className="text-gray-400 hover:text-gray-600">
                    {copied ? <CheckCircle size="16" className="text-green-500" /> : <Copy size="16" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Sello de Recepción:</span>
                <code className="text-sm font-mono">{resultado.selloRecibido}</code>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Fecha de Procesamiento:</span>
                <span>{resultado.fhProcesamiento}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Estado:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(resultado.estado)}`}>
                  {resultado.estado}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Mensaje:</span>
                <span>{resultado.descripcionMsg}</span>
              </div>
              {resultado.observaciones?.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800 font-medium">Observaciones:</p>
                  <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
                    {resultado.observaciones.map((obs: string, idx: number) => (
                      <li key={idx}>{obs}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

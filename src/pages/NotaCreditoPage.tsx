// src/pages/NotaCreditoPage.tsx
import React, { useState } from 'react';
import { Send, RefreshCw, Plus, Trash2, Search } from 'lucide-react';
import { ReceptorForm } from '../components/Forms/ReceptorForm';
import { ItemsTable } from '../components/Forms/ItemsTable';
import { Toast } from '../components/Common/Toast';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { enviarNotaCredito, obtenerDteInfo } from '../services/dte.service';
import { Receptor, Item, DocumentoRelacionado } from '../types';
import { formatCurrency, numeroALetras } from '../utils/formatters';

const initialReceptor: Receptor = {
  nit: '',
  nrc: '',
  nombre: '',
  codActividad: null,
  descActividad: null,
  direccion: { departamento: '06', municipio: '14', complemento: '' },
  telefono: '',
  correo: ''
};

export const NotaCreditoPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [receptor, setReceptor] = useState<Receptor>(initialReceptor);
  const [documentosRelacionados, setDocumentosRelacionados] = useState<DocumentoRelacionado[]>([{
    tipoDocumento: '03',
    tipoGeneracion: 2,
    numeroDocumento: '',
    fechaEmision: new Date().toISOString().split('T')[0]
  }]);
  const [items, setItems] = useState<Item[]>([{
    numItem: 1, tipoItem: 1, cantidad: 1, codigo: null,
    uniMedida: 59, descripcion: '', precioUni: 0, montoDescu: 0, ventaGravada: 0
  }]);
  const [resultado, setResultado] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchingDte, setSearchingDte] = useState(false);
  const [dteCargado, setDteCargado] = useState<any>(null);

  const subtotal = items.reduce((sum, item) => sum + item.ventaGravada, 0);
  const iva = subtotal * 0.13;
  const total = subtotal + iva;

  const handleSearchDte = async (idx: number) => {
    const uuid = documentosRelacionados[idx].numeroDocumento.trim();
    if (!uuid) {
      setToast({ type: 'error', message: 'Por favor, ingrese el Código de Generación (UUID) del documento original.' });
      return;
    }
    
    setSearchingDte(true);
    setDteCargado(null);
    try {
      const response = await obtenerDteInfo(uuid);
      if (response.success && response.dte) {
        const doc = response.dte;
        
        if (doc.tipoDte !== '03') {
          setToast({ type: 'error', message: `El documento encontrado es de tipo ${doc.tipoDte}, pero este formulario requiere relacionar un Crédito Fiscal (03).` });
          setSearchingDte(false);
          return;
        }

        setDteCargado(doc);
        setToast({ type: 'success', message: '¡Crédito Fiscal encontrado y vinculado exitosamente!' });
        
        // Auto-completar fecha de emisión real
        updateDocumentoRelacionado(idx, 'fechaEmision', doc.fechaEmision);
        
        // Auto-completar receptor
        if (doc.cliente) {
          setReceptor({
            nit: doc.cliente.numDocumento.length === 14 ? doc.cliente.numDocumento : '',
            nrc: '',
            nombre: doc.cliente.nombre,
            codActividad: null,
            descActividad: null,
            direccion: { departamento: '06', municipio: '14', complemento: '' },
            telefono: '',
            correo: doc.cliente.correo || ''
          });
        }
      } else {
        setToast({ type: 'error', message: 'No se encontró el documento en la base de datos.' });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Error de conexión al buscar el documento.';
      setToast({ type: 'error', message: errorMsg });
    } finally {
      setSearchingDte(false);
    }
  };

  const addDocumentoRelacionado = () => {
    setDocumentosRelacionados([...documentosRelacionados, {
      tipoDocumento: '03',
      tipoGeneracion: 2,
      numeroDocumento: '',
      fechaEmision: new Date().toISOString().split('T')[0]
    }]);
  };

  const removeDocumentoRelacionado = (index: number) => {
    setDocumentosRelacionados(documentosRelacionados.filter((_, i) => i !== index));
  };

  const updateDocumentoRelacionado = (index: number, field: keyof DocumentoRelacionado, value: any) => {
    const newDocs = [...documentosRelacionados];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setDocumentosRelacionados(newDocs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      receptor,
      documentoRelacionado: documentosRelacionados,
      cuerpoDocumento: items,
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: subtotal,
        subTotalVentas: subtotal,
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: 0,
        totalDescu: 0,
        subTotal: subtotal,
        ivaRete1: 0,
        reteRenta: 0,
        montoTotalOperacion: total,
        totalPagar: total,
        totalLetras: `${Math.floor(total)} ${((total % 1) * 100).toFixed(0)}/100 DOLARES USD`,
        condicionOperacion: 1,
        pagos: null
      }
    };

    try {
      const response = await enviarNotaCredito(data);
      if (response.success) {
        setToast({ type: 'success', message: `Nota de Crédito enviada. Código: ${response.codigoGeneracion}` });
        setResultado(response);
        limpiarFormulario();
      } else {
        setToast({ type: 'error', message: response.error || 'Error al enviar Nota de Crédito' });
      }
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setReceptor(initialReceptor);
    setDocumentosRelacionados([{ tipoDocumento: '03', tipoGeneracion: 2, numeroDocumento: '', fechaEmision: new Date().toISOString().split('T')[0] }]);
    setItems([{ numItem: 1, tipoItem: 1, cantidad: 1, codigo: null, uniMedida: 59, descripcion: '', precioUni: 0, montoDescu: 0, ventaGravada: 0 }]);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nota de Crédito Electrónica</h1>
        <p className="text-gray-600">Complete los datos para emitir una Nota de Crédito</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Documentos Relacionados</h2>
            <button type="button" onClick={addDocumentoRelacionado} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              <Plus size="16" /> Agregar Documento
            </button>
          </div>
          <div className="space-y-4">
            {documentosRelacionados.map((doc, idx) => (
              <div key={idx} className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg">
                <div className="flex-1">
                  <label className="label">Tipo Documento</label>
                  <input type="text" className="input bg-gray-100 cursor-not-allowed" value="CCF (03)" disabled readOnly />
                </div>
                <div className="flex-1">
                  <label className="label">Tipo Generación</label>
                  <select className="input" value={doc.tipoGeneracion} onChange={(e) => updateDocumentoRelacionado(idx, 'tipoGeneracion', parseInt(e.target.value))}>
                    <option value={1}>Físico</option>
                    <option value={2}>Electrónico</option>
                  </select>
                </div>
                <div className="flex-2">
                  <label className="label">Número Documento / Código Generación</label>
                  <div className="flex gap-2">
                    <input type="text" className="input flex-1" value={doc.numeroDocumento} onChange={(e) => updateDocumentoRelacionado(idx, 'numeroDocumento', e.target.value)} required placeholder="UUID del CCF original" />
                    <button type="button" onClick={() => handleSearchDte(idx)} className="btn-secondary px-3 flex items-center justify-center gap-1 text-sm font-medium whitespace-nowrap bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors" disabled={searchingDte}>
                      {searchingDte ? <LoadingSpinner /> : <Search size="16" />} Buscar
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="label">Fecha Emisión</label>
                  <input type="date" className="input bg-gray-100 cursor-not-allowed" value={doc.fechaEmision} readOnly disabled required />
                </div>
                {documentosRelacionados.length > 1 && (
                  <button type="button" onClick={() => removeDocumentoRelacionado(idx)} className="text-red-600 hover:text-red-800 pb-2">
                    <Trash2 size="20" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {dteCargado && (
            <div className="mt-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                    <span>📄 Documento Vinculado</span>
                  </h4>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                    Crédito Fiscal (DTE 03)
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                    Sello Recibido
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-blue-800">
                  <p><strong>N° de Control:</strong> <span className="font-mono text-xs">{dteCargado.numeroControl}</span></p>
                  <p><strong>Fecha de Emisión Original:</strong> {dteCargado.fechaEmision}</p>
                  <p><strong>Cliente Receptor:</strong> {dteCargado.cliente?.nombre || 'Contribuyente Autorizado'}</p>
                  <p><strong>Estado en Hacienda:</strong> <span className="text-emerald-700 font-semibold">{dteCargado.estado}</span></p>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm border border-blue-100 text-blue-900 rounded-xl px-5 py-3 text-right self-stretch md:self-auto flex flex-col justify-center shadow-xs">
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wider block">Total Documento</span>
                <span className="text-2xl font-black text-indigo-900">${dteCargado.montoTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Datos del Receptor</h2>
          <ReceptorForm receptor={receptor} onChange={setReceptor} />
        </div>

        <div className="card">
          <ItemsTable items={items} onChange={setItems} />
        </div>

        {/* RESUMEN PANEL */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 mt-4">
          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-semibold text-indigo-200 uppercase tracking-widest">Resumen de Nota de Crédito</h3>
            <div className="text-2xl font-black text-white">{numeroALetras(total)}</div>
            <p className="text-xs text-indigo-300">
              Subtotal: <strong>${formatCurrency(subtotal)}</strong> | IVA (13%): <strong>${formatCurrency(iva)}</strong>
            </p>
          </div>
          <div className="flex gap-4 self-center md:self-auto border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
            <div className="text-right">
              <span className="text-xs text-indigo-200 font-medium block">Total Nota Crédito</span>
              <span className="text-4xl font-extrabold text-emerald-400 font-mono">${formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={limpiarFormulario} className="btn-secondary flex items-center gap-2">
            <RefreshCw size="18" /> Limpiar
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {loading ? <LoadingSpinner /> : <Send size="18" />}
            {loading ? 'Enviando...' : 'Enviar Nota de Crédito'}
          </button>
        </div>
      </form>

      {resultado?.resultado && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Resultado del Envío</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Código de Generación:</strong> {resultado.codigoGeneracion}</p>
            <p><strong>Sello de Recepción:</strong> {resultado.resultado.selloRecibido}</p>
            <p><strong>Estado:</strong> <span className="text-green-600">{resultado.resultado.estado}</span></p>
          </div>
        </div>
      )}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

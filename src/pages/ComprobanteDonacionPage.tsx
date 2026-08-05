// src/pages/ComprobanteDonacionPage.tsx
import React, { useState } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { ReceptorForm } from '../components/Forms/ReceptorForm';
import { ItemsTable } from '../components/Forms/ItemsTable';
import { Toast } from '../components/Common/Toast';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { enviarComprobanteDonacion } from '../services/dte.service';
import { Receptor, Item, Pago } from '../types';
import { CATALOGOS } from '../utils/catalogs';
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

export const ComprobanteDonacionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [receptor, setReceptor] = useState<Receptor>(initialReceptor);
  const [items, setItems] = useState<Item[]>([{
    numItem: 1, tipoItem: 1, cantidad: 1, codigo: null, uniMedida: 99, descripcion: '', precioUni: 0, montoDescu: 0, ventaGravada: 0
  }]);
  const [condicionOperacion, setCondicionOperacion] = useState(1);
  const [pagos, setPagos] = useState<Pago[]>([{
    codigo: '01', montoPago: 0, referencia: 'Donacion Voluntaria', plazo: null, periodo: null
  }]);
  const [resultado, setResultado] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.ventaGravada, 0);
  const total = subtotal; // No hay IVA en donaciones

  const handlePagoChange = (index: number, field: keyof Pago, value: any) => {
    const newPagos = [...pagos];
    newPagos[index] = { ...newPagos[index], [field]: value };
    setPagos(newPagos);
  };

  const addPago = () => {
    setPagos([
      ...pagos,
      { codigo: '01', montoPago: 0, referencia: 'Donacion Voluntaria', plazo: null, periodo: null }
    ]);
  };

  const removePago = (index: number) => {
    setPagos(pagos.filter((_, i) => i !== index));
  };

  const limpiarFormulario = () => {
    setReceptor(initialReceptor);
    setItems([{
      numItem: 1, tipoItem: 1, cantidad: 1, codigo: null, uniMedida: 99, descripcion: '', precioUni: 0, montoDescu: 0, ventaGravada: 0
    }]);
    setCondicionOperacion(1);
    setPagos([{ codigo: '01', montoPago: 0, referencia: 'Donacion Voluntaria', plazo: null, periodo: null }]);
    setResultado(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const pagosConMonto = pagos.map(p => ({
      ...p,
      montoPago: total,
      referencia: p.referencia || 'Donacion Voluntaria'
    }));

    const data = {
      receptor: { ...receptor, tipoDocumento: '36', numDocumento: receptor.nit, domicilioFiscal: '1' },
      cuerpoDocumento: items.map(i => ({
        numItem: i.numItem,
        tipoDonacion: 1,
        cantidad: i.cantidad,
        uniMedida: i.uniMedida ? Number(i.uniMedida) : 99,
        codigo: i.codigo || `DON-${i.numItem}`,
        descripcion: i.descripcion,
        valorUni: i.precioUni,
        depreciacion: 0
      })),
      resumen: {
        valorTotal: total,
        totalLetras: `${numeroALetras(total)}`,
        pagos: pagosConMonto,
        condicionOperacion
      }
    };

    try {
      const response = await enviarComprobanteDonacion(data);
      if (response.success) {
        setToast({ type: 'success', message: `Comprobante de Donación enviado exitosamente. Código: ${response.codigoGeneracion}` });
        setResultado(response);
        limpiarFormulario();
      } else {
        setToast({ type: 'error', message: response.error || 'Error al enviar comprobante de donación' });
      }
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comprobante de Donación</h1>
        <p className="text-gray-600">Complete los datos para emitir un comprobante de donación electrónica (DTE 15)</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Datos del Donante</h2>
          <ReceptorForm receptor={receptor} onChange={setReceptor} />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Detalle de la Donación</h2>
          <ItemsTable items={items} onChange={setItems} />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen y Formas de Pago</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div>
              <label className="label">Condición de la Operación</label>
              <select
                className="input w-48"
                value={condicionOperacion}
                onChange={(e) => setCondicionOperacion(parseInt(e.target.value))}
              >
                {CATALOGOS.condicionOperacion.map(op => (
                  <option key={op.code} value={op.code}>{op.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="label">Formas de Pago</label>
                <button
                  type="button"
                  onClick={addPago}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  + Agregar
                </button>
              </div>
              {pagos.map((pago, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <select
                    className="input w-40"
                    value={pago.codigo}
                    onChange={(e) => handlePagoChange(idx, 'codigo', e.target.value)}
                  >
                    {CATALOGOS.formaPago.map(fp => (
                      <option key={fp.code} value={fp.code}>{fp.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    className="input w-32"
                    placeholder="Monto"
                    value={pago.montoPago}
                    onChange={(e) => handlePagoChange(idx, 'montoPago', parseFloat(e.target.value) || 0)}
                  />
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="Referencia de pago (obligatorio)"
                    value={pago.referencia || ''}
                    onChange={(e) => handlePagoChange(idx, 'referencia', e.target.value)}
                    required
                  />
                  {pagos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePago(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 mt-4">
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-semibold text-indigo-200 uppercase tracking-widest">Resumen del Comprobante</h3>
                <div className="text-2xl font-black text-white">{numeroALetras(total)}</div>
                <p className="text-xs text-indigo-300">
                  Valor Total Donación: <strong>${formatCurrency(total)}</strong>
                </p>
              </div>
              <div className="flex gap-4 self-center md:self-auto pt-4 md:pt-0">
                <div className="text-right">
                  <span className="text-xs text-indigo-200 font-medium block">Total Valor Donado</span>
                  <span className="text-4xl font-extrabold text-emerald-400 font-mono">${formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={limpiarFormulario}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size="18" /> Limpiar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : <Send size="18" />}
            {loading ? 'Enviando...' : 'Enviar Comprobante'}
          </button>
        </div>
      </form>

      {resultado?.resultado && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Resultado del Envío</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Código de Generación:</strong> {resultado.codigoGeneracion}</p>
            <p><strong>Sello de Recepción:</strong> {resultado.resultado.selloRecibido}</p>
            <p><strong>Fecha Procesamiento:</strong> {resultado.resultado.fhProcesamiento}</p>
            <p><strong>Estado:</strong> <span className="text-green-600">{resultado.resultado.estado}</span></p>
            <p><strong>Mensaje:</strong> {resultado.resultado.descripcionMsg}</p>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

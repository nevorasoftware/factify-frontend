// src/pages/FacturaSujetoExcluidoPage.tsx
import React, { useState } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { ReceptorForm } from '../components/Forms/ReceptorForm';
import { ItemsTable } from '../components/Forms/ItemsTable';
import { Toast } from '../components/Common/Toast';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { enviarFacturaSujetoExcluido } from '../services/dte.service';
import { Receptor, Item, Pago } from '../types';
import { CATALOGOS } from '../utils/catalogs';
import { formatCurrency, numeroALetras } from '../utils/formatters';

const round2 = (num: number) => Number((Math.round((num + Number.EPSILON) * 100) / 100).toFixed(2));

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

export const FacturaSujetoExcluidoPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [receptor, setReceptor] = useState<Receptor>(initialReceptor);
  const [items, setItems] = useState<Item[]>([{
    numItem: 1, tipoItem: 1, cantidad: 1, codigo: null,
    uniMedida: 59, descripcion: '', precioUni: 0, montoDescu: 0, ventaGravada: 0
  }]);
  const [condicionOperacion, setCondicionOperacion] = useState(1);
  const [pagos, setPagos] = useState<Pago[]>([{ codigo: '01', montoPago: 0, referencia: null, plazo: null, periodo: null }]);
  const [aplicarRenta, setAplicarRenta] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.ventaGravada, 0);
  const renta = aplicarRenta ? round2(subtotal * 0.1) : 0;
  const total = round2(subtotal - renta);

  const handlePagoChange = (index: number, field: keyof Pago, value: any) => {
    const newPagos = [...pagos];
    newPagos[index] = { ...newPagos[index], [field]: value };
    setPagos(newPagos);
  };

  const addPago = () => {
    setPagos([
      ...pagos,
      { codigo: '01', montoPago: 0, referencia: null, plazo: null, periodo: null }
    ]);
  };

  const removePago = (index: number) => {
    setPagos(pagos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const pagosConMonto = pagos.map(p => ({ ...p, montoPago: total }));

    const data = {
      receptor,
      cuerpoDocumento: items,
      resumen: {
        totalCompra: subtotal,
        totalDescu: 0,
        subTotal: subtotal,
        reteRenta: renta,
        ivaRete1: 0,
        totalPagar: total,
        totalLetras: `${Math.floor(total)} ${((total % 1) * 100).toFixed(0)}/100 DOLARES USD`,
        condicionOperacion,
        pagos: pagosConMonto,
        observaciones: null
      }
    };

    try {
      const response = await enviarFacturaSujetoExcluido(data);
      if (response.success) {
        setToast({ type: 'success', message: `Factura Sujeto Excluido enviada exitosamente. Código: ${response.codigoGeneracion}` });
        setResultado(response);
        limpiarFormulario();
      } else {
        setToast({ type: 'error', message: response.error || 'Error al enviar DTE Sujeto Excluido' });
      }
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setReceptor(initialReceptor);
    setItems([{
      numItem: 1, tipoItem: 1, cantidad: 1, codigo: null,
      uniMedida: 59, descripcion: '', precioUni: 0, montoDescu: 0, ventaGravada: 0
    }]);
    setCondicionOperacion(1);
    setPagos([{ codigo: '01', montoPago: 0, referencia: null, plazo: null, periodo: null }]);
    setAplicarRenta(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Factura Sujeto Excluido</h1>
        <p className="text-gray-600">Complete los datos del proveedor no registrado para emitir el DTE 14</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Datos del Sujeto Excluido (Proveedor)</h2>
          <ReceptorForm receptor={receptor} onChange={setReceptor} />
        </div>

        <div className="card">
          <ItemsTable items={items} onChange={setItems} />
        </div>

        {/* CARD DE TOTALES Y CONDICIÓN DE PAGO (Diseño premium sin IVA) */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Totales y Condiciones de Operación</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="label">Condición de la Operación</label>
                <select
                  className="input w-full max-w-xs"
                  value={condicionOperacion}
                  onChange={(e) => setCondicionOperacion(parseInt(e.target.value))}
                >
                  {CATALOGOS.condicionOperacion.map(op => (
                    <option key={op.code} value={op.code}>{op.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 p-2 bg-indigo-50/50 rounded-lg max-w-xs">
                <input
                  id="aplicarRenta"
                  type="checkbox"
                  checked={aplicarRenta}
                  onChange={(e) => setAplicarRenta(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="aplicarRenta" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                  Aplicar Retención de Renta (10%)
                </label>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="label">Formas de Pago</label>
                <button
                  type="button"
                  onClick={addPago}
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                >
                  + Agregar Pago
                </button>
              </div>
              {pagos.map((pago, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
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
                  {condicionOperacion === 2 && (
                    <>
                      <input
                        type="number"
                        className="input w-20"
                        placeholder="Plazo"
                        value={pago.periodo || ''}
                        onChange={(e) => handlePagoChange(idx, 'periodo', e.target.value)}
                      />
                      <select
                        className="input w-28"
                        value={pago.plazo || ''}
                        onChange={(e) => handlePagoChange(idx, 'plazo', e.target.value)}
                      >
                        <option value="">Seleccione</option>
                        {CATALOGOS.plazo.map(pl => (
                          <option key={pl.code} value={pl.code}>{pl.name}</option>
                        ))}
                      </select>
                    </>
                  )}
                  {pagos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePago(idx)}
                      className="text-red-600 hover:text-red-800 text-sm font-semibold"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Banner de Total Premium */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 mt-4">
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-semibold text-indigo-200 uppercase tracking-widest">Resumen del Documento (Sujeto Excluido)</h3>
              <div className="text-2xl font-black text-white">{numeroALetras(total)}</div>
              <p className="text-xs text-indigo-300">
                Total Compra: <strong>${formatCurrency(subtotal)}</strong>
                {aplicarRenta && (
                  <>
                    {" | "}Retención Renta (10%): <strong className="text-red-300">-${formatCurrency(renta)}</strong>
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-4 self-center md:self-auto border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
              <div className="text-right">
                <span className="text-xs text-indigo-200 font-medium block">Total a Pagar</span>
                <span className="text-4xl font-extrabold text-emerald-400 font-mono">${formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACCIONES ALINEADAS A LA DERECHA */}
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
            {loading ? 'Enviando...' : 'Enviar DTE Sujeto Excluido'}
          </button>
        </div>
      </form>

      {resultado?.resultado && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Resultado del Envío</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Código de Generación:</strong> {resultado.codigoGeneracion}</p>
            <p><strong>Sello de Recepción:</strong> {resultado.resultado.selloRecibido || 'N/A'}</p>
            <p><strong>Fecha Procesamiento:</strong> {resultado.resultado.fhProcesamiento}</p>
            <p><strong>Estado:</strong> <span className="text-green-600 font-bold">{resultado.resultado.estado}</span></p>
            <p><strong>Mensaje:</strong> {resultado.resultado.descripcionMsg || 'Procesado exitosamente'}</p>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

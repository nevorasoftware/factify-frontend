// src/pages/DocumentoContableLiquidacionPage.tsx
import React, { useState, useEffect } from 'react';
import { Send, FileText, Calendar, DollarSign, UserCheck, ShieldAlert } from 'lucide-react';
import { ReceptorForm } from '../components/Forms/ReceptorForm';
import { Toast } from '../components/Common/Toast';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { enviarDocumentoContableLiquidacion } from '../services/dte.service';
import { Receptor } from '../types';
import { formatCurrency, numeroALetras } from '../utils/formatters';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const DocumentoContableLiquidacionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Receptor State
  const [receptor, setReceptor] = useState<any>({
    nit: '',
    nrc: '',
    nombre: '',
    codActividad: '46900',
    descActividad: 'Comercio al por mayor no especializado',
    direccion: { departamento: '01', municipio: '01', complemento: '' },
    telefono: '',
    correo: '',
    tipoEstablecimiento: '01',
    nombreComercial: '',
    codigoMH: '0000',
    puntoVentaMH: '0000'
  });

  // Liquidación Period & Metadata
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [codLiquidacion, setCodLiquidacion] = useState('LIQ-' + Math.floor(1000 + Math.random() * 9000));
  const [cantidadDoc, setCantidadDoc] = useState(1);
  const [observaciones, setObservaciones] = useState('Liquidación mensual de operaciones');

  // Valores Financieros
  const [valorOperaciones, setValorOperaciones] = useState(0);
  const [montoSinPercepcion, setMontoSinPercepcion] = useState(0);
  const [descripSinPercepcion, setDescripSinPercepcion] = useState('');
  const [comision, setComision] = useState(0);
  const [porcentComision, setPorcentComision] = useState('5.00%');

  // Manual Overrides (in case they need exact decimal tweaks)
  const [iva, setIva] = useState(0);
  const [ivaPercibido, setIvaPercibido] = useState(0);
  const [ivaComision, setIvaComision] = useState(0);
  const [liquidoApagar, setLiquidoApagar] = useState(0);

  // Auto-calculated variables
  const subTotal = round2(valorOperaciones - montoSinPercepcion);
  const montoSujetoPercepcion = subTotal;

  // React to input changes to suggest standard calculations
  useEffect(() => {
    const computedIva = round2(subTotal * 0.13);
    const computedIvaPercibido = round2(montoSujetoPercepcion * 0.02);
    const computedIvaComision = round2(comision * 0.13);
    const computedLiquido = round2((valorOperaciones + computedIva) - computedIvaPercibido - comision - computedIvaComision);

    setIva(computedIva);
    setIvaPercibido(computedIvaPercibido);
    setIvaComision(computedIvaComision);
    setLiquidoApagar(computedLiquido >= 0 ? computedLiquido : 0);
  }, [valorOperaciones, montoSinPercepcion, comision]);

  // Extension (Responsable)
  const [nombEntrega, setNombEntrega] = useState('');
  const [docuEntrega, setDocuEntrega] = useState('');
  const [codEmpleado, setCodEmpleado] = useState('EMP01');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receptor.nit || !receptor.nombre) {
      setToast({ type: 'error', message: '⚠️ Por favor complete los datos obligatorios del receptor.' });
      return;
    }

    setLoading(true);

    // DTE 09 Cuerpo Documento Object
    const payload = {
      receptor,
      cuerpoDocumento: {
        periodoLiquidacionFechaInicio: fechaInicio,
        periodoLiquidacionFechaFin: fechaFin,
        codLiquidacion: codLiquidacion || null,
        cantidadDoc: cantidadDoc ? Number(cantidadDoc) : null,
        valorOperaciones: Number(valorOperaciones),
        montoSinPercepcion: Number(montoSinPercepcion),
        descripSinPercepcion: descripSinPercepcion || null,
        subTotal: Number(subTotal),
        iva: Number(iva),
        montoSujetoPercepcion: Number(montoSujetoPercepcion),
        ivaPercibido: Number(ivaPercibido),
        comision: Number(comision),
        porcentComision: porcentComision || null,
        ivaComision: Number(ivaComision),
        liquidoApagar: Number(liquidoApagar),
        totalLetras: numeroALetras(liquidoApagar),
        observaciones: observaciones || null
      },
      extension: {
        nombEntrega: nombEntrega || receptor.nombre,
        docuEntrega: docuEntrega || '0000-000000-000-0',
        codEmpleado: codEmpleado || null
      },
      apendice: null
    };

    try {
      const response = await enviarDocumentoContableLiquidacion(payload);
      if (response.success) {
        setToast({ 
          type: 'success', 
          message: `✨ Documento Contable de Liquidación (DTE 09) transmitido con éxito. Sello: ${response.resultado?.selloRecibido || 'N/A'}` 
        });
      } else {
        setToast({ 
          type: 'error', 
          message: `❌ Error MH: ${response.resultado?.descripcionMsg || response.error || 'Rechazado'}` 
        });
      }
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Error en la petición' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="text-primary-600 w-7 h-7" />
          Documento Contable de Liquidación Electrónica (DTE 09)
        </h1>
        <p className="text-gray-600">Complete los datos para generar el documento de liquidación electrónica para afiliados y comisionistas</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECCIÓN 1: RECEPTOR */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary-600" />
            Información del Receptor (Afiliado/Contribuyente)
          </h2>
          <ReceptorForm receptor={receptor} onChange={setReceptor} />
        </div>

        {/* SECCIÓN 2: PERIODO Y GENERALES */}
        <div className="card grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-4 mb-2">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              Período y Datos Generales de la Liquidación
            </h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio Período *</label>
            <input 
              type="date" 
              className="input" 
              value={fechaInicio} 
              onChange={e => setFechaInicio(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin Período *</label>
            <input 
              type="date" 
              className="input" 
              value={fechaFin} 
              onChange={e => setFechaFin(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de Liquidación</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Ej: LIQ-12345" 
              value={codLiquidacion} 
              onChange={e => setCodLiquidacion(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de Documentos</label>
            <input 
              type="number" 
              className="input" 
              min={1} 
              value={cantidadDoc} 
              onChange={e => setCantidadDoc(Number(e.target.value))} 
            />
          </div>
          <div className="col-span-1 md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones / Descripción del Período</label>
            <textarea 
              rows={2} 
              className="input" 
              placeholder="Notas u observaciones de esta liquidación..." 
              value={observaciones} 
              onChange={e => setObservaciones(e.target.value)}
            />
          </div>
        </div>

        {/* SECCIÓN 3: VALORES OPERACIONALES */}
        <div className="card grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-3 mb-2">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-600" />
              Detalle de Valores Financieros y Comisiones
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Operaciones a Liquidar *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 font-medium">$</span>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                className="input pl-8" 
                value={valorOperaciones || ''} 
                onChange={e => setValorOperaciones(Number(e.target.value))} 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valores No Sujetos a Percepción</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 font-medium">$</span>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                className="input pl-8" 
                value={montoSinPercepcion || ''} 
                onChange={e => setMontoSinPercepcion(Number(e.target.value))} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de Valores No Sujetos</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Ej: Reembolso de comisiones" 
              value={descripSinPercepcion} 
              onChange={e => setDescripSinPercepcion(e.target.value)} 
            />
          </div>

          <div className="border-t border-gray-100 col-span-1 md:col-span-3 my-2 pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1 flex items-center gap-1">
                IVA de Operaciones (13%)
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">Editable</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-medium">$</span>
                <input 
                  type="number" 
                  step="0.00000001" 
                  className="input pl-8 bg-amber-50/50 border-amber-200 focus:ring-amber-500 font-mono" 
                  value={iva} 
                  onChange={e => setIva(Number(e.target.value))} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1 flex items-center gap-1">
                IVA Percibido (2%)
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">Editable</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-medium">$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input pl-8 bg-amber-50/50 border-amber-200 focus:ring-amber-500 font-mono" 
                  value={ivaPercibido} 
                  onChange={e => setIvaPercibido(Number(e.target.value))} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Monto Sujeto Percepción (Base)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-medium">$</span>
                <input 
                  type="number" 
                  className="input pl-8 bg-gray-50 text-gray-500" 
                  value={montoSujetoPercepcion} 
                  disabled 
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 col-span-1 md:col-span-3 my-2 pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Comisión de Liquidación</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-medium">$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  className="input pl-8" 
                  value={comision || ''} 
                  onChange={e => setComision(Number(e.target.value))} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje Comisión (Etiqueta)</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Ej: 5.00%" 
                value={porcentComision} 
                onChange={e => setPorcentComision(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1 flex items-center gap-1">
                IVA de Comisión (13%)
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">Editable</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-medium">$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input pl-8 bg-amber-50/50 border-amber-200 focus:ring-amber-500 font-mono" 
                  value={ivaComision} 
                  onChange={e => setIvaComision(Number(e.target.value))} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: RESPONSABLE (EXTENSION) */}
        <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-3 mb-2">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary-600" />
              Responsable de la Operación (Extensión)
            </h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Responsable *</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Ej: Juan Pérez" 
              value={nombEntrega} 
              onChange={e => setNombEntrega(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento Identificación *</label>
            <input 
              type="text" 
              className="input" 
              placeholder="DUI o NIT de quien genera" 
              value={docuEntrega} 
              onChange={e => setDocuEntrega(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código Empleado</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Ej: EMP001" 
              value={codEmpleado} 
              onChange={e => setCodEmpleado(e.target.value)} 
            />
          </div>
        </div>

        {/* PREMIUM TOTALS CARD (INDIGO) */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-semibold text-indigo-200 uppercase tracking-widest flex items-center gap-2">
              <span>Resumen Contable</span>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-mono">DTE 09</span>
            </h3>
            <div className="text-2xl font-black text-white">{numeroALetras(liquidoApagar)}</div>
            <p className="text-xs text-indigo-300">
              Operaciones: <strong>${formatCurrency(valorOperaciones)}</strong> | No Sujeto: <strong>${formatCurrency(montoSinPercepcion)}</strong> | IVA Ops: <strong>${formatCurrency(iva)}</strong> | IVA Percibido: <strong>-${formatCurrency(ivaPercibido)}</strong> | Comisiones: <strong>-${formatCurrency(comision)}</strong>
            </p>
          </div>
          <div className="flex gap-4 self-center md:self-auto border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
            <div className="text-right">
              <span className="text-xs text-indigo-200 font-medium block">Líquido a Pagar al Afiliado</span>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono self-center">Override</span>
                <input 
                  type="number" 
                  step="0.01" 
                  className="bg-transparent text-4xl font-extrabold text-emerald-400 font-mono text-right w-36 outline-none focus:border-b focus:border-emerald-400"
                  value={liquidoApagar} 
                  onChange={e => setLiquidoApagar(Number(e.target.value))} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 min-w-[240px]"
          >
            {loading ? (
              <>
                <LoadingSpinner />
                <span>Transmitiendo...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Enviar Liquidación Contable</span>
              </>
            )}
          </button>
        </div>
      </form>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

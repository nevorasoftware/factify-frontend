// src/pages/FacturaExportacionPage.tsx
import React, { useState } from 'react';
import { Send, Globe, Truck, DollarSign } from 'lucide-react';
import { ReceptorForm } from '../components/Forms/ReceptorForm';
import { ItemsTable } from '../components/Forms/ItemsTable';
import { Toast } from '../components/Common/Toast';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { enviarFacturaExportacion } from '../services/dte.service';
import { Receptor, Item } from '../types';
import { formatCurrency, numeroALetras } from '../utils/formatters';

export const FacturaExportacionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [receptor, setReceptor] = useState<Receptor>({
    nit: '', nrc: '', nombre: '', codActividad: null, descActividad: null,
    direccion: { departamento: '06', municipio: '14', complemento: '' }, telefono: '', correo: ''
  });
  const [items, setItems] = useState<Item[]>([{
    numItem: 1, tipoItem: 1, cantidad: 1, codigo: 'EXP-001', uniMedida: 59, descripcion: '', precioUni: 0, montoDescu: 0, ventaGravada: 0
  }]);
  
  // Estados para captura de campos de Exportación
  const [pais, setPais] = useState('840'); // USA por defecto (ISO numeric 3 digits)
  const [nombrePais, setNombrePais] = useState('ESTADOS UNIDOS');
  const [tipoPersona, setTipoPersona] = useState('2'); // Jurídica por defecto
  const [complemento, setComplemento] = useState('');
  
  const [codIncoterms, setCodIncoterms] = useState('04'); // FOB por defecto
  const [descIncoterms, setDescIncoterms] = useState('FOB - Free on Board');
  const [flete, setFlete] = useState<number>(0);
  const [seguro, setSeguro] = useState<number>(0);
  const [observaciones, setObservaciones] = useState('Exportacion de mercaderia');
  
  const [toast, setToast] = useState<any>(null);

  const paises = [
    { code: '840', name: 'ESTADOS UNIDOS' },
    { code: '320', name: 'GUATEMALA' },
    { code: '340', name: 'HONDURAS' },
    { code: '124', name: 'CANADA' },
    { code: '591', name: 'PANAMA' },
    { code: '188', name: 'COSTA RICA' },
    { code: '558', name: 'NICARAGUA' },
    { code: '156', name: 'CHINA' },
    { code: '724', name: 'ESPAÑA' }
  ];

  const incotermsOptions = [
    { code: '04', label: 'FOB - Free on Board' },
    { code: '01', label: 'EXW - Ex Works' },
    { code: '02', label: 'FCA - Free Carrier' },
    { code: '06', label: 'CIF - Cost, Insurance and Freight' },
    { code: '11', label: 'DDP - Delivered Duty Paid' },
    { code: '09', label: 'DAP - Delivered At Place' }
  ];

  const handlePaisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const found = paises.find(p => p.code === code);
    setPais(code);
    if (found) setNombrePais(found.name);
  };

  const handleIncotermChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const found = incotermsOptions.find(i => i.code === code);
    setCodIncoterms(code);
    if (found) setDescIncoterms(found.label);
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.ventaGravada || 0), 0);
  const totalDescu = items.reduce((sum, item) => sum + Number(item.montoDescu || 0), 0);
  const totalPagar = subtotal + Number(flete) + Number(seguro) - totalDescu;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      receptor: { 
        ...receptor, 
        pais: pais, 
        nombrePais: nombrePais,
        tipoPersona: tipoPersona,
        complemento: complemento || receptor.direccion?.complemento || "Miami, Florida, USA",
        descActividad: receptor.descActividad || "Otros"
      },
      cuerpoDocumento: items.map(i => ({
        ...i, 
        precioUni: Number(i.precioUni),
        cantidad: Number(i.cantidad),
        montoDescu: Number(i.montoDescu || 0),
        ventaGravada: Number(i.ventaGravada || 0)
      })),
      resumen: {
        totalGravada: subtotal,
        totalDescu: totalDescu,
        totalPagar: totalPagar,
        montoTotalOperacion: subtotal + Number(flete) + Number(seguro),
        totalLetras: `${Math.floor(totalPagar)} ${((totalPagar % 1) * 100).toFixed(0)}/100 DOLARES USD`,
        condicionOperacion: 1, 
        seguro: Number(seguro), 
        flete: Number(flete), 
        codIncoterms: codIncoterms, 
        descIncoterms: descIncoterms,
        observaciones: observaciones
      }
    };

    try {
      const response = await enviarFacturaExportacion(data);
      if (response.success) {
        setToast({ 
          type: 'success', 
          message: `✅ Factura de Exportación enviada con éxito! Sello MH: ${response.resultado?.selloRecibido || 'Firmado'}` 
        });
      } else {
        setToast({ 
          type: 'error', 
          message: `❌ Error MH: ${response.resultado?.descripcionMsg || response.error || 'Rechazado'}` 
        });
      }
    } catch (error: any) {
      setToast({ type: 'error', message: error.message });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Globe className="text-primary-600 w-7 h-7" />
          Factura de Exportación Electrónica (DTE 11)
        </h1>
        <p className="text-gray-600">Complete los datos para emitir una Factura de Exportación electrónica</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección de Datos del Receptor */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-600" />
            Información del Cliente Extranjero
          </h2>
          <ReceptorForm receptor={receptor} onChange={setReceptor} />
        </div>

        {/* Sección Especializada de Logística y Aduanas */}
        <div className="card space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary-600" />
            Datos Especiales de Exportación y Logística
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País Destino</label>
              <select 
                value={pais} 
                onChange={handlePaisChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white text-gray-800 border p-2"
              >
                {paises.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Persona</label>
              <select 
                value={tipoPersona} 
                onChange={(e) => setTipoPersona(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white text-gray-800 border p-2"
              >
                <option value="1">Persona Natural</option>
                <option value="2">Persona Jurídica (Empresa)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Regla de Incoterm</label>
              <select 
                value={codIncoterms} 
                onChange={handleIncotermChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white text-gray-800 border p-2"
              >
                {incotermsOptions.map(i => (
                  <option key={i.code} value={i.code}>{i.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto de Flete ($)</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-semibold">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={flete}
                  onChange={(e) => setFlete(Number(e.target.value))}
                  placeholder="0.00"
                  className="block w-full pl-8 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto de Seguro ($)</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-semibold">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={seguro}
                  onChange={(e) => setSeguro(Number(e.target.value))}
                  placeholder="0.00"
                  className="block w-full pl-8 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección en el Extranjero (Mín. 10 caracteres)</label>
              <input 
                type="text" 
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Dirección exacta en el país de destino"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones de Exportación</label>
            <textarea 
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Especifica condiciones especiales, puerto de salida, o transporte..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2 resize-none"
            />
          </div>
        </div>

        {/* Sección de Ítems del Documento */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-600" />
            Detalle de Bienes y Servicios a Exportar
          </h2>
          <ItemsTable items={items} onChange={setItems} />
        </div>

        {/* RESUMEN PANEL */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 mt-4">
          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-semibold text-indigo-200 uppercase tracking-widest">Resumen de Exportación</h3>
            <div className="text-2xl font-black text-white">{numeroALetras(totalPagar)}</div>
            <p className="text-xs text-indigo-300">
              Valor FOB: <strong>${formatCurrency(subtotal)}</strong> | Flete: <strong>${formatCurrency(flete)}</strong> | Seguro: <strong>${formatCurrency(seguro)}</strong> | Descuentos: <strong>${formatCurrency(totalDescu)}</strong>
            </p>
          </div>
          <div className="flex gap-4 self-center md:self-auto border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
            <div className="text-right">
              <span className="text-xs text-indigo-200 font-medium block">Total FOB a Pagar</span>
              <span className="text-4xl font-extrabold text-emerald-400 font-mono">${formatCurrency(totalPagar)}</span>
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
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Enviar Factura Exportación</span>
              </>
            )}
          </button>
        </div>
      </form>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

// src/pages/ComprobanteLiquidacionPage.tsx
import React, { useState, useEffect } from 'react';
import { Send, Plus, Trash2, Search, CheckCircle, RefreshCw } from 'lucide-react';
import { ReceptorForm } from '../components/Forms/ReceptorForm';
import { Toast } from '../components/Common/Toast';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { enviarComprobanteLiquidacion, obtenerDteInfo } from '../services/dte.service';
import { Receptor } from '../types';

interface LiquidacionItem {
  numItem: number;
  tipoDte: string;
  tipoGeneracion: number;
  numeroDocumento: string;
  fechaGeneracion: string;
  ventaNoSuj: number;
  ventaExenta: number;
  ventaGravada: number;
  exportaciones: number;
  tributos: string[] | null;
  ivaItem: number;
  obsItem: string;
  searching?: boolean;
  linkedDte?: any;
}

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

// Convertidor de números a letras
const numeroALetras = (num: number): string => {
  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const especiales = {
    11: "ONCE", 12: "DOCE", 13: "TRECE", 14: "CATORCE", 15: "QUINCE",
    16: "DIECISEIS", 17: "DIECISIETE", 18: "DIECIOCHO", 19: "DIECINUEVE",
    21: "VEINTIUNO", 22: "VEINTIDOS", 23: "VEINTITRES", 24: "VEINTICUATRO",
    25: "VEINTICINCO", 26: "VEINTISEIS", 27: "VEINTISIETE", 28: "VEINTIOCHO",
    29: "VEINTINUEVE"
  };
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  if (num === 0) return "CERO CON 00/100 DOLARES USD";

  const entero = Math.floor(num);
  const decimales = Math.round((num - entero) * 100);

  const convertirGrupo = (n: number): string => {
    let str = "";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) {
      if (c === 1 && d === 0 && u === 0) {
        str += "CIEN ";
      } else {
        str += centenas[c] + " ";
      }
    }

    const du = n % 100;
    if (du > 0) {
      if (du < 10) {
        str += unidades[du] + " ";
      } else if (du >= 11 && du <= 29) {
        str += (especiales as any)[du] + " ";
      } else {
        str += decenas[d] + " ";
        if (u > 0) {
          str += "Y " + unidades[u] + " ";
        }
      }
    }
    return str.trim();
  };

  let letras = "";
  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const cientos = entero % 1000;

  if (millones > 0) {
    letras += millones === 1 ? "UN MILLON " : convertirGrupo(millones) + " MILLONES ";
  }
  if (miles > 0) {
    letras += miles === 1 ? "MIL " : convertirGrupo(miles) + " MIL ";
  }
  if (cientos > 0) {
    letras += convertirGrupo(cientos) + " ";
  }

  letras = letras.trim() || "CERO";
  return `${letras} CON ${decimales.toString().padStart(2, '0')}/100 DOLARES USD`;
};

export const ComprobanteLiquidacionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [receptor, setReceptor] = useState<Receptor>(initialReceptor);
  const [items, setItems] = useState<LiquidacionItem[]>([{
    numItem: 1,
    tipoDte: '03',
    tipoGeneracion: 2,
    numeroDocumento: '',
    fechaGeneracion: new Date().toISOString().split('T')[0],
    ventaNoSuj: 0,
    ventaExenta: 0,
    ventaGravada: 0,
    exportaciones: 0,
    tributos: ['20'],
    ivaItem: 0,
    obsItem: 'Liquidación de operación'
  }]);
  
  const [extension, setExtension] = useState<any>({
    nombEntrega: 'NEVORA SOFTWARE S.A.S. DE C.V.',
    docuEntrega: '0623-180526-114-9',
    nombRecibe: 'REPRESENTANTE RECEPTOR',
    docuRecibe: '0614-161017-108-1',
    observaciones: 'Liquidación de operaciones comerciales'
  });

  const [resultado, setResultado] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Totales
  const totalNoSuj = items.reduce((sum, item) => sum + (Number(item.ventaNoSuj) || 0), 0);
  const totalExenta = items.reduce((sum, item) => sum + (Number(item.ventaExenta) || 0), 0);
  const totalGravada = items.reduce((sum, item) => sum + (Number(item.ventaGravada) || 0), 0);
  const totalExportacion = items.reduce((sum, item) => sum + (Number(item.exportaciones) || 0), 0);
  const subTotalVentas = totalNoSuj + totalExenta + totalGravada;
  const ivaPerci = items.reduce((sum, item) => sum + (Number(item.ivaItem) || 0), 0);
  const total = totalExportacion + subTotalVentas + ivaPerci;
  const totalLetras = numeroALetras(total);

  // Auto-llenar responsables del emisor guardado
  useEffect(() => {
    const saved = localStorage.getItem('emisorConfig');
    if (saved) {
      const emisor = JSON.parse(saved);
      setExtension((prev: any) => ({
        ...prev,
        nombEntrega: emisor.nombre || prev.nombEntrega,
        docuEntrega: emisor.nit || prev.docuEntrega
      }));
    }
  }, []);

  const addItem = () => {
    setItems([...items, {
      numItem: items.length + 1,
      tipoDte: '03',
      tipoGeneracion: 2,
      numeroDocumento: '',
      fechaGeneracion: new Date().toISOString().split('T')[0],
      ventaNoSuj: 0,
      ventaExenta: 0,
      ventaGravada: 0,
      exportaciones: 0,
      tributos: ['20'],
      ivaItem: 0,
      obsItem: 'Liquidación de operación'
    }]);
  };

  const removeItem = (index: number) => {
    const filtered = items.filter((_, i) => i !== index);
    const reindexed = filtered.map((item, idx) => ({
      ...item,
      numItem: idx + 1
    }));
    setItems(reindexed);
  };

  const updateItem = (index: number, field: keyof LiquidacionItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value } as any;

    // Auto-calcular IVA si es gravada y no se ingresó IVA manual
    if (field === 'ventaGravada') {
      const vg = Number(value) || 0;
      newItems[index].ivaItem = Number((vg * 0.13).toFixed(4));
    }

    setItems(newItems);
  };

  const handleSearchItemDte = async (idx: number) => {
    const uuid = items[idx].numeroDocumento.trim();
    if (!uuid) {
      setToast({ type: 'error', message: 'Por favor, ingrese el Código de Generación (UUID) del documento original.' });
      return;
    }

    const newItems = [...items];
    newItems[idx].searching = true;
    setItems(newItems);

    try {
      const response = await obtenerDteInfo(uuid);
      if (response.success && response.dte) {
        const doc = response.dte;
        
        // Auto-completar fila
        newItems[idx].tipoDte = doc.tipoDte || '03';
        newItems[idx].fechaGeneracion = doc.fechaEmision;
        
        // Asignar monto a gravado o exportación según el tipo
        if (doc.tipoDte === '11') {
          newItems[idx].exportaciones = doc.montoTotal || 0;
          newItems[idx].ventaGravada = 0;
          newItems[idx].ivaItem = 0;
          newItems[idx].tributos = null;
        } else {
          newItems[idx].ventaGravada = doc.montoTotal || 0;
          newItems[idx].exportaciones = 0;
          newItems[idx].ivaItem = Number((doc.montoTotal * 0.13).toFixed(4));
          newItems[idx].tributos = ['20'];
        }

        newItems[idx].obsItem = `Liquidación s/ DTE original ${doc.numeroControl}`;
        newItems[idx].linkedDte = doc;

        setItems(newItems);
        setToast({ type: 'success', message: '¡Documento encontrado y vinculado exitosamente!' });

        // Auto-completar el receptor principal si está vacío
        if (doc.cliente && !receptor.nombre) {
          setReceptor({
            nit: doc.cliente.numDocumento.length === 14 ? doc.cliente.numDocumento : '',
            nrc: doc.cliente.nrc || '000000-0',
            nombre: doc.cliente.nombre,
            codActividad: doc.cliente.codActividad || null,
            descActividad: doc.cliente.descActividad || null,
            direccion: { departamento: '06', municipio: '14', complemento: doc.cliente.direccion || '' },
            telefono: doc.cliente.telefono || '',
            correo: doc.cliente.correo || ''
          });

          setExtension((prev: any) => ({
            ...prev,
            nombRecibe: doc.cliente.nombre,
            docuRecibe: doc.cliente.numDocumento
          }));
        }
      } else {
        setToast({ type: 'error', message: 'No se encontró el documento original en la base de datos.' });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Error de conexión al buscar el documento.';
      setToast({ type: 'error', message: errorMsg });
    } finally {
      const resetItems = [...items];
      resetItems[idx].searching = false;
      setItems(resetItems);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResultado(null);

    const receptorData = {
      nit: (receptor.nit || '').trim(),
      nrc: (receptor.nrc || '').trim(),
      nombre: receptor.nombre,
      codActividad: receptor.codActividad || "46900",
      descActividad: receptor.descActividad || "Comercio al por mayor no especializado",
      nombreComercial: receptor.nombre || "Receptor Comercial",
      direccion: receptor.direccion,
      telefono: receptor.telefono || "2222-2222",
      correo: receptor.correo || "correo@receptor.com"
    };

    const cuerpoData = items.map(item => ({
      numItem: item.numItem,
      tipoDte: item.tipoDte,
      tipoGeneracion: Number(item.tipoGeneracion),
      numeroDocumento: item.numeroDocumento.trim().toUpperCase(),
      fechaGeneracion: item.fechaGeneracion,
      ventaNoSuj: Number(item.ventaNoSuj) || 0,
      ventaExenta: Number(item.ventaExenta) || 0,
      ventaGravada: Number(item.ventaGravada) || 0,
      exportaciones: Number(item.exportaciones) || 0,
      tributos: ivaPerci > 0 && Number(item.ventaGravada) > 0 ? ['20'] : null,
      ivaItem: Number(item.ivaItem) || 0,
      obsItem: item.obsItem
    }));

    const data = {
      receptor: receptorData,
      cuerpoDocumento: cuerpoData,
      resumen: {
        totalNoSuj: Number(totalNoSuj.toFixed(2)),
        totalExenta: Number(totalExenta.toFixed(2)),
        totalGravada: Number(totalGravada.toFixed(2)),
        totalExportacion: Number(totalExportacion.toFixed(2)),
        subTotalVentas: Number(subTotalVentas.toFixed(2)),
        ivaPerci: Number(ivaPerci.toFixed(2)),
        total: Number(total.toFixed(2)),
        totalLetras: totalLetras,
        condicionOperacion: 1, // Contado
        tributos: ivaPerci > 0 ? [{
          codigo: "20",
          descripcion: "Impuesto al Valor Agregado 13%",
          valor: Number(ivaPerci.toFixed(2))
        }] : null
      },
      extension: {
        nombEntrega: extension.nombEntrega,
        docuEntrega: extension.docuEntrega,
        nombRecibe: extension.nombRecibe,
        docuRecibe: extension.docuRecibe,
        observaciones: extension.observaciones
      },
      apendice: null
    };

    try {
      const response = await enviarComprobanteLiquidacion(data);
      if (response.success) {
        setToast({ type: 'success', message: `Comprobante de Liquidación emitido exitosamente. Código: ${response.codigoGeneracion}` });
        setResultado(response);
        limpiarFormulario();
      } else {
        setToast({ type: 'error', message: response.error || 'Error al emitir el Comprobante de Liquidación' });
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
      numItem: 1,
      tipoDte: '03',
      tipoGeneracion: 2,
      numeroDocumento: '',
      fechaGeneracion: new Date().toISOString().split('T')[0],
      ventaNoSuj: 0,
      ventaExenta: 0,
      ventaGravada: 0,
      exportaciones: 0,
      tributos: ['20'],
      ivaItem: 0,
      obsItem: 'Liquidación de operación'
    }]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Comprobante de Liquidación</h1>
          <p className="text-gray-500 text-sm">Emisión oficial de Comprobantes de Liquidación Electrónica (DTE 08)</p>
        </div>
        <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-full uppercase tracking-wider shadow-xs">
          DTE Tipo 08
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* RECEPTOR */}
        <div className="card shadow-xs hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 block"></span>
            Datos del Receptor (Liquidado)
          </h2>
          <ReceptorForm receptor={receptor} onChange={setReceptor} />
        </div>

        {/* CUERPO - DOCUMENTOS LIQUIDADOS */}
        <div className="card shadow-xs">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 block"></span>
              Operaciones y Documentos a Liquidar
            </h2>
            <button type="button" onClick={addItem} className="btn-secondary py-1.5 px-3 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1.5 text-xs font-bold transition-all">
              <Plus size="14" /> Agregar Operación
            </button>
          </div>

          <div className="space-y-6">
            {items.map((item, idx) => (
              <div key={idx} className="relative bg-gray-50/50 hover:bg-gray-50 rounded-xl p-5 border border-gray-200 transition-all duration-200">
                
                {/* Header item */}
                <div className="flex justify-between items-center mb-4">
                  <span className="px-2.5 py-1 bg-gray-200/80 text-gray-700 font-extrabold text-xs rounded-lg uppercase">
                    Ítem #{item.numItem}
                  </span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                      <Trash2 size="16" />
                    </button>
                  )}
                </div>

                {/* Grid info documento */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="label text-xs font-bold text-gray-700">Tipo DTE Original</label>
                    <select className="input text-sm" value={item.tipoDte} onChange={e => updateItem(idx, 'tipoDte', e.target.value)}>
                      <option value="03">Crédito Fiscal (03)</option>
                      <option value="01">Factura (01)</option>
                      <option value="05">Nota de Crédito (05)</option>
                      <option value="06">Nota de Débito (06)</option>
                      <option value="11">Factura de Exportación (11)</option>
                    </select>
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-gray-700">Formato de Generación</label>
                    <select className="input text-sm" value={item.tipoGeneracion} onChange={e => updateItem(idx, 'tipoGeneracion', parseInt(e.target.value))}>
                      <option value={2}>DTE Electrónico</option>
                      <option value={1}>Documento Físico</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="label text-xs font-bold text-gray-700">Número de Documento / UUID</label>
                    <div className="flex gap-2">
                      <input type="text" className="input text-sm flex-1 font-mono uppercase" placeholder={item.tipoGeneracion === 2 ? "UUID COMPLETO" : "N° DOCUMENTO FISICO"} value={item.numeroDocumento} onChange={e => updateItem(idx, 'numeroDocumento', e.target.value)} required />
                      {item.tipoGeneracion === 2 && (
                        <button type="button" onClick={() => handleSearchItemDte(idx)} className="btn-secondary px-3 flex items-center justify-center gap-1 text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors" disabled={item.searching}>
                          {item.searching ? <LoadingSpinner /> : <Search size="14" />} Buscar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid montos retencion */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="label text-xs font-bold text-gray-700">Fecha Emisión Original</label>
                    <input type="date" className="input text-sm" value={item.fechaGeneracion} onChange={e => updateItem(idx, 'fechaGeneracion', e.target.value)} required />
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-gray-700">Monto Gravado ($)</label>
                    <input type="number" step="0.01" className="input text-sm font-bold text-indigo-900" value={item.ventaGravada || ''} onChange={e => updateItem(idx, 'ventaGravada', parseFloat(e.target.value))} required placeholder="0.00" disabled={item.tipoDte === '11'} />
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-gray-700">Exportaciones ($)</label>
                    <input type="number" step="0.01" className="input text-sm font-bold text-indigo-900" value={item.exportaciones || ''} onChange={e => updateItem(idx, 'exportaciones', parseFloat(e.target.value))} required placeholder="0.00" disabled={item.tipoDte !== '11'} />
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-gray-700">Monto No Sujeto ($)</label>
                    <input type="number" step="0.01" className="input text-sm" value={item.ventaNoSuj || ''} onChange={e => updateItem(idx, 'ventaNoSuj', parseFloat(e.target.value))} placeholder="0.00" />
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-gray-700">IVA por ítem ($)</label>
                    <input type="number" step="0.0001" className="input text-sm font-black text-emerald-700 bg-emerald-50/50 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500" value={item.ivaItem || ''} onChange={e => updateItem(idx, 'ivaItem', parseFloat(e.target.value))} required placeholder="0.00" disabled={item.tipoDte === '11'} />
                  </div>
                </div>

                {/* Descripcion */}
                <div className="mt-3">
                  <label className="label text-xs font-bold text-gray-700">Observaciones del ítem / Descripción</label>
                  <input type="text" className="input text-sm" placeholder="Ej. Liquidación de venta de bienes y comisiones según factura" value={item.obsItem} onChange={e => updateItem(idx, 'obsItem', e.target.value)} required />
                </div>

                {/* Linked visualizer info */}
                {item.linkedDte && (
                  <div className="mt-3 py-2 px-3 bg-emerald-50 border border-emerald-100 rounded-lg flex justify-between items-center text-xs text-emerald-800">
                    <span>✅ DTE Vinculado: <strong>{item.linkedDte.numeroControl}</strong> emitido el {item.linkedDte.fechaEmision}</span>
                    <span>Monto Total: <strong>${item.linkedDte.montoTotal.toFixed(2)}</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RESPONSABLES Y EXTENSION */}
        <div className="card shadow-xs">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 block"></span>
            Firmas y Datos de Extensión (Responsables)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Responsable de la Entrega (Emisor) */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
              <h3 className="text-xs font-bold text-gray-900 tracking-wider uppercase border-b border-gray-200 pb-1">Representante del Emisor</h3>
              <div>
                <label className="label text-xs text-gray-600">Nombre de Responsable</label>
                <input type="text" className="input text-sm" value={extension.nombEntrega} onChange={e => setExtension({ ...extension, nombEntrega: e.target.value })} required />
              </div>
              <div>
                <label className="label text-xs text-gray-600">Documento de Identificación (NIT/DUI)</label>
                <input type="text" className="input text-sm" value={extension.docuEntrega} onChange={e => setExtension({ ...extension, docuEntrega: e.target.value })} required />
              </div>
            </div>

            {/* Responsable de la Recepcion (Receptor) */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
              <h3 className="text-xs font-bold text-gray-900 tracking-wider uppercase border-b border-gray-200 pb-1">Representante del Receptor</h3>
              <div>
                <label className="label text-xs text-gray-600">Nombre de Responsable</label>
                <input type="text" className="input text-sm" value={extension.nombRecibe} onChange={e => setExtension({ ...extension, nombRecibe: e.target.value })} required />
              </div>
              <div>
                <label className="label text-xs text-gray-600">Documento de Identificación (NIT/DUI)</label>
                <input type="text" className="input text-sm" value={extension.docuRecibe} onChange={e => setExtension({ ...extension, docuRecibe: e.target.value })} required />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="label text-xs font-bold text-gray-700">Observaciones Generales</label>
            <textarea className="input text-sm h-20 resize-none" value={extension.observaciones} onChange={e => setExtension({ ...extension, observaciones: e.target.value })} />
          </div>
        </div>

        {/* RESUMEN PANEL */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-semibold text-indigo-200 uppercase tracking-widest">Resumen de Liquidación</h3>
            <div className="text-2xl font-black">{totalLetras}</div>
            <p className="text-xs text-indigo-300">
              Ventas Gravadas: <strong>${totalGravada.toFixed(2)}</strong> | Exportaciones: <strong>${totalExportacion.toFixed(2)}</strong> | No Sujeto/Exento: <strong>${(totalNoSuj + totalExenta).toFixed(2)}</strong>
            </p>
          </div>
          <div className="flex gap-4 self-center md:self-auto border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
            <div className="text-right">
              <span className="text-xs text-indigo-200 font-medium block">Total Liquidado (con IVA)</span>
              <span className="text-4xl font-extrabold text-emerald-400 font-mono">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* BOTON DE ACCION */}
        <div className="flex justify-end gap-3">
          <button type="submit" className="btn-primary py-3 px-6 text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all bg-indigo-600 text-white" disabled={loading}>
            {loading ? <RefreshCw className="animate-spin" size="18" /> : <Send size="18" />}
            {loading ? 'Transmitiendo a Hacienda...' : 'Transmitir Comprobante de Liquidación'}
          </button>
        </div>
      </form>

      {/* RESULTADO MH */}
      {resultado && resultado.resultado && (
        <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="text-emerald-600" size="28" />
            <div>
              <h3 className="text-lg font-bold text-emerald-900">¡DTE 08 Emitido con Éxito!</h3>
              <p className="text-xs text-emerald-700 font-medium">El Ministerio de Hacienda procesó y firmó correctamente el documento.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-emerald-100 pt-4 text-sm text-emerald-800">
            <p><strong>Código Generación (UUID):</strong><br /><span className="font-mono text-xs select-all text-emerald-955 bg-white border border-emerald-100 px-1 rounded">{resultado.codigoGeneracion}</span></p>
            <p><strong>N° de Control MH:</strong><br /><span className="font-mono text-xs select-all text-emerald-955 bg-white border border-emerald-100 px-1 rounded">{resultado.resultado.numeroControl || 'DTE-08-...'}</span></p>
            <p><strong>Sello Recepción:</strong><br /><span className="font-mono text-xs select-all text-emerald-955 bg-white border border-emerald-100 px-1 rounded">{resultado.resultado.selloRecibido || 'N/A'}</span></p>
          </div>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

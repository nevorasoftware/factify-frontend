// src/pages/Contabilidad.tsx
import React, { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, Download, Loader2, Pencil, Printer, Save, Settings, X } from 'lucide-react';
import {
  descargarAnexo, guardarAjustesContables, guardarConfiguracionContable, guardarDatosCompra, obtenerReporteContable
} from '../services/contabilidad.service';

const TIPOS_OPERACION = [[1, 'Gravada'], [2, 'No gravada'], [3, 'Excluido o no constituye renta'], [4, 'Mixta'], [8, 'Informada en más de un anexo'], [9, 'No deducible / sujeto especial']];
const CLASIFICACIONES = [[1, 'Costo'], [2, 'Gasto'], [8, 'Informada en más de un anexo'], [9, 'No deducible / sujeto especial']];
const SECTORES = [[1, 'Industria'], [2, 'Comercio'], [3, 'Agropecuaria'], [4, 'Servicios, profesiones, artes y oficios'], [8, 'Informada en más de un anexo'], [9, 'No deducible / sujeto especial']];
const TIPOS_COSTO_GASTO = [[1, 'Gastos de venta'], [2, 'Gastos de administración'], [3, 'Gastos financieros'], [4, 'Costo: importaciones / internaciones'], [5, 'Costo: compras internas'], [6, 'Costos indirectos de fabricación'], [7, 'Mano de obra'], [8, 'Informada en más de un anexo'], [9, 'No deducible / sujeto especial']];
const TIPOS_INGRESO = [[1, 'Profesiones, artes y oficios'], [2, 'Actividades de servicios'], [3, 'Actividades comerciales'], [4, 'Actividades industriales'], [5, 'Actividades agropecuarias'], [10, 'Otras rentas gravables'], [13, 'Sujetos pasivos excluidos']];

const CLASE_CAMPO = 'block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm';
const CLASE_ETIQUETA = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1';

const dinero = (valor: number) => `${Number(valor) < 0 ? '-' : ''}$${Math.abs(Number(valor || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const mensajeDe = (err: any, alterno: string) => err.response?.data?.error || err.message || alterno;
const periodoActual = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' }).slice(0, 7);
const escapar = (texto: any) => String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const esNumero = (texto: string) => /^-?\d+\.\d{2}$/.test(texto);

const Selector: React.FC<{ id: string; etiqueta: string; valor: any; opciones: any[]; alCambiar: (v: number) => void }> = ({ id, etiqueta, valor, opciones, alCambiar }) => (
  <div>
    <label htmlFor={id} className={CLASE_ETIQUETA}>{etiqueta}</label>
    <select id={id} value={valor} onChange={e => alCambiar(Number(e.target.value))} className={CLASE_CAMPO}>
      {opciones.map(([codigo, texto]) => <option key={codigo} value={codigo}>{texto}</option>)}
    </select>
  </div>
);

const Linea: React.FC<{ texto: string; valor: number; fuerte?: boolean }> = ({ texto, valor, fuerte }) => (
  <div className={`flex justify-between gap-4 py-1.5 text-sm ${fuerte ? 'border-t border-gray-200 mt-1 pt-2.5 font-black text-gray-900' : 'text-gray-600'}`}>
    <span>{texto}</span>
    <span className="font-mono whitespace-nowrap">{dinero(valor)}</span>
  </div>
);

export const Contabilidad: React.FC = () => {
  const [periodo, setPeriodo] = useState(periodoActual);
  const [reporte, setReporte] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pestana, setPestana] = useState('resumen');
  const [ajustes, setAjustes] = useState({ remanenteIva: 0, excedentePagoCuenta: 0, ingresosConRetencion: 0 });
  const [guardado, setGuardado] = useState<string | null>(null);
  const [verConfiguracion, setVerConfiguracion] = useState(false);
  const [configuracion, setConfiguracion] = useState<any>(null);
  const [compraEditada, setCompraEditada] = useState<any>(null);

  const cargar = async (silencioso = false) => {
    if (!/^\d{4}-\d{2}$/.test(periodo)) return;
    try {
      if (!silencioso) setCargando(true);
      setError(null);
      const res = await obtenerReporteContable(periodo);
      setReporte(res);
      setConfiguracion(res.configuracion);
      setAjustes({
        remanenteIva: res.iva.remanenteAnterior,
        excedentePagoCuenta: res.pagoCuenta.excedenteAnterior,
        ingresosConRetencion: res.pagoCuenta.ingresosConRetencion
      });
    } catch (err: any) {
      setError(mensajeDe(err, 'No se pudo cargar la información contable'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [periodo]);

  const ejecutar = async (accion: () => Promise<any>, exito?: string) => {
    setError(null);
    setGuardado(null);
    try {
      await accion();
      if (exito) setGuardado(exito);
      return true;
    } catch (err: any) {
      setError(mensajeDe(err, 'No se pudo completar la operación'));
      return false;
    }
  };

  const guardarAjustes = async () => {
    if (await ejecutar(() => guardarAjustesContables(periodo, ajustes), 'Saldos guardados')) cargar(true);
  };

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await ejecutar(() => guardarConfiguracionContable(configuracion), 'Configuración guardada')) {
      setVerConfiguracion(false);
      cargar(true);
    }
  };

  const guardarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await ejecutar(() => guardarDatosCompra(compraEditada.id, compraEditada), 'Compra actualizada')) {
      setCompraEditada(null);
      cargar(true);
    }
  };

  const imprimir = (libro: any) => {
    const ventana = window.open('', '_blank');
    if (!ventana) {
      setError('El navegador bloqueó la ventana de impresión.');
      return;
    }
    const encabezados = libro.vista.map((i: number) => `<th>${escapar(libro.columnas[i])}</th>`).join('');
    const filas = libro.filas.map((f: any) => `<tr>${libro.vista.map((i: number) => `<td class="${esNumero(f.valores[i]) ? 'n' : ''}">${escapar(f.valores[i])}</td>`).join('')}</tr>`).join('');
    const totales = libro.totales.map((t: any) => `<strong>${escapar(t.etiqueta)}:</strong> ${escapar(dinero(t.valor))}`).join(' &nbsp; ');
    ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapar(libro.titulo)} ${escapar(periodo)}</title>
      <style>body{font:11px Arial,sans-serif;margin:24px}h1{font-size:15px;margin:0 0 4px}p{margin:2px 0}table{border-collapse:collapse;width:100%;margin-top:12px}th,td{border:1px solid #999;padding:3px 5px;text-align:left;word-break:break-word}th{background:#eee}td.n{text-align:right;white-space:nowrap}@page{size:landscape}</style></head>
      <body><h1>${escapar(libro.titulo)}</h1><p>${escapar(reporte.emisor.razonSocial)}</p><p>NIT: ${escapar(reporte.emisor.nit)} &nbsp; NRC: ${escapar(reporte.emisor.nrc)} &nbsp; Periodo: ${escapar(periodo)}</p>
      <table><thead><tr>${encabezados}</tr></thead><tbody>${filas}</tbody></table><p style="margin-top:10px">${totales}</p></body></html>`);
    ventana.document.close();
    ventana.focus();
    ventana.print();
  };

  const abrirCompra = (fila: any) => {
    const d = fila.datos;
    setCompraEditada({
      id: fila.compraId,
      nombre: fila.valores[5],
      fecha: d.fecha,
      gravada: d.gravada ?? 0,
      exenta: d.exenta ?? 0,
      iva: d.iva ?? 0,
      periodoIva: d.periodoIva || '',
      tipoOperacion: d.tipoOperacion,
      clasificacion: d.clasificacion,
      sector: d.sector,
      tipoCostoGasto: d.tipoCostoGasto
    });
  };

  const libroActivo = reporte?.libros.find((l: any) => l.clave === pestana);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Contabilidad</h1>
          <p className="text-gray-500 mt-1">Libros de IVA, anexos del F-07 y pago a cuenta del F-14</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="periodo-contable" className={CLASE_ETIQUETA}>Periodo</label>
            <input id="periodo-contable" type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} className={CLASE_CAMPO} />
          </div>
          <button
            onClick={() => setVerConfiguracion(true)}
            aria-label="Configuración contable"
            title="Configuración contable"
            className="p-2.5 border border-gray-300 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm text-red-700">{error}</div>}
      {guardado && <div role="status" className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded-lg text-sm text-green-800">{guardado}</div>}

      {reporte?.emisor.ambiente === '00' && (
        <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded-lg text-sm text-amber-800">
          Ambiente de pruebas: las ventas mostradas no tienen validez fiscal. No use estos archivos para declarar.
        </div>
      )}

      {cargando || !reporte ? (
        <div className="py-20 flex justify-center" role="status">
          {!error && <Loader2 className="h-10 w-10 text-primary-600 animate-spin" aria-label="Cargando" />}
        </div>
      ) : (
        <>
          <div className="flex gap-1 overflow-x-auto border-b border-gray-200 mb-6" role="tablist">
            {[{ clave: 'resumen', titulo: 'Resumen' }, ...reporte.libros].map((l: any) => (
              <button
                key={l.clave}
                role="tab"
                aria-selected={pestana === l.clave}
                onClick={() => setPestana(l.clave)}
                className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${pestana === l.clave ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                {l.titulo}{l.filas ? ` (${l.filas.length})` : ''}
              </button>
            ))}
          </div>

          {pestana === 'resumen' && (
            <div className="space-y-6">
              {reporte.advertencias.length > 0 && (
                <ul className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 space-y-1.5">
                  {reporte.advertencias.map((a: string) => (
                    <li key={a} className="flex items-start gap-2"><AlertTriangle size={15} className="shrink-0 mt-0.5" /> {a}</li>
                  ))}
                </ul>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white rounded-xl shadow-sm border border-gray-150 p-5">
                  <h2 className="font-bold text-gray-900 mb-3">IVA (F-07)</h2>
                  <Linea texto="Débito por ventas a contribuyentes" valor={reporte.iva.debitoContribuyentes} />
                  <Linea texto="Débito por ventas a consumidor final" valor={reporte.iva.debitoConsumidor} />
                  <Linea texto="Crédito fiscal de compras" valor={-reporte.iva.credito} />
                  <Linea texto="Remanente del mes anterior" valor={-reporte.iva.remanenteAnterior} />
                  <Linea texto="Retenciones y percepciones recibidas (162 y 163)" valor={-reporte.iva.montosRecibidosAplicados} />
                  <Linea texto="Retenciones y percepciones efectuadas (169, 170 y 172)" valor={reporte.iva.montosEfectuados} />
                  <Linea texto="Estimado a pagar" valor={reporte.iva.aPagar} fuerte />
                  <Linea texto="Remanente para el mes siguiente" valor={reporte.iva.remanenteSiguiente} />
                  {reporte.iva.excedenteRetenciones > 0 && <Linea texto="Retenciones sin aplicar" valor={reporte.iva.excedenteRetenciones} />}
                </section>

                <section className="bg-white rounded-xl shadow-sm border border-gray-150 p-5">
                  <h2 className="font-bold text-gray-900 mb-3">Pago a cuenta y retenciones (F-14)</h2>
                  <Linea texto="Ingresos brutos del mes, sin IVA" valor={reporte.pagoCuenta.ingresosBrutos} />
                  <Linea texto="Ingresos ya sujetos a retención" valor={-reporte.pagoCuenta.ingresosConRetencion} />
                  <Linea texto={`Pago a cuenta computado (${reporte.pagoCuenta.tasa}%)`} valor={reporte.pagoCuenta.computado} />
                  <Linea texto="Excedente del mes anterior" valor={-reporte.pagoCuenta.excedenteAnterior} />
                  <Linea texto="Retenciones de renta a sujetos excluidos" valor={reporte.pagoCuenta.retencionRenta} />
                  <Linea texto="Estimado a pagar" valor={reporte.pagoCuenta.aPagar} fuerte />
                  {reporte.pagoCuenta.excedenteSiguiente > 0 && <Linea texto="Excedente para el mes siguiente" valor={reporte.pagoCuenta.excedenteSiguiente} />}
                  <p className="mt-3 text-xs text-gray-500">No incluye planilla ni otras retenciones: súmelas antes de cargar el anexo, porque el F-14 se llena solo con ese archivo.</p>
                </section>
              </div>

              <section className="bg-white rounded-xl shadow-sm border border-gray-150 p-5">
                <h2 className="font-bold text-gray-900 mb-1">Saldos del periodo</h2>
                <p className="text-sm text-gray-500 mb-4">Tómelos de su declaración del mes anterior o de sus registros.</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  {([['remanenteIva', 'Remanente de crédito fiscal'], ['excedentePagoCuenta', 'Excedente de pago a cuenta'], ['ingresosConRetencion', 'Ingresos sujetos a retención']] as const).map(([campo, texto]) => (
                    <div key={campo}>
                      <label htmlFor={campo} className={CLASE_ETIQUETA}>{texto}</label>
                      <input id={campo} type="number" min="0" step="0.01" value={ajustes[campo]} onChange={e => setAjustes({ ...ajustes, [campo]: Number(e.target.value) })} className={`${CLASE_CAMPO} text-right font-mono`} />
                    </div>
                  ))}
                  <button onClick={guardarAjustes} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                    <Save size={16} /> Guardar saldos
                  </button>
                </div>
              </section>
            </div>
          )}

          {libroActivo && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-150">
              <div className="p-5 flex flex-col lg:flex-row justify-between gap-4 border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-gray-900 flex items-center gap-2"><BookOpen size={18} className="text-primary-600" /> {libroActivo.titulo}</h2>
                  <p className="text-xs text-gray-500 mt-1">{libroActivo.formulario} · Anexo {libroActivo.anexo}{libroActivo.casilla ? ` · Casilla ${libroActivo.casilla}` : ''}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => imprimir(libroActivo)} disabled={libroActivo.filas.length === 0} className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none transition-colors">
                    <Printer size={16} /> Imprimir
                  </button>
                  <button onClick={() => ejecutar(() => descargarAnexo(periodo, libroActivo.clave))} disabled={libroActivo.filas.length === 0} className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none transition-colors">
                    <Download size={16} /> Archivo CSV
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5 bg-gray-50/60 border-b border-gray-100">
                {libroActivo.totales.map((t: any) => (
                  <div key={t.etiqueta}>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.etiqueta}</div>
                    <div className="text-lg font-black text-gray-900 font-mono">{t.etiqueta === 'Documentos' ? t.valor : dinero(t.valor)}</div>
                  </div>
                ))}
              </div>

              {libroActivo.filas.length === 0 ? (
                <p className="py-16 text-center text-gray-500 font-semibold">No hay registros en este periodo.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {libroActivo.vista.map((i: number) => <th key={i} scope="col" className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{libroActivo.columnas[i]}</th>)}
                        {libroActivo.clave === 'compras' && <th scope="col" className="px-3 py-2"><span className="sr-only">Acciones</span></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {libroActivo.filas.map((fila: any, indice: number) => (
                        <tr key={indice} className={fila.alertas?.length ? 'bg-amber-50/60' : ''}>
                          {libroActivo.vista.map((i: number) => (
                            <td key={i} className={`px-3 py-2 ${esNumero(fila.valores[i]) ? 'text-right font-mono whitespace-nowrap' : 'text-gray-700 [overflow-wrap:anywhere] min-w-[7rem]'}`}>{fila.valores[i]}</td>
                          ))}
                          {libroActivo.clave === 'compras' && (
                            <td className="px-3 py-2 text-right">
                              <button onClick={() => abrirCompra(fila)} aria-label={`Editar compra de ${fila.valores[5]}`} title={fila.alertas?.join('. ') || 'Editar'} className="p-1.5 text-gray-400 hover:text-primary-700 rounded-lg hover:bg-gray-100 transition-colors">
                                {fila.alertas?.length ? <AlertTriangle size={16} className="text-amber-600" /> : <Pencil size={16} />}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {verConfiguracion && configuracion && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-configuracion">
          <form onSubmit={guardarConfiguracion} className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 id="titulo-configuracion" className="text-lg font-bold text-gray-900">Configuración contable</h3>
              <button type="button" onClick={() => setVerConfiguracion(false)} aria-label="Cerrar" className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500">Valores por defecto para clasificar ventas y compras. Pida a su contador que los confirme.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Selector id="c-ingreso" etiqueta="Tipo de ingreso (ventas)" valor={configuracion.tipoIngreso} opciones={TIPOS_INGRESO} alCambiar={v => setConfiguracion({ ...configuracion, tipoIngreso: v })} />
              <div>
                <label htmlFor="c-tasa" className={CLASE_ETIQUETA}>Tasa de pago a cuenta (%)</label>
                <input id="c-tasa" type="number" min="0" max="100" step="0.01" value={configuracion.tasaPagoCuenta} onChange={e => setConfiguracion({ ...configuracion, tasaPagoCuenta: Number(e.target.value) })} className={CLASE_CAMPO} />
              </div>
              <Selector id="c-operacion" etiqueta="Tipo de operación (compras)" valor={configuracion.tipoOperacion} opciones={TIPOS_OPERACION} alCambiar={v => setConfiguracion({ ...configuracion, tipoOperacion: v })} />
              <Selector id="c-clasificacion" etiqueta="Clasificación (compras)" valor={configuracion.clasificacion} opciones={CLASIFICACIONES} alCambiar={v => setConfiguracion({ ...configuracion, clasificacion: v })} />
              <Selector id="c-sector" etiqueta="Sector (compras)" valor={configuracion.sector} opciones={SECTORES} alCambiar={v => setConfiguracion({ ...configuracion, sector: v })} />
              <Selector id="c-costo" etiqueta="Tipo de costo o gasto (compras)" valor={configuracion.tipoCostoGasto} opciones={TIPOS_COSTO_GASTO} alCambiar={v => setConfiguracion({ ...configuracion, tipoCostoGasto: v })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setVerConfiguracion(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {compraEditada && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-compra">
          <form onSubmit={guardarCompra} className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center gap-4">
              <h3 id="titulo-compra" className="text-lg font-bold text-gray-900 break-words">{compraEditada.nombre}</h3>
              <button type="button" onClick={() => setCompraEditada(null)} aria-label="Cerrar" className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([['gravada', 'Gravado'], ['exenta', 'Exento y no sujeto'], ['iva', 'Crédito fiscal']] as const).map(([campo, texto]) => (
                <div key={campo}>
                  <label htmlFor={`e-${campo}`} className={CLASE_ETIQUETA}>{texto}</label>
                  <input id={`e-${campo}`} type="number" min="0" step="0.01" value={compraEditada[campo]} onChange={e => setCompraEditada({ ...compraEditada, [campo]: Number(e.target.value) })} className={`${CLASE_CAMPO} text-right font-mono`} />
                </div>
              ))}
            </div>
            <div>
              <label htmlFor="e-periodo" className={CLASE_ETIQUETA}>Declarar en el periodo</label>
              <input id="e-periodo" type="month" value={compraEditada.periodoIva} onChange={e => setCompraEditada({ ...compraEditada, periodoIva: e.target.value })} className={CLASE_CAMPO} />
              <p className="text-xs text-gray-500 mt-1">Vacío: el mes de la fecha del documento ({compraEditada.fecha}). Admite hasta los tres meses siguientes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Selector id="e-operacion" etiqueta="Tipo de operación" valor={compraEditada.tipoOperacion} opciones={TIPOS_OPERACION} alCambiar={v => setCompraEditada({ ...compraEditada, tipoOperacion: v })} />
              <Selector id="e-clasificacion" etiqueta="Clasificación" valor={compraEditada.clasificacion} opciones={CLASIFICACIONES} alCambiar={v => setCompraEditada({ ...compraEditada, clasificacion: v })} />
              <Selector id="e-sector" etiqueta="Sector" valor={compraEditada.sector} opciones={SECTORES} alCambiar={v => setCompraEditada({ ...compraEditada, sector: v })} />
              <Selector id="e-costo" etiqueta="Tipo de costo o gasto" valor={compraEditada.tipoCostoGasto} opciones={TIPOS_COSTO_GASTO} alCambiar={v => setCompraEditada({ ...compraEditada, tipoCostoGasto: v })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCompraEditada(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

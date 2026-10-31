// src/pages/PruebasHacienda.tsx
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ClipboardCheck, Loader2, Play, Square } from 'lucide-react';
import { api } from '../services/api';
import {
  ContextoPrueba, EstadoTipo, facturaPrueba, leerEstadoPortal, NOTAS_REQUIEREN_CCF, TIPOS_NO_DISPONIBLES, TIPOS_PRUEBA, TipoPrueba
} from '../utils/pruebasHacienda';

const MAX_RECHAZOS_SEGUIDOS = 3;
const espera = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const ahora = () => {
  const d = new Date();
  return {
    fecha: d.toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' }),
    hora: d.toLocaleTimeString('en-GB', { timeZone: 'America/El_Salvador', hour12: false })
  };
};

const motivoDe = (dato: any) => {
  const obs = dato?.resultado?.observaciones;
  const detalle = Array.isArray(obs) && obs.length ? ` (${obs.join('; ')})` : '';
  return `${dato?.error || dato?.resultado?.descripcionMsg || 'Rechazado'}${detalle}`;
};

const aceptado = (dato: any) => dato?.success && (dato.selloRecibido || dato.resultado?.estado === 'PROCESADO');

export const PruebasHacienda: React.FC = () => {
  const [emisor, setEmisor] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [estado, setEstado] = useState<Record<string, EstadoTipo>>({});
  const [textoPortal, setTextoPortal] = useState('');
  const [enCurso, setEnCurso] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Record<string, string>>({});
  const [resumen, setResumen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const detener = useRef(false);
  const ccfRecientes = useRef<{ codigo: string; fecha: string }[]>([]);
  const numero = useRef(Date.now() % 100000);

  const claveGuardado = (nit: string) => `pruebasHacienda:${nit}`;

  useEffect(() => {
    (async () => {
      try {
        const [yo, lista] = await Promise.all([api.get('/auth/me'), api.get('/clientes')]);
        const datos = yo.data.emisor;
        setEmisor(datos);
        const aptos = (lista.data.clientes || []).filter((c: any) => c.nrc && c.cod_actividad && !/^PRUEBA/i.test(c.nombre));
        setClientes(aptos);
        setClienteId(aptos[0]?.id ?? null);
        try {
          setEstado(JSON.parse(localStorage.getItem(claveGuardado(datos.nit)) || '{}'));
        } catch {
          setEstado({});
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'No se pudo cargar la información');
      }
    })();
  }, []);

  const actualizarEstado = (cambio: (previo: Record<string, EstadoTipo>) => Record<string, EstadoTipo>) => {
    setEstado(previo => {
      const nuevo = cambio(previo);
      try {
        if (emisor) localStorage.setItem(claveGuardado(emisor.nit), JSON.stringify(nuevo));
      } catch {
        // Sin almacenamiento el avance sigue visible; al recargar se pega de nuevo el estado del portal
      }
      return nuevo;
    });
  };

  const sumar = (clave: string) => actualizarEstado(previo => ({
    ...previo,
    [clave]: { ...previo[clave], completadas: (previo[clave]?.completadas || 0) + 1 }
  }));

  const contexto = (): ContextoPrueba => ({
    hoy: ahora().fecha,
    numero: ++numero.current,
    cliente: clientes.find(c => c.id === clienteId),
    correo: emisor.correo,
    ccf: ccfRecientes.current.length ? ccfRecientes.current[numero.current % ccfRecientes.current.length] : null
  });

  const enviar = async (ruta: string, cuerpo: any) => {
    try {
      return (await api.post(`/${ruta}`, { ...cuerpo, soloPruebas: true })).data;
    } catch (err: any) {
      return err.response?.data || { success: false, error: err.message };
    }
  };

  const emitirCcf = async (tipo: TipoPrueba) => {
    const dato = await enviar('ccf', tipo.cuerpo!(contexto()));
    if (aceptado(dato)) {
      ccfRecientes.current.push({ codigo: dato.codigoGeneracion, fecha: ahora().fecha });
      sumar('ccf');
    }
    return dato;
  };

  // Una invalidación necesita un documento vigente recién emitido, que también suma como factura
  const invalidacion = async () => {
    const c = contexto();
    const factura = await enviar('factura', facturaPrueba(c, 'INVALIDACION'));
    if (!aceptado(factura)) return factura;
    sumar('factura');
    const dato = await enviar('evento-invalidacion', {
      codigoGeneracion: factura.codigoGeneracion,
      tipoAnulacion: 2,
      motivoAnulacion: 'PRUEBA SIN VALOR',
      nombreResponsable: 'PRUEBA SIN VALOR', tipDocResponsable: '36', numDocResponsable: emisor.nit,
      nombreSolicita: 'PRUEBA SIN VALOR', tipDocSolicita: '36', numDocSolicita: emisor.nit
    });
    return { ...dato, success: dato.success && (dato.estado === 'PROCESADO' || dato.resultado?.estado === 'PROCESADO'), selloRecibido: dato.selloRecibido };
  };

  // Hacienda exige que el documento quede dentro del periodo del evento y que este termine antes de enviarlo
  const contingencia = async () => {
    const inicio = ahora();
    await espera(2000);
    const contingenciaDoc = { tipoContingencia: 1, motivoContin: null };
    const factura = await enviar('factura', { ...facturaPrueba(contexto(), 'CONTINGENCIA'), contingencia: contingenciaDoc });
    if (!factura.success) return factura;
    await espera(3000);
    const fin = ahora();
    await espera(2000);
    const evento = await enviar('evento-contingencia', {
      fInicio: inicio.fecha, hInicio: inicio.hora, fFin: fin.fecha, hFin: fin.hora,
      tipoContingencia: 1, motivoContingencia: null,
      nombreResponsable: 'PRUEBA SIN VALOR', tipoDocResponsable: '36', numeroDocResponsable: emisor.nit, tipoEstablecimiento: '02'
    });
    const recibido = evento.estado === 'RECIBIDO' || evento.resultado?.estado === 'RECIBIDO';
    if (!evento.success || !recibido) return { ...evento, success: false };
    const transmision = await enviar('contingencia/transmitir', {});
    const resultados = transmision.resultados || [];
    if (resultados.some((r: any) => r.estado === 'PROCESADO')) sumar('factura');
    else return { success: false, error: resultados[0]?.mensaje || 'La factura de contingencia no se procesó' };
    return { success: true, selloRecibido: evento.selloRecibido || 'RECIBIDO' };
  };

  const correrTipo = async (tipo: TipoPrueba) => {
    let faltan = Math.max((estado[tipo.clave]?.meta || 0) - (estado[tipo.clave]?.completadas || 0), 0);
    let rechazos = 0;
    let enviados = 0;
    setEnCurso(tipo.clave);
    setMensajes(previo => ({ ...previo, [tipo.clave]: '' }));

    if (NOTAS_REQUIEREN_CCF.includes(tipo.clave) && ccfRecientes.current.length === 0) {
      const ccf = TIPOS_PRUEBA.find(t => t.clave === 'ccf')!;
      const dato = await emitirCcf(ccf);
      if (!aceptado(dato)) {
        setMensajes(previo => ({ ...previo, [tipo.clave]: `No se pudo emitir el crédito fiscal base: ${motivoDe(dato)}` }));
        return 0;
      }
    }

    while (faltan > 0 && !detener.current && rechazos < MAX_RECHAZOS_SEGUIDOS) {
      let dato: any;
      if (tipo.clave === 'invalidacion') dato = await invalidacion();
      else if (tipo.clave === 'contingencia') dato = await contingencia();
      else if (tipo.clave === 'ccf') dato = await emitirCcf(tipo);
      else dato = await enviar(tipo.ruta!, tipo.cuerpo!(contexto()));

      if (aceptado(dato)) {
        rechazos = 0;
        faltan--;
        enviados++;
        if (tipo.clave !== 'ccf') sumar(tipo.clave);
      } else {
        rechazos++;
        setMensajes(previo => ({ ...previo, [tipo.clave]: motivoDe(dato) }));
      }
    }
    if (rechazos >= MAX_RECHAZOS_SEGUIDOS) {
      setMensajes(previo => ({ ...previo, [tipo.clave]: `Detenido tras ${MAX_RECHAZOS_SEGUIDOS} rechazos seguidos. ${previo[tipo.clave]}` }));
    }
    return enviados;
  };

  const correr = async (tipos: TipoPrueba[]) => {
    detener.current = false;
    setResumen(null);
    setError(null);
    let total = 0;
    for (const tipo of tipos) {
      if (detener.current) break;
      total += await correrTipo(tipo);
    }
    setEnCurso(null);
    setResumen(`${detener.current ? 'Detenido' : 'Terminado'}: ${total} pruebas aceptadas por Hacienda en esta corrida.`);
  };

  const aplicarPortal = () => {
    const leido = leerEstadoPortal(textoPortal);
    if (Object.keys(leido).length === 0) {
      setError('No se encontró el avance en el texto. Copie la lista del portal, por ejemplo: Factura (39/90).');
      return;
    }
    setError(null);
    actualizarEstado(() => leido);
    setTextoPortal('');
  };

  if (error && !emisor) return <div className="max-w-5xl mx-auto p-6"><div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm text-red-700">{error}</div></div>;
  if (!emisor) return <div className="py-20 flex justify-center" role="status"><Loader2 className="h-10 w-10 text-primary-600 animate-spin" aria-label="Cargando" /></div>;

  if (emisor.ambiente !== '00') {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg text-sm text-amber-800">Esta pantalla solo funciona en el ambiente de pruebas (00).</div>
      </div>
    );
  }

  const disponibles = TIPOS_PRUEBA.filter(t => !TIPOS_NO_DISPONIBLES.includes(t.clave) && estado[t.clave]);
  const pendientes = disponibles.filter(t => estado[t.clave].completadas < estado[t.clave].meta);
  const clienteListo = clienteId !== null;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3"><ClipboardCheck className="text-primary-600" /> Pruebas Hacienda</h1>
        <p className="text-gray-500 mt-1">Completa las pruebas que exige Hacienda para autorizar la emisión. Solo ambiente 00, sin enviar correos.</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm text-red-700">{error}</div>}
      {resumen && <div role="status" data-testid="resumen-pruebas" className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded-lg text-sm text-green-800">{resumen} Compare el avance con el portal de Hacienda.</div>}

      <section className="bg-white rounded-xl shadow-sm border border-gray-150 p-5 mb-6 space-y-4">
        <div>
          <label htmlFor="estado-portal" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Estado copiado del portal de Hacienda</label>
          <textarea
            id="estado-portal"
            rows={4}
            value={textoPortal}
            onChange={e => setTextoPortal(e.target.value)}
            placeholder={'Factura (39/90)\nComprobante de Crédito Fiscal (21/75)'}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm font-mono"
          />
          <button onClick={aplicarPortal} disabled={!!enCurso || !textoPortal.trim()} className="mt-2 bg-primary-50 hover:bg-primary-100 text-primary-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none">
            Cargar estado
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <label htmlFor="cliente-prueba" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cliente para los documentos de prueba</label>
            <select id="cliente-prueba" value={clienteId ?? ''} onChange={e => setClienteId(Number(e.target.value))} disabled={!!enCurso} className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {clientes.length === 0 && <option value="">Registre un cliente con NRC y actividad</option>}
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          {enCurso ? (
            <button onClick={() => { detener.current = true; }} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
              <Square size={16} /> Detener
            </button>
          ) : (
            <button onClick={() => correr(pendientes)} disabled={pendientes.length === 0 || !clienteListo} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:pointer-events-none">
              <Play size={16} /> Completar pendientes
            </button>
          )}
        </div>
        {enCurso && (
          <p className="flex items-center gap-2 text-sm text-amber-800"><AlertTriangle size={16} className="shrink-0" /> No cierre ni recargue esta página mientras se envía; si lo hace, la corrida se detiene sin dañar nada.</p>
        )}
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-150 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Documento', 'Completadas', 'Faltan', 'Avance', ''].map(t => <th key={t} scope="col" className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{t}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {TIPOS_PRUEBA.filter(t => estado[t.clave]).map(tipo => {
              const e = estado[tipo.clave];
              const faltan = Math.max(e.meta - e.completadas, 0);
              const avance = e.meta ? Math.min(Math.round((e.completadas / e.meta) * 100), 100) : 0;
              const noDisponible = TIPOS_NO_DISPONIBLES.includes(tipo.clave);
              return (
                <tr key={tipo.clave} data-tipo={tipo.clave}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-900">{tipo.nombre}</div>
                    {mensajes[tipo.clave] && <div className="text-xs text-red-700 mt-0.5 break-words max-w-xl">{mensajes[tipo.clave]}</div>}
                  </td>
                  <td className="px-4 py-2.5 font-mono whitespace-nowrap">{e.completadas} / {e.meta}</td>
                  <td className="px-4 py-2.5 font-mono">{faltan}</td>
                  <td className="px-4 py-2.5 min-w-[9rem]">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={avance} aria-valuemin={0} aria-valuemax={100} aria-label={`Avance de ${tipo.nombre}`}>
                      <div className="h-full bg-primary-600" style={{ width: `${avance}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {noDisponible ? (
                      <span className="text-xs text-gray-500">Aún no disponible</span>
                    ) : enCurso === tipo.clave ? (
                      <Loader2 size={16} className="animate-spin text-primary-600 inline" aria-label="Enviando" />
                    ) : (
                      <button onClick={() => correr([tipo])} disabled={!!enCurso || faltan === 0 || !clienteListo} className="text-xs font-semibold text-primary-700 hover:underline disabled:opacity-40 disabled:no-underline disabled:pointer-events-none">
                        Enviar faltantes
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {Object.keys(estado).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Pegue el estado del portal para ver qué falta.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

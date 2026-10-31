// src/pages/Empresas.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Building2, CheckCircle, CheckSquare, FileKey, Loader2, Mail, Pencil,
  Plus, Search, ShieldCheck, Square, X, XCircle
} from 'lucide-react';
import { Toast } from '../components/Common/Toast';
import { DireccionSelects } from '../components/Forms/DireccionSelects';
import {
  actualizarEmpresa, crearEmpresa, Empresa, invitarEmpresa, listarEmpresas,
  subirCertificado, Verificacion, verificarEmpresa
} from '../services/empresas.service';

const DOCUMENTOS = [
  { code: '01', name: 'Factura' },
  { code: '03', name: 'Crédito Fiscal' },
  { code: '04', name: 'Nota de Remisión' },
  { code: '05', name: 'Nota de Crédito' },
  { code: '06', name: 'Nota de Débito' },
  { code: '07', name: 'Comprobante de Retención' },
  { code: '08', name: 'Comprobante de Liquidación' },
  { code: '09', name: 'Documento Contable de Liquidación' },
  { code: '11', name: 'Factura de Exportación' },
  { code: '14', name: 'Factura de Sujeto Excluido' },
  { code: '15', name: 'Comprobante de Donación' }
];

const FORMULARIO_VACIO = {
  nit: '', nrc: '', razonSocial: '', nombreComercial: '', codActividad: '', descActividad: '',
  telefono: '', correo: '', codEstablecimientoMh: '', codPuntoVentaMh: '',
  departamento: '', municipio: '', distrito: '', complemento: '',
  pwdMh: '', pwdFirmador: '', dtesVisibles: ['01', '03'] as string[]
};

const CAMPO = 'w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary-500 focus:bg-white transition-colors disabled:bg-gray-100 disabled:text-gray-500';
const ETIQUETA = 'block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2';

const errorDe = (err: any, alterno: string) => err.response?.data?.error || alterno;

export const Empresas: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [toast, setToast] = useState<any>(null);

  const [abierta, setAbierta] = useState(false);
  const [editando, setEditando] = useState<Empresa | null>(null);
  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [invitar, setInvitar] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const [certEmpresa, setCertEmpresa] = useState<Empresa | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [claveCert, setClaveCert] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [errorCert, setErrorCert] = useState<string | null>(null);

  const [ocupada, setOcupada] = useState<number | null>(null);
  const [verificaciones, setVerificaciones] = useState<Record<number, Verificacion>>({});

  const cargar = async () => {
    try {
      setEmpresas(await listarEmpresas());
    } catch (err: any) {
      setToast({ type: 'error', message: errorDe(err, 'No se pudieron cargar las empresas') });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return empresas;
    return empresas.filter(e => [e.razonSocial, e.nombreComercial, e.nit, e.correo].some(v => (v || '').toLowerCase().includes(q)));
  }, [empresas, busqueda]);

  const cambiar = (campo: keyof typeof FORMULARIO_VACIO, valor: any) => setForm(f => ({ ...f, [campo]: valor }));

  const abrirNueva = () => {
    setEditando(null);
    setForm(FORMULARIO_VACIO);
    setInvitar(true);
    setErrorForm(null);
    setAbierta(true);
  };

  const abrirEdicion = (e: Empresa) => {
    setEditando(e);
    setForm({
      nit: e.nit,
      nrc: e.nrc || '',
      razonSocial: e.razonSocial || '',
      nombreComercial: e.nombreComercial || '',
      codActividad: e.codActividad || '',
      descActividad: e.descActividad || '',
      telefono: e.telefono || '',
      correo: e.correo || '',
      codEstablecimientoMh: e.codEstablecimientoMh || '',
      codPuntoVentaMh: e.codPuntoVentaMh || '',
      departamento: e.direccion?.departamento || '',
      municipio: e.direccion?.municipio || '',
      distrito: e.direccion?.distrito || '',
      complemento: e.direccion?.complemento || '',
      pwdMh: '',
      pwdFirmador: '',
      dtesVisibles: e.dtesVisibles
    });
    setErrorForm(null);
    setAbierta(true);
  };

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setGuardando(true);
    setErrorForm(null);
    const { departamento, municipio, distrito, complemento, nit, ...resto } = form;
    const datos = { ...resto, direccion: { departamento, municipio, distrito, complemento } };
    try {
      if (editando) {
        await actualizarEmpresa(editando.id, datos);
        setToast({ type: 'success', message: 'Empresa actualizada' });
      } else {
        const creada = await crearEmpresa({ ...datos, nit });
        let mensaje = 'Empresa creada en ambiente de pruebas. Falta cargar su certificado.';
        let tipo = 'success';
        if (invitar) {
          try {
            await invitarEmpresa(creada.id);
            mensaje = `Empresa creada. Se envió el acceso a ${creada.correo}. Falta cargar su certificado.`;
          } catch {
            mensaje = 'Empresa creada, pero no se pudo enviar el acceso. Use "Enviar acceso".';
            tipo = 'warning';
          }
        }
        setToast({ type: tipo, message: mensaje });
      }
      setAbierta(false);
      await cargar();
    } catch (err: any) {
      setErrorForm(errorDe(err, 'No se pudo guardar la empresa'));
    } finally {
      setGuardando(false);
    }
  };

  const abrirCertificado = (e: Empresa) => {
    setCertEmpresa(e);
    setArchivo(null);
    setClaveCert('');
    setErrorCert(null);
  };

  const guardarCertificado = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!certEmpresa || !archivo) return;
    setSubiendo(true);
    setErrorCert(null);
    try {
      await subirCertificado(certEmpresa.id, await archivo.text(), claveCert);
      setToast({ type: 'success', message: 'Certificado guardado. El firmador lo tendrá en menos de un minuto.' });
      setCertEmpresa(null);
      await cargar();
    } catch (err: any) {
      setErrorCert(errorDe(err, 'No se pudo guardar el certificado'));
    } finally {
      setSubiendo(false);
    }
  };

  const conEmpresa = async (id: number, accion: () => Promise<void>) => {
    setOcupada(id);
    try {
      await accion();
    } catch (err: any) {
      setToast({ type: 'error', message: errorDe(err, 'No se pudo completar la operación') });
    } finally {
      setOcupada(null);
    }
  };

  const verificar = (e: Empresa) => conEmpresa(e.id, async () => {
    const resultado = await verificarEmpresa(e.id);
    setVerificaciones(v => ({ ...v, [e.id]: resultado }));
  });

  const enviarAcceso = (e: Empresa) => {
    const accion = e.cuentaActivada ? 'un enlace para cambiar su contraseña' : 'la invitación para crear su contraseña';
    if (!window.confirm(`Se enviará ${accion} a ${e.correo}. ¿Continuar?`)) return;
    conEmpresa(e.id, async () => {
      const { correo } = await invitarEmpresa(e.id);
      setToast({ type: 'success', message: `Correo enviado a ${correo}` });
    });
  };

  const cambiarEstado = (e: Empresa) => {
    const texto = e.activo
      ? `¿Suspender a ${e.razonSocial}? No podrá ingresar ni emitir hasta reactivarla.`
      : `¿Reactivar a ${e.razonSocial}?`;
    if (!window.confirm(texto)) return;
    conEmpresa(e.id, async () => {
      await actualizarEmpresa(e.id, { activo: !e.activo });
      await cargar();
    });
  };

  const cambiarAmbiente = (e: Empresa) => {
    const aProduccion = e.ambiente !== '01';
    const texto = aProduccion
      ? `¿Pasar a ${e.razonSocial} a PRODUCCIÓN?\n\nCada documento que emita tendrá validez fiscal. Antes confirme que Hacienda la autorizó, que cargó el certificado y la contraseña de producción, y que los documentos marcados coinciden con su resolución.`
      : `¿Devolver a ${e.razonSocial} a PRUEBAS?\n\nDejará de emitir documentos con validez fiscal.`;
    if (!window.confirm(texto)) return;
    conEmpresa(e.id, async () => {
      await actualizarEmpresa(e.id, { ambiente: aProduccion ? '01' : '00', confirmarAmbiente: true });
      setToast({ type: 'success', message: aProduccion ? 'La empresa ya está en producción' : 'La empresa volvió a pruebas' });
      await cargar();
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Empresas</h1>
          <p className="text-gray-500 mt-1">Cada empresa tiene su acceso, certificado, ambiente y documentos autorizados.</p>
        </div>
        <button type="button" onClick={abrirNueva} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium shadow-sm shrink-0">
          <Plus size={18} /> Nueva empresa
        </button>
      </div>

      <div className="relative mb-5">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary-500"
          placeholder="Buscar por nombre, NIT o correo"
          aria-label="Buscar empresa"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {cargando ? (
        <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
      ) : visibles.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl py-14 text-center">
          <Building2 className="mx-auto text-gray-300 mb-3" size={36} />
          <p className="text-gray-500 font-medium">{busqueda ? 'Ninguna empresa coincide con la búsqueda.' : 'Todavía no hay empresas.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibles.map(e => {
            const v = verificaciones[e.id];
            const ocupadaEsta = ocupada === e.id;
            return (
              <article key={e.id} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between gap-3 items-start">
                  <div className="min-w-0">
                    <h2 className="font-bold text-gray-900 [overflow-wrap:anywhere]">{e.nombreComercial || e.razonSocial}</h2>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">NIT {e.nit}{e.nrc ? ` · NRC ${e.nrc}` : ''}</p>
                    <p className="text-xs text-gray-500 mt-0.5 [overflow-wrap:anywhere]">{e.correo}</p>
                  </div>
                  <button type="button" onClick={() => abrirEdicion(e)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg shrink-0" aria-label={`Editar ${e.razonSocial}`}>
                    <Pencil size={16} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  <span className={`px-2 py-0.5 rounded-full ${e.ambiente === '01' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{e.ambiente === '01' ? 'Producción' : 'Pruebas'}</span>
                  {!e.activo && <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700">Suspendida</span>}
                  {e.esAdmin && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Administradora</span>}
                  {!e.cuentaActivada && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Sin contraseña</span>}
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{e.dtesVisibles.length} documentos</span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{(e.documentos['01'] || 0) + (e.documentos['00'] || 0)} emitidos</span>
                </div>

                <p className="text-xs text-gray-600">
                  {e.certificado
                    ? <>Certificado cargado{e.certificado.venceAt ? `, vence el ${new Date(e.certificado.venceAt).toLocaleDateString('es-SV')}` : ''}.</>
                    : e.esAdmin ? 'Certificado por variable del firmador.' : <span className="text-amber-700 font-medium">Falta el certificado.</span>}
                </p>

                {v && (
                  <div className="text-xs space-y-1.5 bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <p className="font-bold text-gray-700">Verificación en {v.ambiente === '01' ? 'producción' : 'pruebas'}</p>
                    {[v.firma, v.hacienda].map((r, i) => (
                      <p key={i} className={`flex items-start gap-1.5 ${r.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                        {r.ok ? <CheckCircle size={14} className="shrink-0 mt-px" /> : <XCircle size={14} className="shrink-0 mt-px" />}
                        <span className="[overflow-wrap:anywhere]">{r.mensaje}</span>
                      </p>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-auto pt-1">
                  <button type="button" onClick={() => abrirCertificado(e)} className="flex items-center justify-center gap-1.5 text-xs font-bold px-2 py-2.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100">
                    <FileKey size={14} /> Certificado
                  </button>
                  <button type="button" disabled={ocupadaEsta} onClick={() => verificar(e)} className="flex items-center justify-center gap-1.5 text-xs font-bold px-2 py-2.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 disabled:opacity-60">
                    {ocupadaEsta ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Verificar
                  </button>
                  <button type="button" disabled={ocupadaEsta || !e.activo} onClick={() => enviarAcceso(e)} className="flex items-center justify-center gap-1.5 text-xs font-bold px-2 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60">
                    <Mail size={14} /> Enviar acceso
                  </button>
                  <button type="button" disabled={ocupadaEsta} onClick={() => cambiarAmbiente(e)} className="text-xs font-bold px-2 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60">
                    {e.ambiente === '01' ? 'Volver a pruebas' : 'Pasar a producción'}
                  </button>
                  {!e.esAdmin && (
                    <button type="button" disabled={ocupadaEsta} onClick={() => cambiarEstado(e)} className={`col-span-2 text-xs font-bold px-2 py-2.5 rounded-lg disabled:opacity-60 ${e.activo ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                      {e.activo ? 'Suspender' : 'Reactivar'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {abierta && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 overflow-y-auto sm:p-4 flex sm:items-start justify-center">
          <form onSubmit={guardar} className="bg-white w-full sm:max-w-3xl min-h-full sm:min-h-0 sm:rounded-2xl shadow-xl flex flex-col">
            <div className="sticky top-0 z-10 bg-white px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center sm:rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">{editando ? 'Editar empresa' : 'Nueva empresa'}</h2>
              <button type="button" onClick={() => setAbierta(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" aria-label="Cerrar"><X size={20} /></button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 flex-1">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="e-nit" className={ETIQUETA}>NIT</label>
                  <input id="e-nit" className={`${CAMPO} font-mono`} value={form.nit} onChange={e => cambiar('nit', e.target.value)} disabled={!!editando} required placeholder="14 dígitos, sin guiones" inputMode="numeric" />
                </div>
                <div>
                  <label htmlFor="e-nrc" className={ETIQUETA}>NRC</label>
                  <input id="e-nrc" className={`${CAMPO} font-mono`} value={form.nrc} onChange={e => cambiar('nrc', e.target.value)} required />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="e-razon" className={ETIQUETA}>Razón social (como en Hacienda)</label>
                  <input id="e-razon" className={CAMPO} value={form.razonSocial} onChange={e => cambiar('razonSocial', e.target.value)} required maxLength={150} />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="e-comercial" className={ETIQUETA}>Nombre comercial</label>
                  <input id="e-comercial" className={CAMPO} value={form.nombreComercial} onChange={e => cambiar('nombreComercial', e.target.value)} maxLength={150} />
                </div>
                <div>
                  <label htmlFor="e-cod" className={ETIQUETA}>Código de actividad</label>
                  <input id="e-cod" className={`${CAMPO} font-mono`} value={form.codActividad} onChange={e => cambiar('codActividad', e.target.value)} required maxLength={6} />
                </div>
                <div>
                  <label htmlFor="e-desc" className={ETIQUETA}>Descripción de actividad</label>
                  <input id="e-desc" className={CAMPO} value={form.descActividad} onChange={e => cambiar('descActividad', e.target.value)} required maxLength={150} />
                </div>
                <div>
                  <label htmlFor="e-correo" className={ETIQUETA}>Correo de acceso</label>
                  <input id="e-correo" type="email" className={CAMPO} value={form.correo} onChange={e => cambiar('correo', e.target.value)} required maxLength={100} />
                </div>
                <div>
                  <label htmlFor="e-tel" className={ETIQUETA}>Teléfono</label>
                  <input id="e-tel" className={CAMPO} value={form.telefono} onChange={e => cambiar('telefono', e.target.value)} required maxLength={20} />
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-5">
                <DireccionSelects
                  valor={{ departamento: form.departamento, municipio: form.municipio, distrito: form.distrito }}
                  requerido
                  claseEtiqueta={ETIQUETA}
                  claseCampo={CAMPO}
                  onChange={c => setForm(f => ({ ...f, ...c }))}
                />
                <div className="md:col-span-2">
                  <label htmlFor="e-comp" className={ETIQUETA}>Complemento de dirección</label>
                  <input id="e-comp" className={CAMPO} value={form.complemento} onChange={e => cambiar('complemento', e.target.value)} required />
                </div>
              </section>

              <section className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
                <div>
                  <label htmlFor="e-est" className={ETIQUETA}>Establecimiento MH</label>
                  <input id="e-est" className={`${CAMPO} font-mono text-center`} value={form.codEstablecimientoMh} onChange={e => cambiar('codEstablecimientoMh', e.target.value)} required maxLength={4} placeholder="M001" />
                </div>
                <div>
                  <label htmlFor="e-pv" className={ETIQUETA}>Punto de venta MH</label>
                  <input id="e-pv" className={`${CAMPO} font-mono text-center`} value={form.codPuntoVentaMh} onChange={e => cambiar('codPuntoVentaMh', e.target.value)} required maxLength={4} placeholder="P001" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="e-pwdmh" className={ETIQUETA}>Contraseña API Hacienda</label>
                  <input id="e-pwdmh" type="password" autoComplete="new-password" className={CAMPO} value={form.pwdMh} onChange={e => cambiar('pwdMh', e.target.value)} placeholder={editando?.tienePwdMh ? 'Déjela vacía para no cambiarla' : ''} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label htmlFor="e-pwdf" className={ETIQUETA}>Contraseña llave privada</label>
                  <input id="e-pwdf" type="password" autoComplete="new-password" className={CAMPO} value={form.pwdFirmador} onChange={e => cambiar('pwdFirmador', e.target.value)} placeholder={editando?.tienePwdFirmador ? 'Déjela vacía para no cambiarla' : ''} />
                </div>
              </section>

              <section className="border-t border-gray-100 pt-5">
                <h3 className={ETIQUETA}>Documentos autorizados por Hacienda</h3>
                <p className="text-xs text-gray-500 mb-3">Solo estos aparecen en el menú de la empresa y, en producción, solo estos se pueden emitir.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {DOCUMENTOS.map(d => {
                    const marcado = form.dtesVisibles.includes(d.code);
                    return (
                      <button
                        type="button"
                        key={d.code}
                        aria-pressed={marcado}
                        onClick={() => cambiar('dtesVisibles', marcado ? form.dtesVisibles.filter(c => c !== d.code) : [...form.dtesVisibles, d.code])}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left text-xs ${marcado ? 'bg-primary-50 border-primary-200 text-primary-900 font-semibold' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                      >
                        {marcado ? <CheckSquare size={18} className="text-primary-600 shrink-0" /> : <Square size={18} className="text-gray-400 shrink-0" />}
                        {d.name} ({d.code})
                      </button>
                    );
                  })}
                </div>
              </section>

              {!editando && (
                <label className="flex items-start gap-3 text-sm text-gray-700 border-t border-gray-100 pt-5">
                  <input type="checkbox" className="mt-0.5 h-4 w-4" checked={invitar} onChange={e => setInvitar(e.target.checked)} />
                  <span>Enviar al correo de acceso una invitación para que cree su contraseña.</span>
                </label>
              )}

              {errorForm && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> {errorForm}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white px-4 sm:px-6 py-4 border-t border-gray-100 flex gap-3 justify-end sm:rounded-b-2xl">
              <button type="button" onClick={() => setAbierta(false)} className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium">Cancelar</button>
              <button type="submit" disabled={guardando} className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium flex items-center justify-center gap-2">
                {guardando && <Loader2 size={16} className="animate-spin" />}
                {editando ? 'Guardar' : 'Crear empresa'}
              </button>
            </div>
          </form>
        </div>
      )}

      {certEmpresa && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 overflow-y-auto p-4 flex items-center justify-center">
          <form onSubmit={guardarCertificado} className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">Certificado de Hacienda</h2>
                <p className="text-xs text-gray-500 [overflow-wrap:anywhere]">{certEmpresa.razonSocial}</p>
              </div>
              <button type="button" onClick={() => setCertEmpresa(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg shrink-0" aria-label="Cerrar"><X size={20} /></button>
            </div>
            {certEmpresa.certificado && (
              <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">Ya tiene un certificado cargado. Al guardar se reemplaza y, si cambia de ambiente, también debe actualizar la contraseña de la API.</p>
            )}
            <div>
              <label htmlFor="c-archivo" className={ETIQUETA}>Archivo .crt</label>
              <input id="c-archivo" type="file" accept=".crt,.xml" required className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 file:font-bold" onChange={e => setArchivo(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label htmlFor="c-clave" className={ETIQUETA}>Contraseña de la llave privada</label>
              <input id="c-clave" type="password" autoComplete="new-password" className={CAMPO} value={claveCert} onChange={e => setClaveCert(e.target.value)} placeholder={certEmpresa.tienePwdFirmador ? 'Vacía para usar la guardada' : ''} required={!certEmpresa.tienePwdFirmador} />
            </div>
            <p className="text-xs text-gray-500">El certificado se guarda cifrado. Se comprueban el NIT, el vencimiento y la contraseña antes de aceptarlo.</p>
            {errorCert && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> {errorCert}
              </div>
            )}
            <button type="submit" disabled={subiendo || !archivo} className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium flex items-center justify-center gap-2">
              {subiendo && <Loader2 size={16} className="animate-spin" />}
              Guardar certificado
            </button>
          </form>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

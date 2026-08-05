import React, { useState, useEffect } from 'react';
import { Save, Shield, Settings, Eye, CheckSquare, Square, Info } from 'lucide-react';
import { api } from '../services/api';
import { Toast } from '../components/Common/Toast';
import { CATALOGOS } from '../utils/catalogs';

export const ConfiguracionPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<any>(null);
  
  // Perfil del emisor
  const [nit, setNit] = useState('');
  const [nrc, setNrc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [codActividad, setCodActividad] = useState('');
  const [descActividad, setDescActividad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  
  // Direccion
  const [departamento, setDepartamento] = useState('01');
  const [municipio, setMunicipio] = useState('01');
  const [complemento, setComplemento] = useState('');

  // MH Config
  const [ambiente, setAmbiente] = useState('00');
  const [codEstablecimientoMh, setCodEstablecimientoMh] = useState('0000');
  const [codPuntoVentaMh, setCodPuntoVentaMh] = useState('0000');
  const [pwdMh, setPwdMh] = useState('');
  const [pwdFirmador, setPwdFirmador] = useState('');

  // DTEs Visibles
  const [dtesVisibles, setDtesVisibles] = useState<string[]>(["01", "03", "11"]);

  const allDtes = [
    { code: '01', name: 'Factura (01)' },
    { code: '03', name: 'Crédito Fiscal (03)' },
    { code: '04', name: 'Nota Remisión (04)' },
    { code: '05', name: 'Nota Crédito (05)' },
    { code: '06', name: 'Nota Débito (06)' },
    { code: '07', name: 'Comprobante Retención (07)' },
    { code: '08', name: 'Comprobante Liquidación (08)' },
    { code: '09', name: 'Documento Contable de Liquidación (09)' },
    { code: '11', name: 'Factura de Exportación (11)' },
    { code: '14', name: 'Factura de Sujeto Excluido (14)' },
    { code: '15', name: 'Comprobante de Donación (15)' },
  ];

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      if (response.data.success) {
        const data = response.data.emisor;
        setNit(data.nit || '');
        setNrc(data.nrc || '');
        setRazonSocial(data.razonSocial || '');
        setNombreComercial(data.nombreComercial || '');
        setCodActividad(data.codActividad || '');
        setDescActividad(data.descActividad || '');
        setTelefono(data.telefono || '');
        setCorreo(data.correo || '');
        
        const dir = data.direccion || {};
        setDepartamento(dir.departamento || '01');
        setMunicipio(dir.municipio || '01');
        setComplemento(dir.complemento || '');

        setAmbiente(data.ambiente || '00');
        setCodEstablecimientoMh(data.codEstablecimientoMh || '0000');
        setCodPuntoVentaMh(data.codPuntoVentaMh || '0000');
        
        setPwdMh('');
        setPwdFirmador('');

        if (data.dtesVisibles) {
          setDtesVisibles(data.dtesVisibles);
        }
      }
    } catch (err: any) {
      console.error('Error al cargar configuración:', err);
      setToast({ type: 'error', message: 'No se pudo obtener la configuración del emisor' });
    } finally {
      setLoading(false);
    }
  };

  const handleDteToggle = (code: string) => {
    if (dtesVisibles.includes(code)) {
      setDtesVisibles(dtesVisibles.filter(c => c !== code));
    } else {
      setDtesVisibles([...dtesVisibles, code]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        nrc,
        razonSocial,
        nombreComercial,
        codActividad,
        descActividad,
        direccion: { departamento, municipio, complemento },
        telefono,
        dtesVisibles,
        ambiente,
        codEstablecimientoMh,
        codPuntoVentaMh
      };

      if (pwdMh.trim() !== '') payload.pwdMh = pwdMh;
      if (pwdFirmador.trim() !== '') payload.pwdFirmador = pwdFirmador;

      const response = await api.put('/auth/config', payload);

      if (response.data.success) {
        const emisorLocal = JSON.parse(localStorage.getItem('emisor') || '{}');
        const updatedEmisor = {
          ...emisorLocal,
          nrc,
          razonSocial,
          nombreComercial,
          dtesVisibles,
          ambiente
        };
        localStorage.setItem('emisor', JSON.stringify(updatedEmisor));

        setToast({ type: 'success', message: 'Configuración guardada exitosamente' });
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error al guardar configuración:', err);
      setToast({ type: 'error', message: err.response?.data?.error || 'Error al guardar la configuración' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Title block */}
      <div className="flex items-center gap-3 mb-6 bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
        <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configuración del Perfil / Emisor</h1>
          <p className="text-xs text-gray-500 mt-1">Configura los datos fiscales del contribuyente, credenciales de Hacienda y documentos visibles.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Sección 1: Perfil General */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-600 rounded-sm"></span>
            <span>Datos Generales del Contribuyente (Emisor)</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">NIT (Identificador Fiscal)</label>
              <input className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-xl py-2.5 px-4 text-sm font-semibold focus:outline-none cursor-not-allowed" value={nit} readOnly />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">NRC (Registro de Contribuyente)</label>
              <input className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" value={nrc} onChange={e => setNrc(e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nombre o Razón Social</label>
              <input className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nombre Comercial</label>
              <input className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" value={nombreComercial} onChange={e => setNombreComercial(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Código Actividad Económica</label>
              <input className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-mono" value={codActividad} onChange={e => setCodActividad(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Descripción de Actividad</label>
              <input className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" value={descActividad} onChange={e => setDescActividad(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Teléfono</label>
              <input className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" value={telefono} onChange={e => setTelefono(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Correo de Facturación</label>
              <input className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" type="email" value={correo} onChange={e => setCorreo(e.target.value)} required />
            </div>
          </div>
        </div>

        {/* Sección 2: Dirección */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-600 rounded-sm"></span>
            <span>Dirección del Emisor</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Departamento</label>
              <select className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" value={departamento} onChange={e => setDepartamento(e.target.value)} required>
                {CATALOGOS.departamentos.map(d => <option key={d.code} value={d.code} className="text-gray-900">{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Código Municipio</label>
              <input className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-mono" value={municipio} onChange={e => setMunicipio(e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Complemento de Dirección</label>
              <input className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" value={complemento} onChange={e => setComplemento(e.target.value)} required />
            </div>
          </div>
        </div>

        {/* Sección 3: MH y Credenciales */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Shield size={18} className="text-blue-600" />
            <span>Ambiente y Credenciales del Ministerio de Hacienda</span>
          </h2>
          
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-xs text-blue-800 items-start">
            <Info className="flex-shrink-0 mt-0.5 text-blue-600" size={16} />
            <div>
              Por motivos de seguridad, las contraseñas actuales no se muestran en pantalla. Déjalas en blanco a menos que desees cambiarlas. El establecimiento y punto de venta se asocian de forma independiente para cada emisor.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Ambiente Ministerio de Hacienda</label>
              <select className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-bold" value={ambiente} onChange={e => setAmbiente(e.target.value)} required>
                <option value="00" className="text-amber-600 font-bold">00 - PRUEBAS</option>
                <option value="01" className="text-emerald-600 font-bold">01 - PRODUCCIÓN</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Cód. Establec. MH</label>
                <input className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors text-center font-mono" value={codEstablecimientoMh} onChange={e => setCodEstablecimientoMh(e.target.value)} placeholder="0000" maxLength={4} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Cód. Punto Venta MH</label>
                <input className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors text-center font-mono" value={codPuntoVentaMh} onChange={e => setCodPuntoVentaMh(e.target.value)} placeholder="0000" maxLength={4} required />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Contraseña API MH (pwd_mh)</label>
              <input className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" type="password" placeholder="Ingresa contraseña API solo si deseas cambiarla" value={pwdMh} onChange={e => setPwdMh(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Contraseña Llave Privada MH (pwd_firmador)</label>
              <input className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" type="password" placeholder="Ingresa contraseña del firmador solo si deseas cambiarla" value={pwdFirmador} onChange={e => setPwdFirmador(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Sección 4: DTEs Visibles */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Eye size={18} className="text-blue-600" />
            <span>Documentos Tributarios Electrónicos (DTEs) Habilitados</span>
          </h2>
          <p className="text-xs text-gray-500">Selecciona los tipos de documentos tributarios autorizados por el MH para este emisor. Los documentos desactivados no se mostrarán en tu menú de navegación lateral.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {allDtes.map((dte) => {
              const isChecked = dtesVisibles.includes(dte.code);
              return (
                <div 
                  key={dte.code}
                  onClick={() => handleDteToggle(dte.code)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${isChecked ? 'bg-blue-50 border-blue-200 text-blue-800 font-semibold' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'}`}
                >
                  <span className="flex-shrink-0">
                    {isChecked ? <CheckSquare className="text-blue-600" size={18} /> : <Square className="text-gray-400" size={18} />}
                  </span>
                  <span className="text-xs">{dte.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-150 cursor-pointer animate-none"
          >
            <Save size={18} />
            <span>Guardar Configuración</span>
          </button>
        </div>

      </form>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

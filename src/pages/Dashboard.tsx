// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Receipt, FileSpreadsheet, FileWarning,
  Search, AlertTriangle, Truck, DollarSign,
  FileCode, GitBranch, HeartHandshake, UserCheck,
  Plus, CheckCircle, Clock, FileBox, Play, FileUp, Loader2,
  Mail, Download, MessageCircle
} from 'lucide-react';
import { obtenerDashboardStats, obtenerDteInfo, reenviarCorreoDte, reenviarWhatsappDte } from '../services/dte.service';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({
    total: 0,
    montoTotal: 0,
    procesados: 0,
    pendientes: 0,
    borrador: 0,
    enviado: 0,
    rechazado: 0,
    invalidado: 0
  });
  const [dtesRecientes, setDtesRecientes] = useState<any[]>([]);
  const [conteoPorTipo, setConteoPorTipo] = useState<Record<string, number>>({
    '01': 0,
    '03': 0,
    '04': 0,
    '05': 0,
    '06': 0,
    '07': 0,
    '08': 0,
    '09': 0,
    '11': 0,
    '14': 0,
    '15': 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDte, setSelectedDte] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [resendingEmail, setResendingEmail] = useState<boolean>(false);
  const [resendingWhatsapp, setResendingWhatsapp] = useState<boolean>(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await obtenerDashboardStats();
        if (res.success) {
          setStats(res.stats);
          setDtesRecientes(res.dtesRecientes || []);
          if (res.conteoPorTipo) {
            setConteoPorTipo(res.conteoPorTipo);
          }
        } else {
          setError(res.error || 'No se pudieron cargar las estadísticas');
        }
      } catch (err: any) {
        console.error('Error al cargar stats:', err);
        setError(err.message || 'Error de red al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleVerDetalle = async (codigoGeneracion: string) => {
    try {
      setModalLoading(true);
      setIsModalOpen(true);
      setResendMessage(null);
      const res = await obtenerDteInfo(codigoGeneracion);
      if (res.success) {
        setSelectedDte(res.dte);
      } else {
        alert(res.error || 'No se pudo obtener el detalle del documento');
        setIsModalOpen(false);
      }
    } catch (err: any) {
      console.error('Error al cargar detalle de DTE:', err);
      alert(err.message || 'Error de red al conectar con el servidor');
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const tipoDteMetaMap: Record<string, { nombre: string; color: string; icon: React.ReactNode }> = {
    '01': { nombre: 'Factura', color: 'text-blue-600', icon: <FileText size={16} /> },
    '03': { nombre: 'Crédito Fiscal', color: 'text-indigo-600', icon: <Receipt size={16} /> },
    '04': { nombre: 'Nota de Remisión', color: 'text-yellow-600', icon: <Truck size={16} /> },
    '05': { nombre: 'Nota de Crédito', color: 'text-purple-600', icon: <FileSpreadsheet size={16} /> },
    '06': { nombre: 'Nota de Débito', color: 'text-pink-600', icon: <FileSpreadsheet size={16} /> },
    '07': { nombre: 'Retención', color: 'text-teal-600', icon: <FileCode size={16} /> },
    '08': { nombre: 'Liquidación', color: 'text-orange-600', icon: <FileBox size={16} /> },
    '09': { nombre: 'Doc. Contable Liq.', color: 'text-cyan-600', icon: <FileBox size={16} /> },
    '11': { nombre: 'Exportación', color: 'text-green-600', icon: <DollarSign size={16} /> },
    '14': { nombre: 'Sujeto Excluido', color: 'text-slate-600', icon: <UserCheck size={16} /> },
    '15': { nombre: 'Donación', color: 'text-red-600', icon: <HeartHandshake size={16} /> }
  };

  const estadoMetaMap: Record<string, { nombre: string; color: string; icon: React.ReactNode }> = {
    'borrador': { nombre: 'Borrador', color: 'text-gray-500', icon: <Clock size={16} /> },
    'enviado': { nombre: 'Enviado', color: 'text-blue-500', icon: <FileUp size={16} /> },
    'procesado': { nombre: 'Procesado', color: 'text-green-500', icon: <CheckCircle size={16} /> },
    'rechazado': { nombre: 'Rechazado', color: 'text-red-500', icon: <FileWarning size={16} /> },
    'invalidado': { nombre: 'Invalidado', color: 'text-gray-400', icon: <AlertTriangle size={16} /> }
  };

  const estadosList = [
    { key: 'borrador', count: stats.borrador || 0 },
    { key: 'enviado', count: stats.enviado || 0 },
    { key: 'procesado', count: stats.procesados || 0 },
    { key: 'rechazado', count: stats.rechazado || 0 },
    { key: 'invalidado', count: stats.invalidado || 0 }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">Resumen de facturación electrónica</p>
        </div>
        <button
          onClick={() => navigate('/factura')}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <Plus size={18} /> Nuevo Documento
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 flex items-center gap-2">
          <AlertTriangle size={20} className="shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Documentos</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? <Loader2 className="h-6 w-6 text-gray-400 animate-spin" /> : stats.total}
              </h3>
            </div>
            <div className="bg-primary-50 p-2.5 rounded-lg">
              <FileBox className="text-primary-600 h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Monto Total</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? (
                  <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                ) : (
                  `$${Number(stats.montoTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </h3>
            </div>
            <div className="bg-green-50 p-2.5 rounded-lg">
              <DollarSign className="text-green-600 h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Procesados</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? <Loader2 className="h-6 w-6 text-gray-400 animate-spin" /> : stats.procesados}
              </h3>
            </div>
            <div className="bg-green-50 p-2.5 rounded-lg">
              <CheckCircle className="text-green-600 h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pendientes</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? <Loader2 className="h-6 w-6 text-gray-400 animate-spin" /> : stats.pendientes}
              </h3>
            </div>
            <div className="bg-yellow-50 p-2.5 rounded-lg">
              <Clock className="text-yellow-600 h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Status Box */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-6">Por Estado</h3>
            <div className="space-y-4">
              {estadosList
                .sort((a, b) => b.count - a.count)
                .map(item => {
                  const meta = estadoMetaMap[item.key];
                  if (!meta) return null;
                  return (
                    <div key={item.key} className="flex justify-between items-center text-sm">
                      <div className={`flex items-center gap-3 ${meta.color}`}>
                        {meta.icon}
                        <span className="text-xs font-semibold uppercase tracking-wider">{meta.nombre}</span>
                      </div>
                      <span className="font-bold text-gray-950">
                        {loading ? '...' : item.count}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* DTE Types Count Box */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-6">Por Tipo de DTE</h3>
            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {Object.entries(conteoPorTipo)
                .sort((a, b) => b[1] - a[1])
                .map(([key, count]) => {
                  const meta = tipoDteMetaMap[key];
                  if (!meta) return null;
                  return (
                    <div key={key} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2.5 text-gray-600">
                        <span className={`${meta.color} bg-gray-50 p-1 rounded-md border border-gray-100 shrink-0`}>
                          {meta.icon}
                        </span>
                        <span className="font-semibold text-gray-700 text-xs truncate max-w-[110px]" title={`${meta.nombre} (${key})`}>
                          {meta.nombre}
                        </span>
                      </div>
                      <span className="font-extrabold text-gray-900 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-200 text-[10px] font-mono shadow-xs shrink-0">
                        {loading ? '...' : count}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-6">Accesos Rápidos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/factura" className="flex items-center p-3.5 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/50 transition-all hover:shadow-xs group">
              <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 transition-colors">
                <FileText size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-gray-800">Factura</p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">DTE-01</p>
              </div>
            </Link>

            <Link to="/ccf" className="flex items-center p-3.5 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/50 transition-all hover:shadow-xs group">
              <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 transition-colors">
                <Receipt size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-gray-800">Crédito Fiscal</p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">DTE-03</p>
              </div>
            </Link>

            <Link to="/nota-remision" className="flex items-center p-3.5 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/50 transition-all hover:shadow-xs group">
              <div className="bg-yellow-50 p-2.5 rounded-xl text-yellow-600 transition-colors">
                <Truck size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-gray-800">Nota de Remisión</p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">DTE-04</p>
              </div>
            </Link>

            <Link to="/nota-credito" className="flex items-center p-3.5 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/50 transition-all hover:shadow-xs group">
              <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600 transition-colors">
                <FileSpreadsheet size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-gray-800">Nota de Crédito</p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">DTE-05</p>
              </div>
            </Link>

            <Link to="/factura-exportacion" className="flex items-center p-3.5 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/50 transition-all hover:shadow-xs group">
              <div className="bg-green-50 p-2.5 rounded-xl text-green-600 transition-colors">
                <DollarSign size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-gray-800">Exportación</p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">DTE-11</p>
              </div>
            </Link>

            <Link to="/factura-sujeto-excluido" className="flex items-center p-3.5 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/50 transition-all hover:shadow-xs group">
              <div className="bg-slate-50 p-2.5 rounded-xl text-slate-600 transition-colors">
                <UserCheck size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-gray-800">Sujeto Excluido</p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">DTE-14</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-gray-900">Documentos Recientes</h3>
          <Link to="/consulta" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
            Ver todos &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Cargando estadísticas y documentos recientes...</p>
          </div>
        ) : dtesRecientes.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <FileText className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">No hay documentos aún</p>
            <Link to="/factura" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Crear primer documento
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <div className="inline-block min-w-full align-middle px-6">
              <div className="overflow-hidden border border-gray-150 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Número Control</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo DTE</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Emisión</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Pagar</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                      <th scope="col" className="relative px-6 py-3.5"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dtesRecientes.map((dte) => {
                      const tipoDteMap: Record<string, string> = {
                        "01": "Factura (01)",
                        "03": "Crédito Fiscal (03)",
                        "04": "Nota de Remisión (04)",
                        "05": "Nota de Crédito (05)",
                        "06": "Nota de Débito (06)",
                        "07": "Comprobante Retención (07)",
                        "08": "Comprobante Liquidación (08)",
                        "09": "Doc. Contable Liq. (09)",
                        "11": "Factura Exportación (11)",
                        "14": "Sujeto Excluido (14)",
                        "15": "Comprobante Donación (15)"
                      };

                      const getStatusClass = (estado: string) => {
                        const est = estado.toUpperCase();
                        if (est === 'PROCESADO') return 'bg-green-50 text-green-700 border border-green-200';
                        if (est === 'PROCESANDO') return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
                        if (est === 'RECHAZADO') return 'bg-red-50 text-red-700 border border-red-200';
                        return 'bg-gray-50 text-gray-700 border border-gray-200';
                      };

                      return (
                        <tr key={dte.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 font-mono">
                            {dte.numero_control}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {tipoDteMap[dte.tipo_dte] || `DTE-${dte.tipo_dte}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {dte.cliente?.nombre || 'Consumidor Final'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(dte.fecha_emision).toLocaleDateString('es-SV', { timeZone: 'UTC' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            ${Number(dte.total_pagar).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full uppercase ${getStatusClass(dte.estado)}`}>
                              {dte.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                            <button
                              onClick={() => handleVerDetalle(dte.codigo_generacion)}
                              className="text-primary-600 hover:text-primary-900 transition-colors inline-flex items-center gap-1.5 font-bold"
                            >
                              <Search size={14} />Detalle
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detalle DTE Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-150 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Detalle del Documento</h3>
                <p className="text-xs text-gray-500 mt-0.5">Información completa almacenada e integrada con Hacienda</p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedDte(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {modalLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader2 className="h-8 w-8 text-primary-600 animate-spin mb-4" />
                  <p className="text-gray-500 font-medium">Cargando detalles del DTE...</p>
                </div>
              ) : selectedDte ? (
                <>
                  {/* General Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Número de Control</p>
                      <p className="text-sm font-bold text-gray-900 font-mono mt-1">{selectedDte.numeroControl}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Código de Generación (UUID)</p>
                      <p className="text-xs font-bold text-gray-900 font-mono mt-1 break-all uppercase">{selectedDte.codigoGeneracion}</p>
                    </div>
                    {selectedDte.selloRecepcionMh && (
                      <div className="bg-green-50/40 p-4 rounded-xl border border-green-100 md:col-span-2">
                        <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle size={12} className="shrink-0" /> Sello de Recepción / Firma MH
                        </p>
                        <p className="text-xs font-bold text-green-850 font-mono mt-1 break-all uppercase leading-relaxed">{selectedDte.selloRecepcionMh}</p>
                      </div>
                    )}
                  </div>

                  {/* Status & Totals */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="border border-gray-100 p-4 rounded-xl">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tipo DTE</p>
                      <p className="text-sm font-bold text-gray-800 mt-1 uppercase">DTE-{selectedDte.tipoDte}</p>
                    </div>
                    <div className="border border-gray-100 p-4 rounded-xl">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Fecha Emisión</p>
                      <p className="text-sm font-bold text-gray-800 mt-1">{selectedDte.fechaEmision}</p>
                    </div>
                    <div className="border border-gray-100 p-4 rounded-xl col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Estado en Hacienda</p>
                      <span className={`inline-flex px-2.5 py-0.5 mt-1.5 text-xs font-bold rounded-full uppercase ${selectedDte.estado === 'PROCESADO' ? 'bg-green-50 text-green-700 border border-green-200' :
                          selectedDte.estado === 'PROCESANDO' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                            selectedDte.estado === 'RECHAZADO' ? 'bg-red-50 text-red-700 border border-red-200' :
                              'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                        {selectedDte.estado}
                      </span>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="border border-gray-100 p-5 rounded-2xl bg-gray-50/50">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Receptor / Cliente</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-medium text-gray-400">Razón Social / Nombre</p>
                        <p className="font-bold text-gray-800 mt-0.5">{selectedDte.cliente?.nombre || 'Consumidor Final'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-400">Número de Documento</p>
                        <p className="font-bold text-gray-800 mt-0.5 font-mono">{selectedDte.cliente?.numDocumento || 'N/A'}</p>
                      </div>
                      {selectedDte.cliente?.correo && (
                        <div className={selectedDte.cliente?.telefono ? "sm:col-span-1" : "sm:col-span-2"}>
                          <p className="text-xs font-medium text-gray-400">Correo Electrónico</p>
                          <p className="font-bold text-gray-800 mt-0.5 break-all">{selectedDte.cliente.correo}</p>
                        </div>
                      )}
                      {selectedDte.cliente?.telefono && (
                        <div className={selectedDte.cliente?.correo ? "sm:col-span-1" : "sm:col-span-2"}>
                          <p className="text-xs font-medium text-gray-400">Teléfono</p>
                          <p className="font-bold text-gray-800 mt-0.5 font-mono">{selectedDte.cliente.telefono}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing / Amounts */}
                  <div className="border border-primary-100 bg-primary-50/20 p-5 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">Monto Total de Operación</p>
                      <h3 className="text-2xl font-black text-gray-900 mt-1">
                        ${Number(selectedDte.montoTotal).toFixed(2)}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">Monto Neto a Pagar</p>
                      <h3 className="text-2xl font-black text-primary-700 mt-1">
                        ${Number(selectedDte.montoTotal).toFixed(2)}
                      </h3>
                    </div>
                  </div>

                  {resendMessage && (
                    <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                      resendMessage.type === 'success'
                        ? 'bg-green-50 text-green-750 border-green-200'
                        : 'bg-red-50 text-red-750 border-red-200'
                    }`}>
                      <span className="flex items-center gap-2">
                        {resendMessage.type === 'success' ? <CheckCircle size={16} className="text-green-600 shrink-0" /> : <AlertTriangle size={16} className="text-red-600 shrink-0" />}
                        {resendMessage.text}
                      </span>
                      <button onClick={() => setResendMessage(null)} className="text-gray-400 hover:text-gray-600 font-bold ml-2">&times;</button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500">No se pudieron cargar los datos del documento.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                {selectedDte && (
                  <>
                    <button
                      onClick={() => {
                        const token = localStorage.getItem('token');
                        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
                        window.open(`${baseUrl}/dtes/${selectedDte.codigoGeneracion}/pdf?token=${token}`, '_blank');
                      }}
                      className="bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Ver o descargar PDF oficial"
                    >
                      <Download size={14} className="text-primary-600" /> Ver PDF
                    </button>

                    <button
                      onClick={() => {
                        const token = localStorage.getItem('token');
                        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
                        window.open(`${baseUrl}/dtes/${selectedDte.codigoGeneracion}/json?token=${token}`, '_blank');
                      }}
                      className="bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Descargar archivo JSON oficial"
                    >
                      <Download size={14} className="text-indigo-600" /> JSON
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedDte && (
                  <button
                    disabled={resendingEmail}
                    onClick={async () => {
                      try {
                        setResendingEmail(true);
                        setResendMessage(null);
                        const res = await reenviarCorreoDte(selectedDte.codigoGeneracion);
                        if (res.success) {
                          setResendMessage({
                            type: 'success',
                            text: res.message || '¡Correo reenviado exitosamente con PDF y JSON adjuntos!'
                          });
                        } else {
                          setResendMessage({
                            type: 'error',
                            text: res.error || 'No se pudo enviar el correo.'
                          });
                        }
                      } catch (err: any) {
                        setResendMessage({
                          type: 'error',
                          text: err.response?.data?.error || err.message || 'Fallo al enviar correo.'
                        });
                      } finally {
                        setResendingEmail(false);
                      }
                    }}
                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    {resendingEmail ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Reenviando...
                      </>
                    ) : (
                      <>
                        <Mail size={14} /> Reenviar Correo
                      </>
                    )}
                  </button>
                )}

                {selectedDte && (
                  <button
                    disabled={resendingWhatsapp || resendingEmail}
                    onClick={async () => {
                      try {
                        setResendingWhatsapp(true);
                        setResendMessage(null);
                        const res = await reenviarWhatsappDte(selectedDte.codigoGeneracion);
                        if (res.success) {
                          setResendMessage({
                            type: 'success',
                            text: res.message || '¡Documento enviado/preparado para WhatsApp!'
                          });
                          if (res.whatsappWebUrl) {
                            window.open(res.whatsappWebUrl, '_blank');
                          }
                        } else {
                          setResendMessage({
                            type: 'error',
                            text: res.error || 'No se pudo enviar por WhatsApp.'
                          });
                        }
                      } catch (err: any) {
                        setResendMessage({
                          type: 'error',
                          text: err.response?.data?.error || err.message || 'Fallo al procesar envío por WhatsApp.'
                        });
                      } finally {
                        setResendingWhatsapp(false);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    {resendingWhatsapp ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Enviando...
                      </>
                    ) : (
                      <>
                        <MessageCircle size={14} /> Reenviar WhatsApp
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedDte(null);
                    setResendMessage(null);
                  }}
                  className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold border border-gray-200 transition-colors shadow-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


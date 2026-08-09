import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Receipt, FileSpreadsheet, Truck,
  UserCheck, FileCode, GitBranch, DollarSign, HeartHandshake,
  AlertTriangle, FileWarning, Settings, LogOut, ChevronDown, ChevronUp,
  FileBox, User, X
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const [isDteOpen, setIsDteOpen] = useState(true);

  // Obtener información del emisor en sesión
  const emisorStr = localStorage.getItem('emisor');
  const emisor = emisorStr ? JSON.parse(emisorStr) : null;
  const visibleCodes: string[] = emisor?.dtesVisibles || ["01", "03", "11"];
  const isProduction = emisor?.ambiente === "01";

  const dteDocs = [
    { code: '01', name: 'Factura (01)', href: '/factura', icon: FileText },
    { code: '03', name: 'Crédito Fiscal (03)', href: '/ccf', icon: Receipt },
    { code: '04', name: 'Nota Remisión (04)', href: '/nota-remision', icon: Truck },
    { code: '05', name: 'Nota Crédito (05)', href: '/nota-credito', icon: FileSpreadsheet },
    { code: '06', name: 'Nota Débito (06)', href: '/nota-debito', icon: FileSpreadsheet },
    { code: '07', name: 'Retención (07)', href: '/comprobante-retencion', icon: UserCheck },
    { code: '08', name: 'Liquidación (08)', href: '/comprobante-liquidacion', icon: FileCode },
    { code: '09', name: 'Doc. Contable (09)', href: '/documento-contable-liquidacion', icon: GitBranch },
    { code: '11', name: 'Exportación (11)', href: '/factura-exportacion', icon: DollarSign },
    { code: '14', name: 'Sujeto Excluido (14)', href: '/factura-sujeto-excluido', icon: FileText },
    { code: '15', name: 'Donación (15)', href: '/comprobante-donacion', icon: HeartHandshake },
  ];

  // Filtrar los DTEs visibles según la configuración de perfil del emisor
  const visibleDtes = dteDocs.filter(doc => visibleCodes.includes(doc.code));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('emisor');
    window.location.href = '/';
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg text-sm font-bold shadow-md shadow-blue-500/10">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="font-bold text-white leading-tight text-sm">DTE SaaS</h1>
            <p className="text-[10px] text-slate-400">El Salvador Factura</p>
          </div>
        </div>

        {/* Botón de cierre para móvil */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      {/* Active Emisor Profile Info */}
      {emisor && (
        <div className="px-4 py-3 mx-4 my-3 bg-slate-950/50 border border-slate-800/80 rounded-xl flex items-center gap-3 flex-shrink-0">
          {emisor.logoUrl ? (
            <img src={emisor.logoUrl} alt="Logo" className="w-9 h-9 object-contain rounded-lg bg-white p-0.5 flex-shrink-0 border border-slate-700" />
          ) : (
            <div className="bg-slate-800 text-blue-400 p-2 rounded-lg flex-shrink-0">
              <User size={16} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-100 truncate">
              {emisor.nombreComercial || emisor.razonSocial || 'Mi Empresa'}
            </p>
            <p className="text-[9px] text-slate-400 truncate">{emisor.nit}</p>
            <span className={`inline-block text-[8px] font-bold px-1.5 py-0.2 mt-1 rounded ${isProduction ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-amber-950/80 text-amber-400 border border-amber-800'}`}>
              {isProduction ? 'PRODUCCIÓN' : 'PRUEBAS'}
            </span>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        <NavLink 
          to="/" 
          onClick={handleLinkClick}
          className={({ isActive }) => `flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
        >
          <LayoutDashboard className="mr-3 h-4 w-4" /> Dashboard
        </NavLink>
        <NavLink 
          to="/consulta" 
          onClick={handleLinkClick}
          className={({ isActive }) => `flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
        >
          <FileBox className="mr-3 h-4 w-4" /> Todos los Documentos
        </NavLink>

        {/* Catálogos y Operación */}
        <div className="pt-3 pb-1">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Catálogos y Operación
          </span>
          <div className="mt-1 space-y-0.5">
            <NavLink 
              to="/clientes" 
              onClick={handleLinkClick}
              className={({ isActive }) => `flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <User className="mr-3 h-3.5 w-3.5" /> Clientes
            </NavLink>
            <NavLink 
              to="/inventario" 
              onClick={handleLinkClick}
              className={({ isActive }) => `flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <FileBox className="mr-3 h-3.5 w-3.5" /> Inventario (Prod/Serv)
            </NavLink>
            <NavLink 
              to="/compras" 
              onClick={handleLinkClick}
              className={({ isActive }) => `flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
            >
              <Receipt className="mr-3 h-3.5 w-3.5" /> Compras
            </NavLink>
          </div>
        </div>

        {/* Dynamic DTE menu */}
        <div className="pt-3 pb-1">
          <button 
            onClick={() => setIsDteOpen(!isDteOpen)}
            className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-400 transition-colors"
          >
            <span>Mis DTEs Habilitados</span>
            {isDteOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          
          {isDteOpen && (
            <div className="mt-1 space-y-0.5">
              {visibleDtes.length === 0 ? (
                <p className="text-[11px] text-slate-500 px-3 py-2 italic">Ningún DTE habilitado</p>
              ) : (
                visibleDtes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink 
                      key={item.name} 
                      to={item.href} 
                      onClick={handleLinkClick}
                      className={({ isActive }) => `flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                    >
                      <Icon className="mr-3 h-3.5 w-3.5" /> {item.name}
                    </NavLink>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* System events */}
        <div className="pt-3 border-t border-slate-800 space-y-0.5">
          <NavLink 
            to="/invalidacion" 
            onClick={handleLinkClick}
            className={({ isActive }) => `flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
          >
            <FileWarning className="mr-3 h-4 w-4" /> Invalidación
          </NavLink>
          <NavLink 
            to="/contingencia" 
            onClick={handleLinkClick}
            className={({ isActive }) => `flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
          >
            <AlertTriangle className="mr-3 h-4 w-4" /> Contingencia
          </NavLink>
        </div>

        {/* Global Settings */}
        <div className="pt-3 border-t border-slate-800 space-y-0.5">
          <NavLink 
            to="/configuracion" 
            onClick={handleLinkClick}
            className={({ isActive }) => `flex items-center px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${isActive ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
          >
            <Settings className="mr-3 h-4 w-4" /> Configuración
          </NavLink>
        </div>
      </nav>

      {/* Session Logout */}
      <div className="p-4 border-t border-slate-800 flex-shrink-0">
        <button 
          onClick={handleLogout}
          className="flex items-center px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 w-full rounded-lg transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4 text-red-500" /> Cerrar Sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (visible when isOpen is true) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Drawer Body */}
          <aside className="relative z-10 w-72 max-w-[85vw] bg-slate-900 text-slate-300 h-full shadow-2xl flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

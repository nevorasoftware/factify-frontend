import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, FileText } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Información básica del emisor para la barra superior móvil
  const emisorStr = localStorage.getItem('emisor');
  const emisor = emisorStr ? JSON.parse(emisorStr) : null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Mobile Top Header (hidden on lg screens) */}
      <header className="lg:hidden sticky top-0 z-40 bg-slate-900 text-white px-4 h-14 flex items-center justify-between border-b border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors"
            aria-label="Abrir menú de navegación"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1 rounded-md">
              <FileText size={16} />
            </div>
            <span className="font-bold text-sm tracking-tight">DTE SaaS</span>
          </div>
        </div>

        {emisor && (
          <div className="text-right">
            <p className="text-[11px] font-semibold text-slate-200 truncate max-w-[140px]">
              {emisor.nombreComercial || emisor.razonSocial}
            </p>
            <span className="text-[9px] text-blue-400 font-mono">
              {emisor.ambiente === '01' ? 'PROD' : 'PRUEBAS'}
            </span>
          </div>
        )}
      </header>

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      {/* Main Content Area */}
      <main className="lg:pl-64 min-h-[calc(100vh-3.5rem)] lg:min-h-screen transition-all">
        <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

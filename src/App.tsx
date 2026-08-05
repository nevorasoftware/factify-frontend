import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { FacturaPage } from './pages/FacturaPage';
import { CCFPage } from './pages/CCFPage';
import { NotaCreditoPage } from './pages/NotaCreditoPage';
import { NotaDebitoPage } from './pages/NotaDebitoPage';
import { NotaRemisionPage } from './pages/NotaRemisionPage';
import { ComprobanteRetencionPage } from './pages/ComprobanteRetencionPage';
import { ComprobanteLiquidacionPage } from './pages/ComprobanteLiquidacionPage';
import { DocumentoContableLiquidacionPage } from './pages/DocumentoContableLiquidacionPage';
import { FacturaExportacionPage } from './pages/FacturaExportacionPage';
import { FacturaSujetoExcluidoPage } from './pages/FacturaSujetoExcluidoPage';
import { ComprobanteDonacionPage } from './pages/ComprobanteDonacionPage';
import { ConsultaPage } from './pages/ConsultaPage';
import { EventoContingenciaPage } from './pages/EventoContingenciaPage';
import { EventoInvalidacionPage } from './pages/EventoInvalidacionPage';
import { ConfiguracionPage } from './pages/ConfiguracionPage';
import { Login } from './pages/Login';
import { Clientes } from './pages/Clientes';
import { Inventario } from './pages/Inventario';
import { Compras } from './pages/Compras';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (token: string, emisor: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('emisor', JSON.stringify(emisor));
    setIsAuthenticated(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/factura" element={<FacturaPage />} />
          <Route path="/ccf" element={<CCFPage />} />
          <Route path="/nota-credito" element={<NotaCreditoPage />} />
          <Route path="/nota-debito" element={<NotaDebitoPage />} />
          <Route path="/nota-remision" element={<NotaRemisionPage />} />
          <Route path="/comprobante-retencion" element={<ComprobanteRetencionPage />} />
          <Route path="/comprobante-liquidacion" element={<ComprobanteLiquidacionPage />} />
          <Route path="/documento-contable-liquidacion" element={<DocumentoContableLiquidacionPage />} />
          <Route path="/factura-exportacion" element={<FacturaExportacionPage />} />
          <Route path="/factura-sujeto-excluido" element={<FacturaSujetoExcluidoPage />} />
          <Route path="/comprobante-donacion" element={<ComprobanteDonacionPage />} />
          <Route path="/consulta" element={<ConsultaPage />} />
          <Route path="/contingencia" element={<EventoContingenciaPage />} />
          <Route path="/invalidacion" element={<EventoInvalidacionPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

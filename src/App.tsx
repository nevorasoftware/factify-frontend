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
import { Contabilidad } from './pages/Contabilidad';
import { PruebasHacienda } from './pages/PruebasHacienda';
import { Restablecer } from './pages/Restablecer';
import { Empresas } from './pages/Empresas';
import { api } from './services/api';

const leerEmisor = () => JSON.parse(localStorage.getItem('emisor') || '{}');

// Una empresa solo entra a los documentos que Hacienda le autorizó.
const RutaDte: React.FC<{ codigo: string; children: React.ReactElement }> = ({ codigo, children }) => (
  (leerEmisor().dtesVisibles || []).includes(codigo) ? children : <Navigate to="/" replace />
);

const SoloAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => (
  leerEmisor().esAdmin ? children : <Navigate to="/" replace />
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setPerfilActualizado] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // Los datos guardados pueden ser viejos: ambiente y documentos los define el servidor
      api.get('/auth/me').then(res => {
        if (res.data.success) {
          localStorage.setItem('emisor', JSON.stringify(res.data.emisor));
          setPerfilActualizado(v => v + 1);
        }
      }).catch(() => {});
    }
    setLoading(false);
  }, []);

  if (window.location.pathname === '/restablecer') {
    return <Restablecer />;
  }

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
          <Route path="/factura" element={<RutaDte codigo="01"><FacturaPage /></RutaDte>} />
          <Route path="/ccf" element={<RutaDte codigo="03"><CCFPage /></RutaDte>} />
          <Route path="/nota-credito" element={<RutaDte codigo="05"><NotaCreditoPage /></RutaDte>} />
          <Route path="/nota-debito" element={<RutaDte codigo="06"><NotaDebitoPage /></RutaDte>} />
          <Route path="/nota-remision" element={<RutaDte codigo="04"><NotaRemisionPage /></RutaDte>} />
          <Route path="/comprobante-retencion" element={<RutaDte codigo="07"><ComprobanteRetencionPage /></RutaDte>} />
          <Route path="/comprobante-liquidacion" element={<RutaDte codigo="08"><ComprobanteLiquidacionPage /></RutaDte>} />
          <Route path="/documento-contable-liquidacion" element={<RutaDte codigo="09"><DocumentoContableLiquidacionPage /></RutaDte>} />
          <Route path="/factura-exportacion" element={<RutaDte codigo="11"><FacturaExportacionPage /></RutaDte>} />
          <Route path="/factura-sujeto-excluido" element={<RutaDte codigo="14"><FacturaSujetoExcluidoPage /></RutaDte>} />
          <Route path="/comprobante-donacion" element={<RutaDte codigo="15"><ComprobanteDonacionPage /></RutaDte>} />
          <Route path="/empresas" element={<SoloAdmin><Empresas /></SoloAdmin>} />
          <Route path="/consulta" element={<ConsultaPage />} />
          <Route path="/contingencia" element={<EventoContingenciaPage />} />
          <Route path="/invalidacion" element={<EventoInvalidacionPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/contabilidad" element={<Contabilidad />} />
          <Route path="/pruebas-hacienda" element={<PruebasHacienda />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

// src/pages/FacturaPage.tsx
import React, { useState } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { ReceptorForm } from '../components/Forms/ReceptorForm';
import { ItemsTable } from '../components/Forms/ItemsTable';
import { TotalesCard } from '../components/Forms/TotalesCard';
import { Toast } from '../components/Common/Toast';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { enviarFactura } from '../services/dte.service';
import { Receptor, Item, Pago } from '../types';

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

export const FacturaPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [receptor, setReceptor] = useState<Receptor>(initialReceptor);
  const [items, setItems] = useState<Item[]>([{
    numItem: 1, tipoItem: 1, cantidad: 1, codigo: null,
    uniMedida: 59, descripcion: '', precioUni: 0, montoDescu: 0, ventaGravada: 0
  }]);
  const [condicionOperacion, setCondicionOperacion] = useState(1);
  const [pagos, setPagos] = useState<Pago[]>([{ codigo: '01', montoPago: 0, referencia: null, plazo: null, periodo: null }]);
  const [resultado, setResultado] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.ventaGravada, 0);
  const iva = subtotal * 0.13;
  const total = subtotal + iva;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const pagosConMonto = pagos.map(p => ({ ...p, montoPago: total }));
    
    const data = {
      receptor,
      cuerpoDocumento: items,
      resumen: {
        totalGravada: subtotal,
        subTotalVentas: subtotal,
        tributos: [{ codigo: '20', descripcion: 'IVA 13%', valor: iva }],
        subTotal: subtotal,
        montoTotalOperacion: total,
        totalPagar: total,
        totalLetras: `${Math.floor(total)} ${((total % 1) * 100).toFixed(0)}/100 DOLARES USD`,
        condicionOperacion,
        pagos: pagosConMonto,
        totalNoSuj: 0,
        totalExenta: 0,
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: 0,
        porcentajeDescuento: 0,
        totalDescu: 0,
        ivaRete1: 0,
        reteRenta: 0,
        totalNoGravado: 0,
        numPagoElectronico: null,
        saldoFavor: 0
      }
    };

    try {
      const response = await enviarFactura(data);
      if (response.success) {
        setToast({ type: 'success', message: `Factura enviada exitosamente. Código: ${response.codigoGeneracion}` });
        setResultado(response);
        limpiarFormulario();
      } else {
        setToast({ type: 'error', message: response.error || 'Error al enviar factura' });
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
      numItem: 1, tipoItem: 1, cantidad: 1, codigo: null,
      uniMedida: 59, descripcion: '', precioUni: 0, montoDescu: 0, ventaGravada: 0
    }]);
    setCondicionOperacion(1);
    setPagos([{ codigo: '01', montoPago: 0, referencia: null, plazo: null, periodo: null }]);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Factura Electrónica</h1>
        <p className="text-gray-600">Complete los datos para emitir una factura electrónica</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Datos del Receptor</h2>
          <ReceptorForm receptor={receptor} onChange={setReceptor} />
        </div>

        <div className="card">
          <ItemsTable items={items} onChange={setItems} />
        </div>

        <div className="card">
          <TotalesCard
            subtotal={subtotal}
            iva={iva}
            total={total}
            condicionOperacion={condicionOperacion}
            pagos={pagos}
            onCondicionChange={setCondicionOperacion}
            onPagosChange={setPagos}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={limpiarFormulario}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size="18" /> Limpiar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : <Send size="18" />}
            {loading ? 'Enviando...' : 'Enviar Factura'}
          </button>
        </div>
      </form>

      {resultado?.resultado && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Resultado del Envío</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Código de Generación:</strong> {resultado.codigoGeneracion}</p>
            <p><strong>Sello de Recepción:</strong> {resultado.resultado.selloRecibido}</p>
            <p><strong>Fecha Procesamiento:</strong> {resultado.resultado.fhProcesamiento}</p>
            <p><strong>Estado:</strong> <span className="text-green-600">{resultado.resultado.estado}</span></p>
            <p><strong>Mensaje:</strong> {resultado.resultado.descripcionMsg}</p>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

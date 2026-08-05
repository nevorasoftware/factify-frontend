// src/pages/NotaRemisionPage.tsx
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { ReceptorForm } from '../components/Forms/ReceptorForm';
import { ItemsTable } from '../components/Forms/ItemsTable';
import { Toast } from '../components/Common/Toast';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { enviarNotaRemision } from '../services/dte.service';
import { Receptor, Item } from '../types';

export const NotaRemisionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [receptor, setReceptor] = useState<Receptor>({
    nit: '', nrc: '', nombre: '', codActividad: null, descActividad: null,
    direccion: { departamento: '06', municipio: '14', complemento: '' }, telefono: '', correo: ''
  });
  const [items, setItems] = useState<Item[]>([{
    numItem: 1, tipoItem: 1, cantidad: 1, codigo: null, uniMedida: 59, descripcion: '', precioUni: 0, montoDescu: 0, ventaGravada: 0
  }]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const subtotal = items.reduce((sum, item) => sum + item.ventaGravada, 0);

    const data = {
      receptor,
      cuerpoDocumento: items,
      resumen: {
        totalNoSuj: 0, totalExenta: 0, totalGravada: subtotal, subTotalVentas: subtotal,
        totalDescu: 0, subTotal: subtotal, montoTotalOperacion: subtotal, totalPagar: subtotal,
        totalLetras: `${Math.floor(subtotal)} ${((subtotal % 1) * 100).toFixed(0)}/100 DOLARES USD`
      }
    };

    try {
      const response = await enviarNotaRemision(data);
      if (response.success) {
        setToast({ type: 'success', message: `Nota de Remisión enviada. Código: ${response.codigoGeneracion}` });
      } else {
        setToast({ type: 'error', message: response.error || 'Error' });
      }
    } catch (error: any) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nota de Remisión Electrónica</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Destinatario</h2>
          <ReceptorForm receptor={receptor} onChange={setReceptor} />
        </div>
        <div className="card">
          <ItemsTable items={items} onChange={setItems} />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <LoadingSpinner /> : <Send size="18" />} Enviar
          </button>
        </div>
      </form>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

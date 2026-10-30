// src/pages/NotaRemisionPage.tsx
import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { ReceptorForm } from '../components/Forms/ReceptorForm';
import { ItemsTable } from '../components/Forms/ItemsTable';
import { Toast } from '../components/Common/Toast';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { enviarNotaRemision } from '../services/dte.service';
import { obtenerCatalogosGenerales, OpcionCatalogo } from '../services/catalogos.service';
import { Receptor, Item } from '../types';
import { mensajeError, mensajeRechazo } from '../utils/errores';

export const NotaRemisionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [receptor, setReceptor] = useState<Receptor>({
    nit: '', nrc: '', nombre: '', codActividad: null, descActividad: null,
    direccion: { departamento: '', municipio: '', distrito: '', complemento: '' }, telefono: '', correo: ''
  });
  const [items, setItems] = useState<Item[]>([{
    numItem: 1, tipoItem: 1, cantidad: 1, codigo: null, uniMedida: 59, descripcion: '', precioUni: 0, montoDescu: 0, ventaGravada: 0
  }]);
  const [bienTitulo, setBienTitulo] = useState('');
  const [titulos, setTitulos] = useState<OpcionCatalogo[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    obtenerCatalogosGenerales().then(c => setTitulos(c.bienTitulo)).catch(() => setTitulos([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = { receptor: { ...receptor, bienTitulo } as any, cuerpoDocumento: items, resumen: {} };

    try {
      const response = await enviarNotaRemision(data);
      if (response.success) {
        setToast({ type: 'success', message: `Nota de Remisión enviada. Código: ${response.codigoGeneracion}` });
      } else {
        setToast({ type: 'error', message: mensajeRechazo(response, 'Error al enviar la Nota de Remisión') });
      }
    } catch (error: any) {
      setToast({ type: 'error', message: mensajeError(error) });
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
          <ReceptorForm receptor={receptor} onChange={setReceptor} catalogoVigente datosContribuyente />
          <div className="mt-4 max-w-sm">
            <label className="label">Título a que se remiten los bienes *</label>
            <select className="input" value={bienTitulo} onChange={(e) => setBienTitulo(e.target.value)} required>
              <option value="">Seleccione</option>
              {titulos.map(t => <option key={t.codigo} value={t.codigo}>{t.nombre}</option>)}
            </select>
          </div>
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

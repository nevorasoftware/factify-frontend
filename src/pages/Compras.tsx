// src/pages/Compras.tsx
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Trash2, Calendar, FileText, User, Tag, 
  DollarSign, Loader2, X, Check, Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import { obtenerCompras, crearCompra } from '../services/compra.service';

export const Compras: React.FC = () => {
  const [compras, setCompras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal y form state
  const [showModal, setShowModal] = useState(false);
  const [expandedCompraId, setExpandedCompraId] = useState<number | null>(null);
  
  // Form fields
  const [proveedorNombre, setProveedorNombre] = useState('');
  const [proveedorDocumento, setProveedorDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('03'); // Default: Crédito Fiscal (03)
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().substring(0, 10));
  
  // Items de la compra
  const [items, setItems] = useState<any[]>([
    { descripcion: '', cantidad: 1, precioUnitario: 0 }
  ]);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const res = await obtenerCompras();
      if (res.success) {
        setCompras(res.compras || []);
      } else {
        setError(res.error || 'No se pudieron cargar las compras');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de red al cargar compras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  const handleOpenCreate = () => {
    setProveedorNombre('');
    setProveedorDocumento('');
    setTipoDocumento('03');
    setNumeroDocumento('');
    setFechaCompra(new Date().toISOString().substring(0, 10));
    setItems([{ descripcion: '', cantidad: 1, precioUnitario: 0 }]);
    setShowModal(true);
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { descripcion: '', cantidad: 1, precioUnitario: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          [field]: value
        };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (Number(item.cantidad || 0) * Number(item.precioUnitario || 0)), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar datos
    if (!proveedorNombre || !proveedorDocumento || !numeroDocumento || !fechaCompra) {
      alert('Todos los campos del encabezado son obligatorios.');
      return;
    }

    const invalidItem = items.find(item => !item.descripcion || Number(item.cantidad) <= 0 || Number(item.precioUnitario) <= 0);
    if (invalidItem) {
      alert('Todos los ítems de la compra deben tener descripción, cantidad mayor a 0 y precio unitario mayor a 0.');
      return;
    }

    try {
      const payload = {
        proveedorNombre,
        proveedorDocumento,
        tipoDocumento,
        numeroDocumento,
        fechaCompra,
        items: items.map(item => ({
          descripcion: item.descripcion,
          cantidad: Number(item.cantidad),
          precioUnitario: Number(item.precioUnitario)
        }))
      };

      const res = await crearCompra(payload);
      if (res.success) {
        setShowModal(false);
        fetchCompras();
      } else {
        alert(res.error || 'No se pudo guardar la compra');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error de red al guardar la compra');
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedCompraId(prev => prev === id ? null : id);
  };

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

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Registro de Compras</h1>
          <p className="text-gray-500 mt-1">Gestión y registro de compras vinculadas a documentos fiscales recibidos</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
        >
          <ShoppingCart size={18} /> Registrar Compra
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 flex items-center gap-3">
          <FileText size={20} className="shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Listado Compras */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-150 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-500 font-semibold">Cargando compras registradas...</p>
          </div>
        ) : compras.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <ShoppingCart className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold text-lg mb-1">No hay compras registradas</p>
            <p className="text-sm text-gray-400 mb-6">Registre las facturas o créditos fiscales que le emiten sus proveedores.</p>
            <button 
              onClick={handleOpenCreate}
              className="bg-primary-50 hover:bg-primary-100 text-primary-600 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Registrar Primera Compra
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {compras.map((compra) => {
              const isExpanded = expandedCompraId === compra.id;
              return (
                <div key={compra.id} className="p-6 hover:bg-gray-50/40 transition-colors">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-lg">{compra.proveedor_nombre}</span>
                        <span className="text-xs text-gray-400 font-mono">({compra.proveedor_documento})</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <FileText size={14} className="text-gray-400" /> 
                          <span className="font-semibold text-primary-700 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded text-xs uppercase">
                            {tipoDteMap[compra.tipo_documento] || compra.tipo_documento}
                          </span>
                        </span>
                        <span className="font-mono">Doc: <strong className="text-gray-700">{compra.numero_documento}</strong></span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} className="text-gray-400" /> 
                          {new Date(compra.fecha_compra).toLocaleDateString('es-SV', { timeZone: 'UTC' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end lg:self-center">
                      <div className="text-right">
                        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Monto Total</div>
                        <div className="text-2xl font-black text-gray-900">${Number(compra.monto_total).toFixed(2)}</div>
                      </div>
                      <button 
                        onClick={() => toggleExpand(compra.id)}
                        className="p-2 border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg transition-all"
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Items Colapsables */}
                  {isExpanded && (
                    <div className="mt-6 border-t border-gray-150 pt-4 animate-in slide-in-from-top-2 duration-200">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detalle de Ítems Comprados</h4>
                      <div className="bg-gray-50 rounded-lg border border-gray-150 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100/70">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Descripción</th>
                              <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase">Cantidad</th>
                              <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">P. Unitario</th>
                              <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-250 bg-white">
                            {compra.items?.map((item: any) => (
                              <tr key={item.id}>
                                <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{item.descripcion}</td>
                                <td className="px-4 py-2.5 text-sm text-gray-600 text-center font-mono">{Number(item.cantidad).toFixed(2)}</td>
                                <td className="px-4 py-2.5 text-sm text-gray-600 text-right font-mono">${Number(item.precio_unitario).toFixed(2)}</td>
                                <td className="px-4 py-2.5 text-sm font-bold text-gray-900 text-right font-mono">${Number(item.total).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Registrar Compra */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-150 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Registrar Nueva Compra</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Encabezado */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1.5">Datos del Documento Fiscal Recibido</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre / Razón Social Proveedor *</label>
                    <input 
                      type="text"
                      value={proveedorNombre}
                      onChange={(e) => setProveedorNombre(e.target.value)}
                      required
                      className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="Ej. Distribuidora El Salvador S.A."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">NIT / DUI Proveedor *</label>
                    <input 
                      type="text"
                      value={proveedorDocumento}
                      onChange={(e) => setProveedorDocumento(e.target.value)}
                      required
                      className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm font-mono"
                      placeholder="Ej. 0614-250890-101-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tipo de Documento Fiscal *</label>
                    <select 
                      value={tipoDocumento}
                      onChange={(e) => setTipoDocumento(e.target.value)}
                      className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="03">Comprobante de Crédito Fiscal (DTE-03)</option>
                      <option value="01">Factura Consumidor Final (DTE-01)</option>
                      <option value="14">Factura de Sujeto Excluido (DTE-14)</option>
                      <option value="05">Nota de Crédito (DTE-05)</option>
                      <option value="06">Nota de Débito (DTE-06)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">N° Control / Código *</label>
                      <input 
                        type="text"
                        value={numeroDocumento}
                        onChange={(e) => setNumeroDocumento(e.target.value)}
                        required
                        className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm font-mono"
                        placeholder="Ej. DTE-03-..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fecha Compra *</label>
                      <input 
                        type="date"
                        value={fechaCompra}
                        onChange={(e) => setFechaCompra(e.target.value)}
                        required
                        className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Cuerpo de la compra */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Productos / Servicios Adquiridos</h4>
                  <button 
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-primary-600 hover:text-primary-800 font-bold flex items-center gap-1 hover:underline"
                  >
                    + Agregar Fila
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1">
                        {index === 0 && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción / Producto *</label>}
                        <input 
                          type="text"
                          value={item.descripcion}
                          onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                          required
                          className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                          placeholder="Ej. Resma Papel o Licencia Software"
                        />
                      </div>

                      <div className="w-24">
                        {index === 0 && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 text-center">Cantidad *</label>}
                        <input 
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(index, 'cantidad', Number(e.target.value))}
                          required
                          min="1"
                          className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm text-center font-mono"
                        />
                      </div>

                      <div className="w-32">
                        {index === 0 && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 text-right">P. Unitario ($) *</label>}
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400 text-xs">$</span>
                          <input 
                            type="number"
                            step="0.01"
                            value={item.precioUnitario}
                            onChange={(e) => handleItemChange(index, 'precioUnitario', Number(e.target.value))}
                            required
                            min="0.01"
                            className="block w-full pl-6 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm text-right font-mono font-semibold"
                          />
                        </div>
                      </div>

                      <div className="w-28 text-right font-mono font-bold text-sm text-gray-900 pb-2">
                        {index === 0 && <div className="text-xs font-bold text-gray-500 uppercase tracking-wider text-right mb-2">Total</div>}
                        ${(Number(item.cantidad || 0) * Number(item.precioUnitario || 0)).toFixed(2)}
                      </div>

                      <div className="pb-1.5">
                        <button 
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          disabled={items.length === 1}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total final */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-150 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500 uppercase">Monto Total de la Compra</span>
                <span className="text-3xl font-black text-gray-900 font-mono">${calculateTotal().toFixed(2)}</span>
              </div>

              {/* Acciones */}
              <div className="pt-4 border-t border-gray-150 flex justify-end gap-3 bg-gray-50 -mx-6 -mb-6 p-6">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Check size={16} /> Registrar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

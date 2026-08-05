// src/pages/Inventario.tsx
import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Edit2, Trash2, Tag, Loader2, X, Check, DollarSign, ListFilter
} from 'lucide-react';
import { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto } from '../services/inventario.service';

export const Inventario: React.FC = () => {
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal y form state
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    precioUnitario: '',
    tipoItem: '1', // 1: Bien, 2: Servicio
    uniMedida: '59' // 59: Unidad
  });

  const [searchTerm, setSearchTerm] = useState('');

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await obtenerProductos();
      if (res.success) {
        setProductos(res.productos || []);
      } else {
        setError(res.error || 'No se pudieron cargar los productos');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de red al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenCreate = () => {
    setIsEdit(false);
    setSelectedId(null);
    setFormData({
      codigo: '',
      descripcion: '',
      precioUnitario: '',
      tipoItem: '1',
      uniMedida: '59'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (prod: any) => {
    setIsEdit(true);
    setSelectedId(prod.id);
    setFormData({
      codigo: prod.codigo || '',
      descripcion: prod.descripcion || '',
      precioUnitario: String(prod.precio_unitario) || '',
      tipoItem: String(prod.tipo_item) || '1',
      uniMedida: String(prod.uni_medida) || '59'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo || !formData.descripcion || formData.precioUnitario === '') {
      alert('Código, descripción y precio son obligatorios.');
      return;
    }

    try {
      const payload = {
        codigo: formData.codigo,
        descripcion: formData.descripcion,
        precioUnitario: Number(formData.precioUnitario),
        tipoItem: Number(formData.tipoItem),
        uniMedida: Number(formData.uniMedida)
      };

      let res;
      if (isEdit && selectedId !== null) {
        res = await actualizarProducto(selectedId, payload);
      } else {
        res = await crearProducto(payload);
      }

      if (res.success) {
        setShowModal(false);
        fetchProductos();
      } else {
        alert(res.error || 'Error al guardar el producto/servicio');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Ocurrió un error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este producto/servicio?')) return;
    try {
      const res = await eliminarProducto(id);
      if (res.success) {
        fetchProductos();
      } else {
        alert(res.error || 'No se pudo eliminar');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error de red al eliminar');
    }
  };

  const filteredProductos = productos.filter(p => 
    (p.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Inventario de Productos & Servicios</h1>
          <p className="text-gray-500 mt-1">Catálogo de bienes y servicios para agilizar la facturación</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
        >
          <Package size={18} /> Nuevo Item
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 flex items-center gap-3">
          <Tag size={20} className="shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Buscar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-150 p-4 mb-6">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Buscar por código o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm placeholder-gray-400"
          />
        </div>
      </div>

      {/* Tabla Listado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-150 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-500 font-semibold">Cargando inventario...</p>
          </div>
        ) : filteredProductos.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Package className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold text-lg mb-1">No hay productos en inventario</p>
            <p className="text-sm text-gray-400 mb-6">Cree productos o servicios para seleccionarlos fácilmente al facturar.</p>
            <button 
              onClick={handleOpenCreate}
              className="bg-primary-50 hover:bg-primary-100 text-primary-600 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Crear Item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Medida</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProductos.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50/55 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 font-mono">
                      {prod.codigo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-950 font-medium">
                      {prod.descripcion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        prod.tipo_item === 1 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {prod.tipo_item === 1 ? 'Bien' : 'Servicio'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ${Number(prod.precio_unitario).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prod.uni_medida === 59 ? 'Unidad (59)' : `Otro (${prod.uni_medida})`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1.5 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(prod.id)}
                          className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Agregar / Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-150 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">
                {isEdit ? 'Editar Producto/Servicio' : 'Nuevo Producto/Servicio'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Código *
                </label>
                <input 
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm font-mono"
                  placeholder="Ej. PROD-001 o SERV-01"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Descripción / Nombre del Item *
                </label>
                <input 
                  type="text"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Ej. Resma de Papel Bond Carta o Asesoría Legal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Precio Unitario ($) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-sm">
                      $
                    </div>
                    <input 
                      type="number"
                      step="0.01"
                      name="precioUnitario"
                      value={formData.precioUnitario}
                      onChange={handleInputChange}
                      required
                      className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Tipo de Item
                  </label>
                  <select 
                    name="tipoItem"
                    value={formData.tipoItem}
                    onChange={handleInputChange}
                    className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                  >
                    <option value="1">Bien (Producto)</option>
                    <option value="2">Servicio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Unidad de Medida (Código MH)
                </label>
                <select 
                  name="uniMedida"
                  value={formData.uniMedida}
                  onChange={handleInputChange}
                  className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="59">Unidad (59)</option>
                  <option value="39">Kilogramo (39)</option>
                  <option value="23">Gramo (23)</option>
                  <option value="18">Litro (18)</option>
                  <option value="58">Servicio Profesional (58)</option>
                </select>
              </div>

              {/* Acciones */}
              <div className="pt-4 border-t border-gray-150 flex justify-end gap-3 bg-gray-50 -mx-6 -mb-6 p-6 mt-6">
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
                  <Check size={16} /> Guardar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// src/pages/Clientes.tsx
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, Edit2, Trash2, Mail, Phone, MapPin, 
  FileText, ShieldAlert, Loader2, X, Check
} from 'lucide-react';
import { obtenerClientes, crearCliente, actualizarCliente, eliminarCliente } from '../services/cliente.service';

export const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal y form state
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipoDocumento: '36', // Default NIT
    numDocumento: '',
    nrc: '',
    nombreComercial: '',
    codActividad: '46900',
    descActividad: 'Otros servicios',
    correo: '',
    telefono: '',
    departamento: '01',
    municipio: '01',
    complemento: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const res = await obtenerClientes();
      if (res.success) {
        setClientes(res.clientes || []);
      } else {
        setError(res.error || 'No se pudieron cargar los clientes');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de red al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      nombre: '',
      tipoDocumento: '36',
      numDocumento: '',
      nrc: '',
      nombreComercial: '',
      codActividad: '46900',
      descActividad: 'Otros servicios',
      correo: '',
      telefono: '',
      departamento: '01',
      municipio: '01',
      complemento: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cliente: any) => {
    setIsEdit(true);
    setSelectedId(cliente.id);
    const dir = cliente.direccion || {};
    setFormData({
      nombre: cliente.nombre || '',
      tipoDocumento: cliente.tipo_documento || '36',
      numDocumento: cliente.num_documento || '',
      nrc: cliente.nrc || '',
      nombreComercial: cliente.nombre_comercial || '',
      codActividad: cliente.cod_actividad || '46900',
      descActividad: cliente.desc_actividad || 'Otros servicios',
      correo: cliente.correo || '',
      telefono: cliente.telefono || '',
      departamento: dir.departamento || '01',
      municipio: dir.municipio || '01',
      complemento: dir.complemento || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.numDocumento) {
      alert('Nombre y Número de Documento son obligatorios.');
      return;
    }

    try {
      const payload = {
        nombre: formData.nombre,
        tipoDocumento: formData.tipoDocumento,
        numDocumento: formData.numDocumento,
        nrc: formData.nrc || null,
        nombreComercial: formData.nombreComercial || null,
        codActividad: formData.codActividad || null,
        descActividad: formData.descActividad || null,
        correo: formData.correo || null,
        telefono: formData.telefono || null,
        direccion: {
          departamento: formData.departamento,
          municipio: formData.municipio,
          complemento: formData.complemento || 'San Salvador, El Salvador'
        }
      };

      let res;
      if (isEdit && selectedId !== null) {
        res = await actualizarCliente(selectedId, payload);
      } else {
        res = await crearCliente(payload);
      }

      if (res.success) {
        setShowModal(false);
        fetchClientes();
      } else {
        alert(res.error || 'Error al guardar el cliente');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Ocurrió un error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;
    try {
      const res = await eliminarCliente(id);
      if (res.success) {
        fetchClientes();
      } else {
        alert(res.error || 'No se pudo eliminar el cliente');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error de red al eliminar');
    }
  };

  const filteredClientes = clientes.filter(c => 
    (c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.num_documento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.nombre_comercial || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Clientes</h1>
          <p className="text-gray-500 mt-1">Gestión de receptores para emisión de documentos fiscales</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
        >
          <UserPlus size={18} /> Nuevo Cliente
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 flex items-center gap-3">
          <ShieldAlert size={20} className="shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Buscar y filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-150 p-4 mb-6">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Buscar por nombre, documento o nombre comercial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm placeholder-gray-400"
          />
        </div>
      </div>

      {/* Listado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-150 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-500 font-semibold">Cargando catálogo de clientes...</p>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <UserPlus className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold text-lg mb-1">No se encontraron clientes</p>
            <p className="text-sm text-gray-400 mb-6">Comience agregando su primer receptor fiscal para emitir documentos.</p>
            <button 
              onClick={handleOpenCreate}
              className="bg-primary-50 hover:bg-primary-100 text-primary-600 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Crear Cliente
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre / Razón Social</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Documento</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">NCR / NRC</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacto</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dirección</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50/55 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{cliente.nombre}</div>
                      {cliente.nombre_comercial && (
                        <div className="text-xs text-gray-400 mt-0.5">{cliente.nombre_comercial}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 uppercase">
                        {cliente.tipo_documento === '36' ? 'NIT' : cliente.tipo_documento === '13' ? 'DUI' : 'OTRO'}
                      </span>
                      <div className="text-sm font-semibold text-gray-900 mt-1 font-mono">{cliente.num_documento}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {cliente.nrc || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {cliente.correo && (
                        <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                          <Mail size={14} className="text-gray-400" /> {cliente.correo}
                        </div>
                      )}
                      {cliente.telefono && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Phone size={14} className="text-gray-400" /> {cliente.telefono}
                        </div>
                      )}
                      {!cliente.correo && !cliente.telefono && <span className="text-gray-300">Sin datos</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400 shrink-0" />
                        <span>
                          {cliente.direccion?.complemento || 'San Salvador'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEdit(cliente)}
                          className="p-1.5 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cliente.id)}
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
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-150 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">
                {isEdit ? 'Editar Cliente Receptor' : 'Nuevo Cliente Receptor'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Nombre Completo o Razón Social *
                  </label>
                  <input 
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="Ej. Juan Pérez o Distribuidora S.A."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Tipo de Documento *
                  </label>
                  <select 
                    name="tipoDocumento"
                    value={formData.tipoDocumento}
                    onChange={handleInputChange}
                    className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                  >
                    <option value="36">NIT (Persona Jurídica o Contribuyente)</option>
                    <option value="13">DUI (Consumidor Final)</option>
                    <option value="37">Pasaporte (Extranjero)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Número de Documento *
                  </label>
                  <input 
                    type="text"
                    name="numDocumento"
                    value={formData.numDocumento}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm font-mono"
                    placeholder="Ej. 0614-110285-102-4 o DUI"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    NRC (N° de Registro de Contribuyente)
                  </label>
                  <input 
                    type="text"
                    name="nrc"
                    value={formData.nrc}
                    onChange={handleInputChange}
                    className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm font-mono"
                    placeholder="Opcional. Ej. 123456-7"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Nombre Comercial
                  </label>
                  <input 
                    type="text"
                    name="nombreComercial"
                    value={formData.nombreComercial}
                    onChange={handleInputChange}
                    className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="Ej. Súper Tienda Juanito"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Código de Actividad MH
                  </label>
                  <input 
                    type="text"
                    name="codActividad"
                    value={formData.codActividad}
                    onChange={handleInputChange}
                    className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="Ej. 46900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Descripción de Actividad MH
                  </label>
                  <input 
                    type="text"
                    name="descActividad"
                    value={formData.descActividad}
                    onChange={handleInputChange}
                    className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="Ej. Venta al por menor"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Correo Electrónico
                  </label>
                  <input 
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleInputChange}
                    className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Teléfono
                  </label>
                  <input 
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="Ej. 2222-2222"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Departamento (Código MH)
                  </label>
                  <input 
                    type="text"
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleInputChange}
                    className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="Ej. 01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Municipio (Código MH)
                  </label>
                  <input 
                    type="text"
                    name="municipio"
                    value={formData.municipio}
                    onChange={handleInputChange}
                    className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="Ej. 01"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Dirección (Complemento)
                  </label>
                  <textarea 
                    name="complemento"
                    value={formData.complemento}
                    onChange={handleInputChange}
                    rows={2}
                    className="block w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="Ej. Calle Principal, Colonia San Benito, N° 123"
                  />
                </div>
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
                  <Check size={16} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

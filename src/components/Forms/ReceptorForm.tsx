// src/components/Forms/ReceptorForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Receptor, Direccion } from '../../types';
import { CATALOGOS } from '../../utils/catalogs';
import { obtenerClientes } from '../../services/cliente.service';
import { Search, ChevronDown, Check, Loader2 } from 'lucide-react';

interface ReceptorFormProps {
  receptor: Receptor;
  onChange: (receptor: Receptor) => void;
}

export const ReceptorForm: React.FC<ReceptorFormProps> = ({ receptor, onChange }) => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    obtenerClientes()
      .then(res => {
        if (res.success) {
          setClientes(res.clientes || []);
        }
      })
      .catch(err => console.error('Error cargando clientes en ReceptorForm:', err))
      .finally(() => setLoading(false));
  }, []);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (field: keyof Receptor, value: any) => {
    onChange({ ...receptor, [field]: value });
  };

  const handleDireccionChange = (field: keyof Direccion, value: string) => {
    onChange({
      ...receptor,
      direccion: { ...receptor.direccion, [field]: value }
    });
  };

  const handleSelectCliente = (cliente: any) => {
    const dir = cliente.direccion || {};
    onChange({
      nit: cliente.num_documento || '',
      nrc: cliente.nrc || '',
      nombre: cliente.nombre || '',
      codActividad: cliente.cod_actividad || null,
      descActividad: cliente.desc_actividad || null,
      direccion: {
        departamento: dir.departamento || '06',
        municipio: dir.municipio || '14',
        complemento: dir.complemento || ''
      },
      telefono: cliente.telefono || '',
      correo: cliente.correo || ''
    });
    setSearchTerm('');
    setShowDropdown(false);
  };

  const filteredClientes = clientes.filter(c => 
    (c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.num_documento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.nombre_comercial || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Selector de Cliente Autocomplete */}
      <div className="relative" ref={dropdownRef}>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
          Buscar Cliente Registrado
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </div>
          <input
            type="text"
            className="w-full pl-9 pr-8 py-2 border border-gray-350 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium"
            placeholder="Escriba para buscar por nombre o documento..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <ChevronDown size={16} />
          </button>
        </div>

        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 divide-y divide-gray-100">
            {filteredClientes.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 italic">
                No se encontraron clientes que coincidan
              </div>
            ) : (
              filteredClientes.map((cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  className="w-full text-left px-4 py-2.5 hover:bg-primary-50 hover:text-primary-900 transition-colors flex flex-col gap-0.5"
                  onClick={() => handleSelectCliente(cliente)}
                >
                  <span className="font-semibold text-gray-900 text-sm">{cliente.nombre}</span>
                  <span className="text-xs text-gray-400 font-mono">
                    {cliente.tipo_documento === '36' ? 'NIT' : 'DUI'}: {cliente.num_documento} {cliente.nombre_comercial ? `| ${cliente.nombre_comercial}` : ''}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Grid de Formulario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Número de Documento (NIT/DUI) *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-primary-500 focus:border-primary-500"
            value={receptor.nit || ''}
            onChange={(e) => handleChange('nit', e.target.value)}
            required
            placeholder="Ej. 0614-110285-102-4"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
            NRC
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-primary-500 focus:border-primary-500"
            value={receptor.nrc || ''}
            onChange={(e) => handleChange('nrc', e.target.value)}
            placeholder="Ej. 123456-7"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Nombre / Razón Social *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 font-semibold"
            value={receptor.nombre || ''}
            onChange={(e) => handleChange('nombre', e.target.value)}
            required
            placeholder="Ej. Distribuidora El Salvador S.A."
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Correo Electrónico
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
            value={receptor.correo || ''}
            onChange={(e) => handleChange('correo', e.target.value)}
            placeholder="correo@receptor.com"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Teléfono
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
            value={receptor.telefono || ''}
            onChange={(e) => handleChange('telefono', e.target.value)}
            placeholder="Ej. 2222-2222"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Departamento *
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
            value={receptor.direccion?.departamento || ''}
            onChange={(e) => handleDireccionChange('departamento', e.target.value)}
          >
            <option value="">Seleccione Departamento</option>
            {CATALOGOS.departamentos.map(depto => (
              <option key={depto.code} value={depto.code}>{depto.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Municipio (Código MH) *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
            value={receptor.direccion?.municipio || ''}
            onChange={(e) => handleDireccionChange('municipio', e.target.value)}
            placeholder="Ej. 14"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Dirección Completa (Complemento) *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
            value={receptor.direccion?.complemento || ''}
            onChange={(e) => handleDireccionChange('complemento', e.target.value)}
            required
            placeholder="Ej. Calle Principal N° 12, San Salvador"
          />
        </div>
      </div>
    </div>
  );
};

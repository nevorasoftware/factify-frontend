// src/components/Forms/ItemsTable.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, Search, Package, ChevronDown } from 'lucide-react';
import { Item } from '../../types';
import { CATALOGOS } from '../../utils/catalogs';
import { formatCurrency } from '../../utils/formatters';
import { obtenerProductos } from '../../services/inventario.service';

interface ItemsTableProps {
  items: Item[];
  onChange: (items: Item[]) => void;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({ items, onChange }) => {
  const [productos, setProductos] = useState<any[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    obtenerProductos()
      .then(res => {
        if (res.success) {
          setProductos(res.productos || []);
        }
      })
      .catch(err => console.error('Error cargando inventario en ItemsTable:', err));
  }, []);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveSearchIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateItem = (index: number, field: keyof Item, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'cantidad' || field === 'precioUni' || field === 'montoDescu' || field === 'descripcion') {
      const item = newItems[index];
      const cantidad = Number(item.cantidad || 0);
      const precio = Number(item.precioUni || 0);
      const descu = Number(item.montoDescu || 0);
      item.ventaGravada = (cantidad * precio) - descu;
    }
    
    onChange(newItems);
  };

  const handleSelectProduct = (index: number, prod: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      codigo: prod.codigo || null,
      descripcion: prod.descripcion || '',
      precioUni: Number(prod.precio_unitario) || 0,
      uniMedida: Number(prod.uni_medida) || 59
    };
    
    // Recalcular subtotal de la fila
    const item = newItems[index];
    const cantidad = Number(item.cantidad || 0);
    const precio = Number(item.precioUni || 0);
    const descu = Number(item.montoDescu || 0);
    item.ventaGravada = (cantidad * precio) - descu;

    onChange(newItems);
    setActiveSearchIndex(null);
    setItemSearchTerm('');
  };

  const addItem = () => {
    onChange([
      ...items,
      {
        numItem: items.length + 1,
        tipoItem: 1,
        cantidad: 1,
        codigo: null,
        uniMedida: 59,
        descripcion: '',
        precioUni: 0,
        montoDescu: 0,
        ventaGravada: 0
      }
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    newItems.forEach((item, i) => { item.numItem = i + 1; });
    onChange(newItems);
  };

  const calcularTotales = () => {
    const subtotal = items.reduce((sum, item) => sum + item.ventaGravada, 0);
    const iva = subtotal * 0.13;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const { subtotal, iva, total } = calcularTotales();

  // Filtrar productos del inventario por la cadena de búsqueda activa
  const filteredProducts = productos.filter(p =>
    (p.descripcion || '').toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
    (p.codigo || '').toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Productos/Servicios</h3>
          <p className="text-xs text-gray-500">Añada los ítems a facturar, puede buscarlos del inventario o escribirlos directamente</p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <Plus size="14" /> Agregar Ítem
        </button>
      </div>

      <div className="overflow-visible" ref={dropdownRef}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-80">Descripción / Búsqueda</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Unidad</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Descuento</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                <td className="px-3 py-4 text-sm font-semibold text-gray-400 font-mono">{item.numItem}</td>
                <td className="px-3 py-4 relative">
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full rounded-lg border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500 font-semibold"
                      value={item.descripcion}
                      onChange={(e) => {
                        updateItem(idx, 'descripcion', e.target.value);
                        setItemSearchTerm(e.target.value);
                        setActiveSearchIndex(idx);
                      }}
                      onFocus={() => {
                        setItemSearchTerm(item.descripcion);
                        setActiveSearchIndex(idx);
                      }}
                      required
                      placeholder="Escriba descripción o busque producto..."
                    />
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-gray-400">
                      <Search size={14} />
                    </div>
                  </div>

                  {/* Dropdown Autocomplete de Productos */}
                  {activeSearchIndex === idx && (
                    <div className="absolute z-30 left-3 right-3 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-52 overflow-y-auto divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
                      {filteredProducts.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-500 italic">
                          No se encontraron productos en inventario
                        </div>
                      ) : (
                        filteredProducts.map((prod) => (
                          <button
                            key={prod.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-primary-50 hover:text-primary-900 transition-colors flex justify-between items-center gap-2"
                            onClick={() => handleSelectProduct(idx, prod)}
                          >
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="font-bold text-gray-900 text-xs truncate">{prod.descripcion}</span>
                              <span className="text-[10px] text-gray-400 font-mono">Cód: {prod.codigo}</span>
                            </div>
                            <span className="font-black text-xs text-gray-950 shrink-0 font-mono">
                              ${Number(prod.precio_unitario).toFixed(2)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-4">
                  <input
                    type="number"
                    step="0.01"
                    className="w-20 rounded-lg border-gray-300 text-sm font-mono text-center"
                    value={item.cantidad}
                    onChange={(e) => updateItem(idx, 'cantidad', parseFloat(e.target.value) || 0)}
                    required
                    min="0.01"
                  />
                </td>
                <td className="px-3 py-4">
                  <select
                    className="w-28 rounded-lg border-gray-300 text-sm"
                    value={item.uniMedida}
                    onChange={(e) => updateItem(idx, 'uniMedida', parseInt(e.target.value))}
                  >
                    {CATALOGOS.unidadMedida.map(um => (
                      <option key={um.code} value={um.code}>{um.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-4">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-28 rounded-lg border-gray-300 text-sm pl-6 pr-2 font-mono font-semibold"
                      value={item.precioUni}
                      onChange={(e) => updateItem(idx, 'precioUni', parseFloat(e.target.value) || 0)}
                      required
                      min="0"
                    />
                  </div>
                </td>
                <td className="px-3 py-4">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-24 rounded-lg border-gray-300 text-sm pl-6 pr-2 font-mono"
                      value={item.montoDescu}
                      onChange={(e) => updateItem(idx, 'montoDescu', parseFloat(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                </td>
                <td className="px-3 py-4 text-sm font-black text-gray-900 font-mono">
                  ${formatCurrency(item.ventaGravada)}
                </td>
                <td className="px-3 py-4">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    disabled={items.length === 1}
                  >
                    <Trash2 size="16" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-150">
        <div className="w-80 space-y-2 bg-gray-50 rounded-xl p-4 border border-gray-150">
          <div className="flex justify-between py-1 text-sm font-semibold">
            <span className="text-gray-500">Subtotal:</span>
            <span className="font-mono text-gray-900">${formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between py-1 text-sm font-semibold">
            <span className="text-gray-500">IVA (13%):</span>
            <span className="font-mono text-gray-900">${formatCurrency(iva)}</span>
          </div>
          <div className="flex justify-between py-2 border-t border-gray-250 items-center">
            <span className="text-base font-bold text-gray-800">Total a Pagar:</span>
            <span className="text-2xl font-black text-primary-600 font-mono">${formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// src/components/Forms/TotalesCard.tsx
import React from 'react';
import { Pago } from '../../types';
import { CATALOGOS } from '../../utils/catalogs';
import { formatCurrency, numeroALetras } from '../../utils/formatters';

interface TotalesCardProps {
  subtotal: number;
  iva: number;
  total: number;
  condicionOperacion: number;
  pagos: Pago[];
  onCondicionChange: (value: number) => void;
  onPagosChange: (pagos: Pago[]) => void;
}

export const TotalesCard: React.FC<TotalesCardProps> = ({
  subtotal,
  iva,
  total,
  condicionOperacion,
  pagos,
  onCondicionChange,
  onPagosChange
}) => {
  const handlePagoChange = (index: number, field: keyof Pago, value: any) => {
    const newPagos = [...pagos];
    newPagos[index] = { ...newPagos[index], [field]: value };
    onPagosChange(newPagos);
  };

  const addPago = () => {
    onPagosChange([
      ...pagos,
      { codigo: '01', montoPago: 0, referencia: null, plazo: null, periodo: null }
    ]);
  };

  const removePago = (index: number) => {
    onPagosChange(pagos.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <div>
        <label className="label">Condición de la Operación</label>
        <select
          className="input w-48"
          value={condicionOperacion}
          onChange={(e) => onCondicionChange(parseInt(e.target.value))}
        >
          {CATALOGOS.condicionOperacion.map(op => (
            <option key={op.code} value={op.code}>{op.name}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="label">Formas de Pago</label>
          <button
            type="button"
            onClick={addPago}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            + Agregar
          </button>
        </div>
        {pagos.map((pago, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <select
              className="input w-40"
              value={pago.codigo}
              onChange={(e) => handlePagoChange(idx, 'codigo', e.target.value)}
            >
              {CATALOGOS.formaPago.map(fp => (
                <option key={fp.code} value={fp.code}>{fp.name}</option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              className="input w-32"
              placeholder="Monto"
              value={pago.montoPago}
              onChange={(e) => handlePagoChange(idx, 'montoPago', parseFloat(e.target.value) || 0)}
            />
            {condicionOperacion === 2 && (
              <>
                <input
                  type="number"
                  className="input w-20"
                  placeholder="Plazo"
                  value={pago.periodo || ''}
                  onChange={(e) => handlePagoChange(idx, 'periodo', e.target.value)}
                />
                <select
                  className="input w-28"
                  value={pago.plazo || ''}
                  onChange={(e) => handlePagoChange(idx, 'plazo', e.target.value)}
                >
                  <option value="">Seleccione</option>
                  {CATALOGOS.plazo.map(pl => (
                    <option key={pl.code} value={pl.code}>{pl.name}</option>
                  ))}
                </select>
              </>
            )}
            {pagos.length > 1 && (
              <button
                type="button"
                onClick={() => removePago(idx)}
                className="text-red-600 hover:text-red-800"
              >
                Eliminar
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 mt-4">
        <div className="space-y-2 flex-1">
          <h3 className="text-sm font-semibold text-indigo-200 uppercase tracking-widest">Resumen del Documento</h3>
          <div className="text-2xl font-black text-white">{numeroALetras(total)}</div>
          <p className="text-xs text-indigo-300">
            Subtotal: <strong>${formatCurrency(subtotal)}</strong> | IVA (13%): <strong>${formatCurrency(iva)}</strong>
          </p>
        </div>
        <div className="flex gap-4 self-center md:self-auto border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
          <div className="text-right">
            <span className="text-xs text-indigo-200 font-medium block">Total a Pagar</span>
            <span className="text-4xl font-extrabold text-emerald-400 font-mono">${formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

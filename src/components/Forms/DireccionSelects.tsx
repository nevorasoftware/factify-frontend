// src/components/Forms/DireccionSelects.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface OpcionCatalogo {
  codigo: string;
  nombre: string;
}

interface DepartamentoCatalogo extends OpcionCatalogo {
  municipios: OpcionCatalogo[];
  distritos: OpcionCatalogo[];
}

interface ValorDireccion {
  departamento: string;
  municipio: string;
  distrito?: string;
}

interface DireccionSelectsProps {
  valor: ValorDireccion;
  onChange: (cambios: { departamento: string; municipio: string; distrito: string }) => void;
  requerido?: boolean;
  claseEtiqueta?: string;
  claseCampo?: string;
}

let cache: Promise<DepartamentoCatalogo[]> | null = null;

const cargarTerritorio = (): Promise<DepartamentoCatalogo[]> => {
  if (!cache) {
    cache = api.get('/catalogos/territorio').then(res => res.data.departamentos);
    cache.catch(() => { cache = null; });
  }
  return cache;
};

const ETIQUETA = 'text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1';
const CAMPO = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500';

// Catálogos vigentes de Hacienda: un código anterior a la reforma territorial aparece sin seleccionar.
export const DireccionSelects: React.FC<DireccionSelectsProps> = ({
  valor,
  onChange,
  requerido = false,
  claseEtiqueta = ETIQUETA,
  claseCampo = CAMPO
}) => {
  const [departamentos, setDepartamentos] = useState<DepartamentoCatalogo[]>([]);

  useEffect(() => {
    cargarTerritorio().then(setDepartamentos).catch(err => console.error('Error cargando catálogo territorial:', err));
  }, []);

  const departamento = departamentos.find(d => d.codigo === valor.departamento);
  const municipio = departamento?.municipios.some(m => m.codigo === valor.municipio) ? valor.municipio : '';
  const distrito = departamento?.distritos.some(d => d.codigo === valor.distrito) ? (valor.distrito as string) : '';

  return (
    <>
      <div>
        <label className={claseEtiqueta}>Departamento{requerido ? ' *' : ''}</label>
        <select
          className={claseCampo}
          value={departamento ? valor.departamento : ''}
          required={requerido}
          onChange={(e) => onChange({ departamento: e.target.value, municipio: '', distrito: '' })}
        >
          <option value="">Seleccione departamento</option>
          {departamentos.map(d => <option key={d.codigo} value={d.codigo}>{d.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className={claseEtiqueta}>Municipio{requerido ? ' *' : ''}</label>
        <select
          className={claseCampo}
          value={municipio}
          required={requerido}
          disabled={!departamento}
          onChange={(e) => onChange({ departamento: valor.departamento, municipio: e.target.value, distrito })}
        >
          <option value="">Seleccione municipio</option>
          {departamento?.municipios.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className={claseEtiqueta}>Distrito{requerido ? ' *' : ''}</label>
        <select
          className={claseCampo}
          value={distrito}
          required={requerido}
          disabled={!departamento}
          onChange={(e) => onChange({ departamento: valor.departamento, municipio, distrito: e.target.value })}
        >
          <option value="">Seleccione distrito</option>
          {departamento?.distritos.map(d => <option key={d.codigo} value={d.codigo}>{d.nombre}</option>)}
        </select>
      </div>
    </>
  );
};

// src/services/catalogos.service.ts
import { api } from './api';

export interface OpcionCatalogo {
  codigo: string;
  nombre: string;
}

export interface CatalogosGenerales {
  paises: OpcionCatalogo[];
  recintos: OpcionCatalogo[];
  regimenes: OpcionCatalogo[];
  tiposRegimen: OpcionCatalogo[];
  incoterms: OpcionCatalogo[];
  bienTitulo: OpcionCatalogo[];
  tiposEstablecimiento: OpcionCatalogo[];
}

let cache: Promise<CatalogosGenerales> | null = null;

export function obtenerCatalogosGenerales(): Promise<CatalogosGenerales> {
  if (!cache) {
    cache = api.get('/catalogos/generales').then(r => r.data).catch((e: any) => { cache = null; throw e; });
  }
  return cache as Promise<CatalogosGenerales>;
}

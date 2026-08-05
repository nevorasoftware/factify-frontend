// src/services/consulta.service.ts
import { api } from './api';

export async function consultarDTE(tipoDte: string, codigoGeneracion: string): Promise<any> {
  const response = await api.post('/consulta-dte', { tipoDte, codigoGeneracion });
  return response.data;
}

export async function consultarLote(codigoLote: string): Promise<any> {
  const response = await api.get(`/consulta-lote/${codigoLote}`);
  return response.data;
}

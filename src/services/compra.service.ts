// src/services/compra.service.ts
import { api } from './api';

export async function obtenerCompras(): Promise<any> {
  const response = await api.get('/compras');
  return response.data;
}

export async function crearCompra(compra: any): Promise<any> {
  const response = await api.post('/compras', compra);
  return response.data;
}

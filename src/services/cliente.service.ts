// src/services/cliente.service.ts
import { api } from './api';

export async function obtenerClientes(): Promise<any> {
  const response = await api.get('/clientes');
  return response.data;
}

export async function crearCliente(cliente: any): Promise<any> {
  const response = await api.post('/clientes', cliente);
  return response.data;
}

export async function actualizarCliente(id: number, cliente: any): Promise<any> {
  const response = await api.put(`/clientes/${id}`, cliente);
  return response.data;
}

export async function eliminarCliente(id: number): Promise<any> {
  const response = await api.delete(`/clientes/${id}`);
  return response.data;
}

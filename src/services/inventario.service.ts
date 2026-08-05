// src/services/inventario.service.ts
import { api } from './api';

export async function obtenerProductos(): Promise<any> {
  const response = await api.get('/productos');
  return response.data;
}

export async function crearProducto(producto: any): Promise<any> {
  const response = await api.post('/productos', producto);
  return response.data;
}

export async function actualizarProducto(id: number, producto: any): Promise<any> {
  const response = await api.put(`/productos/${id}`, producto);
  return response.data;
}

export async function eliminarProducto(id: number): Promise<any> {
  const response = await api.delete(`/productos/${id}`);
  return response.data;
}

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

export async function obtenerConexionCorreo(): Promise<any> {
  const response = await api.get('/compras/correo/conexion');
  return response.data;
}

export async function conectarCorreo(host: string, password: string): Promise<any> {
  const response = await api.put('/compras/correo/conexion', { host, password });
  return response.data;
}

export async function desconectarCorreo(): Promise<any> {
  const response = await api.delete('/compras/correo/conexion');
  return response.data;
}

export async function iniciarLecturaCorreo(periodo: 'TODO' | 'MES' | 'DIA'): Promise<any> {
  const response = await api.post('/compras/correo/importar', { periodo });
  return response.data;
}

export async function obtenerLecturaCorreo(id: number): Promise<any> {
  const response = await api.get(`/compras/correo/importar/${id}`);
  return response.data;
}

export async function descargarArchivoCompra(compra: any, tipo: 'json' | 'pdf'): Promise<void> {
  const response = await api.get(`/compras/${compra.id}/archivos/${tipo}`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${compra.numero_documento}.${tipo}`;
  enlace.click();
  URL.revokeObjectURL(url);
}

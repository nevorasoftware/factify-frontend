// src/services/contabilidad.service.ts
import { api } from './api';

export async function obtenerReporteContable(periodo: string): Promise<any> {
  const response = await api.get(`/contabilidad/${periodo}`);
  return response.data;
}

export async function guardarConfiguracionContable(configuracion: any): Promise<any> {
  const response = await api.put('/contabilidad/configuracion', configuracion);
  return response.data;
}

export async function guardarAjustesContables(periodo: string, ajustes: any): Promise<any> {
  const response = await api.put(`/contabilidad/${periodo}/ajustes`, ajustes);
  return response.data;
}

export async function guardarDatosCompra(id: number, datos: any): Promise<any> {
  const response = await api.put(`/compras/${id}/contable`, datos);
  return response.data;
}

export async function descargarAnexo(periodo: string, clave: string): Promise<void> {
  const response = await api.get(`/contabilidad/${periodo}/anexos/${clave}`, { responseType: 'blob' });
  const disposicion = String(response.headers['content-disposition'] || '');
  const url = URL.createObjectURL(response.data);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = disposicion.match(/filename="([^"]+)"/)?.[1] || `${clave}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}

// src/services/dte.service.ts
import { api } from './api';
import { Receptor, Item, DocumentoRelacionado, EnvioResponse } from '../types';

// Helper para adjuntar el Emisor configurado a todas las peticiones
function withEmisor(data: any) {
  const saved = localStorage.getItem('emisorConfig');
  if (saved) {
    data.emisor = JSON.parse(saved);
  }
  return data;
}

// Factura
export async function enviarFactura(data: {
  receptor: Receptor;
  cuerpoDocumento: Item[];
  resumen: any;
  idEnvio?: number;
}): Promise<EnvioResponse> {
  const response = await api.post('/factura', withEmisor(data));
  return response.data;
}

// CCF
export async function enviarCCF(data: {
  receptor: Receptor;
  cuerpoDocumento: Item[];
  resumen: any;
  idEnvio?: number;
}): Promise<EnvioResponse> {
  const response = await api.post('/ccf', withEmisor(data));
  return response.data;
}

// Nota de Crédito
export async function enviarNotaCredito(data: {
  receptor: Receptor;
  documentoRelacionado: DocumentoRelacionado[];
  cuerpoDocumento: Item[];
  resumen: any;
  idEnvio?: number;
}): Promise<EnvioResponse> {
  const response = await api.post('/nota-credito', withEmisor(data));
  return response.data;
}

// Nota de Débito
export async function enviarNotaDebito(data: {
  receptor: Receptor;
  documentoRelacionado: DocumentoRelacionado[];
  cuerpoDocumento: Item[];
  resumen: any;
  idEnvio?: number;
}): Promise<EnvioResponse> {
  const response = await api.post('/nota-debito', withEmisor(data));
  return response.data;
}

// Nota de Remisión
export async function enviarNotaRemision(data: {
  receptor: Receptor;
  cuerpoDocumento: Item[];
  resumen: any;
  idEnvio?: number;
}): Promise<EnvioResponse> {
  const response = await api.post('/nota-remision', withEmisor(data));
  return response.data;
}

// Comprobante de Retención
export async function enviarComprobanteRetencion(data: {
  receptor: Receptor;
  cuerpoDocumento: any[];
  resumen: any;
  idEnvio?: number;
}): Promise<EnvioResponse> {
  const response = await api.post('/comprobante-retencion', withEmisor(data));
  return response.data;
}

// Comprobante de Liquidacion
export async function enviarComprobanteLiquidacion(data: any): Promise<EnvioResponse> {
  const response = await api.post('/comprobante-liquidacion', withEmisor(data));
  return response.data;
}

// Documento Contable Liquidacion
export async function enviarDocumentoContableLiquidacion(data: any): Promise<EnvioResponse> {
  const response = await api.post('/documento-contable-liquidacion', withEmisor(data));
  return response.data;
}

// Factura de Exportación
export async function enviarFacturaExportacion(data: {
  receptor: any;
  cuerpoDocumento: Item[];
  resumen: any;
  otrosDocumentos?: any[];
  idEnvio?: number;
}): Promise<EnvioResponse> {
  const response = await api.post('/factura-exportacion', withEmisor(data));
  return response.data;
}

// Factura Sujeto Excluido
export async function enviarFacturaSujetoExcluido(data: any): Promise<EnvioResponse> {
  const response = await api.post('/factura-sujeto-excluido', withEmisor(data));
  return response.data;
}

// Comprobante de Donación
export async function enviarComprobanteDonacion(data: {
  receptor: any;
  cuerpoDocumento: any[];
  resumen: any;
  otrosDocumentos?: any[];
  idEnvio?: number;
}): Promise<EnvioResponse> {
  const response = await api.post('/comprobante-donacion', withEmisor(data));
  return response.data;
}

// Evento de Invalidación
export async function enviarEventoInvalidacion(data: {
  identificacionDocumento: any;
  motivo: any;
  idEnvio?: number;
}): Promise<EnvioResponse> {
  const response = await api.post('/evento-invalidacion', data);
  return response.data;
}

// Evento de Contingencia
export async function enviarEventoContingencia(data: {
  contingencia: any;
  idEnvio?: number;
}): Promise<EnvioResponse> {
  const response = await api.post('/evento-contingencia', data);
  return response.data;
}

// Obtener estadísticas del dashboard
export async function obtenerDashboardStats(): Promise<any> {
  const response = await api.get('/dashboard/stats');
  return response.data;
}

// Obtener información de un DTE relacionado
export async function obtenerDteInfo(codigoGeneracion: string): Promise<any> {
  const response = await api.get(`/dte-info/${codigoGeneracion}`);
  return response.data;
}

// Reenviar correo con PDF y JSON adjuntos
export async function reenviarCorreoDte(codigoGeneracion: string, correoDestino?: string): Promise<any> {
  const response = await api.post(`/dtes/${codigoGeneracion}/reenviar-correo`, { correoDestino });
  return response.data;
}


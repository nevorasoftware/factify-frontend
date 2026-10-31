// src/services/empresas.service.ts
import { api } from './api';

export interface Empresa {
  id: number;
  nit: string;
  nrc: string | null;
  razonSocial: string | null;
  nombreComercial: string | null;
  codActividad: string | null;
  descActividad: string | null;
  direccion: { departamento?: string; municipio?: string; distrito?: string; complemento?: string } | null;
  telefono: string | null;
  correo: string | null;
  ambiente: string;
  codEstablecimientoMh: string | null;
  codPuntoVentaMh: string | null;
  dtesVisibles: string[];
  activo: boolean;
  esAdmin: boolean;
  cuentaActivada: boolean;
  tienePwdMh: boolean;
  tienePwdFirmador: boolean;
  certificado: { huella: string; venceAt: string | null; cargadoAt: string } | null;
  documentos: Record<string, number>;
}

export interface Verificacion {
  ambiente: string;
  firma: { ok: boolean; mensaje: string };
  hacienda: { ok: boolean; mensaje: string };
}

export const listarEmpresas = async (): Promise<Empresa[]> => (await api.get('/admin/empresas')).data.empresas;
export const crearEmpresa = async (datos: any): Promise<Empresa> => (await api.post('/admin/empresas', datos)).data.empresa;
export const actualizarEmpresa = async (id: number, datos: any): Promise<Empresa> => (await api.put(`/admin/empresas/${id}`, datos)).data.empresa;
export const subirCertificado = async (id: number, contenido: string, clave: string) => (await api.post(`/admin/empresas/${id}/certificado`, { contenido, clave })).data.certificado;
export const verificarEmpresa = async (id: number): Promise<Verificacion> => (await api.post(`/admin/empresas/${id}/verificar`)).data;
export const invitarEmpresa = async (id: number): Promise<{ correo: string }> => (await api.post(`/admin/empresas/${id}/invitar`)).data;

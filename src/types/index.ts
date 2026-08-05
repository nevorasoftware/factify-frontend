// src/types/index.ts

export interface Direccion {
  departamento: string;
  municipio: string;
  complemento: string;
}

export interface Receptor {
  nit: string;
  nrc: string | null;
  nombre: string;
  codActividad: string | null;
  descActividad: string | null;
  direccion: Direccion;
  telefono: string;
  correo: string;
  nombreComercial?: string;
  tipoDocumento?: string;
  numDocumento?: string;
}

export interface Item {
  numItem: number;
  tipoItem: number;
  cantidad: number;
  codigo: string | null;
  uniMedida: number;
  descripcion: string;
  precioUni: number;
  montoDescu: number;
  ventaGravada: number;
  tributos?: string[];
}

export interface Pago {
  codigo: string;
  montoPago: number;
  referencia: string | null;
  plazo: string | null;
  periodo: string | null;
}

export interface DocumentoRelacionado {
  tipoDocumento: string;
  tipoGeneracion: number;
  numeroDocumento: string;
  fechaEmision: string;
}

export interface EnvioDTE {
  codigoGeneracion: string;
  selloRecibido: string;
  fhProcesamiento: string;
  estado: string;
  descripcionMsg: string;
}

export interface EnvioResponse {
  success: boolean;
  codigoGeneracion?: string;
  resultado?: EnvioDTE;
  error?: string;
}

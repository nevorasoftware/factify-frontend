// src/utils/errores.ts

const conDetalles = (mensaje: string, detalles?: string[]): string =>
  detalles && detalles.length > 0 ? `${mensaje}: ${detalles.join('; ')}` : mensaje;

// Error de red o respuesta 4xx/5xx del backend.
export const mensajeError = (error: any): string => {
  const datos = error?.response?.data;
  if (datos?.error) return conDetalles(datos.error, datos.detalles);
  return error?.message || 'Error de conexión';
};

// Respuesta 200 con success=false: incluye el motivo que dio Hacienda.
export const mensajeRechazo = (respuesta: any, porDefecto: string): string => {
  const resultado = respuesta?.resultado;
  if (resultado?.descripcionMsg) return conDetalles(resultado.descripcionMsg, resultado.observaciones);
  return respuesta?.error || porDefecto;
};

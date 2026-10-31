// src/utils/contingencia.ts

export interface ModoContingencia {
  tipoContingencia: number;
  motivoContin: string | null;
  fInicio: string;
  hInicio: string;
}

const EVENTO = 'modoContingenciaCambio';

// Por empresa: si dos empresas usan el mismo navegador, la contingencia de una no afecta a la otra.
function clave(): string {
  try {
    return `modoContingencia:${JSON.parse(localStorage.getItem('emisor') || '{}').nit || ''}`;
  } catch {
    return 'modoContingencia:';
  }
}

export function leerModoContingencia(): ModoContingencia | null {
  try {
    const guardado = localStorage.getItem(clave());
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

export function guardarModoContingencia(modo: ModoContingencia | null): void {
  if (modo) localStorage.setItem(clave(), JSON.stringify(modo));
  else localStorage.removeItem(clave());
  window.dispatchEvent(new Event(EVENTO));
}

export function escucharModoContingencia(accion: () => void): () => void {
  window.addEventListener(EVENTO, accion);
  return () => window.removeEventListener(EVENTO, accion);
}

// Fecha y hora actuales de El Salvador, en el formato que exige Hacienda.
export function ahoraEnElSalvador(): { fecha: string; hora: string } {
  const ahora = new Date();
  return {
    fecha: ahora.toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' }),
    hora: ahora.toLocaleTimeString('en-GB', { timeZone: 'America/El_Salvador', hour12: false })
  };
}

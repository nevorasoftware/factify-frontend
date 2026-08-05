// src/utils/formatters.ts

export function numeroALetras(numero: number): string {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const especiales = ['ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  
  const entero = Math.floor(numero);
  const decimal = Math.round((numero - entero) * 100);
  
  const convertirEntero = (n: number): string => {
    if (n === 0) return 'CERO';
    if (n === 100) return 'CIEN';
    
    let resultado = '';
    
    if (n >= 1000) {
      const miles = Math.floor(n / 1000);
      if (miles === 1) resultado += 'MIL ';
      else resultado += unidades[miles] + ' MIL ';
      n %= 1000;
    }
    
    if (n >= 100) {
      const centenas = Math.floor(n / 100);
      if (centenas === 1) resultado += 'CIENTO ';
      else if (centenas === 5) resultado += 'QUINIENTOS ';
      else if (centenas === 7) resultado += 'SETECIENTOS ';
      else if (centenas === 9) resultado += 'NOVECIENTOS ';
      else resultado += unidades[centenas] + 'CIENTOS ';
      n %= 100;
    }
    
    if (n >= 11 && n <= 19) {
      resultado += especiales[n - 11] + ' ';
      n = 0;
    } else if (n >= 20) {
      const decena = Math.floor(n / 10);
      resultado += decenas[decena] + ' ';
      n %= 10;
      if (n > 0) resultado += 'Y ';
    }
    
    if (n > 0 && n < 11) {
      resultado += unidades[n] + ' ';
    }
    
    return resultado.trim();
  };
  
  const parteEntera = convertirEntero(entero);
  const parteDecimal = decimal.toString().padStart(2, '0');
  
  return `${parteEntera} ${parteDecimal}/100 DOLARES USD`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

export function formatNIT(nit: string): string {
  if (!nit) return '';
  return nit.replace(/(\d{4})(\d{6})(\d{3})(\d{1})/, '$1-$2-$3-$4');
}

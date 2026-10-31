// src/utils/pruebasHacienda.ts
// Documentos de prueba por tipo. Montos mínimos y texto "SIN VALOR"; solo se envían en el ambiente 00.

export interface ContextoPrueba {
  hoy: string;
  numero: number;
  cliente: any;
  correo: string;
  ccf: { codigo: string; fecha: string } | null;
}

export interface TipoPrueba {
  clave: string;
  nombre: string;
  ruta?: string;
  cuerpo?: (c: ContextoPrueba) => any;
}

const DIRECCION = { departamento: '06', municipio: '23', distrito: '14' };

const item = (texto: string, precioUni = 1) => ({
  descripcion: `PRUEBA ${texto} - SIN VALOR`, cantidad: 1, precioUni, uniMedida: 59
});

const receptorCliente = ({ cliente, correo }: ContextoPrueba) => ({
  nit: cliente.num_documento,
  tipoDocumento: '36',
  nrc: cliente.nrc,
  nombre: cliente.nombre,
  nombreComercial: cliente.nombre_comercial,
  codActividad: cliente.cod_actividad,
  descActividad: cliente.desc_actividad,
  direccion: { ...DIRECCION, complemento: cliente.direccion?.complemento || 'Prueba sin valor' },
  telefono: null,
  correo
});

const fisico = (c: ContextoPrueba, sufijo = '') => ({
  tipoGeneracion: 1, numeroDocumento: `PRUEBA-${c.numero}${sufijo}`, fechaEmision: c.hoy
});

const relacionado = (c: ContextoPrueba) => [{
  tipoDocumento: '03', tipoGeneracion: 2, numeroDocumento: c.ccf?.codigo, fechaEmision: c.ccf?.fecha
}];

const extranjero = (correo: string) => ({
  nombre: 'PRUEBA EXTRANJERO SIN VALOR', tipoDocumento: '37', numDocumento: 'PRUEBA01', descActividad: 'Prueba sin valor',
  nombreComercial: null, codPais: 'US', nombrePais: 'Estados Unidos', complemento: 'Prueba sin valor', tipoPersona: 2, telefono: null, correo
});

export const facturaPrueba = (c: ContextoPrueba, texto = 'FE') => ({
  receptor: { correo: c.correo },
  cuerpoDocumento: [item(texto, 1.13)],
  resumen: { pagos: [{ codigo: '01' }] }
});

export const NOTAS_REQUIEREN_CCF = ['nota-credito', 'nota-debito'];

// El orden importa: los créditos fiscales van primero porque las notas se relacionan con ellos.
export const TIPOS_PRUEBA: TipoPrueba[] = [
  {
    clave: 'ccf', nombre: 'Comprobante de Crédito Fiscal', ruta: 'ccf',
    cuerpo: c => ({ receptor: receptorCliente(c), cuerpoDocumento: [item('CCF')], resumen: { pagos: [{ codigo: '01' }] } })
  },
  { clave: 'factura', nombre: 'Factura', ruta: 'factura', cuerpo: c => facturaPrueba(c) },
  {
    clave: 'nota-credito', nombre: 'Nota de Crédito', ruta: 'nota-credito',
    cuerpo: c => ({ receptor: receptorCliente(c), documentoRelacionado: relacionado(c), cuerpoDocumento: [item('NC', 0.01)], resumen: {} })
  },
  {
    clave: 'nota-debito', nombre: 'Nota de Débito', ruta: 'nota-debito',
    cuerpo: c => ({ receptor: receptorCliente(c), documentoRelacionado: relacionado(c), cuerpoDocumento: [item('ND', 0.01)], resumen: {} })
  },
  {
    clave: 'nota-remision', nombre: 'Nota de Remisión', ruta: 'nota-remision',
    cuerpo: c => ({ receptor: { ...receptorCliente(c), bienTitulo: '04' }, cuerpoDocumento: [item('NR')], resumen: {} })
  },
  {
    clave: 'retencion', nombre: 'Comprobante de Retención', ruta: 'comprobante-retencion',
    cuerpo: c => ({
      receptor: receptorCliente(c),
      cuerpoDocumento: [{ ...fisico(c), tipoDte: '03', montoSujetoGrav: 100, codigoRetencionMH: '22', descripcion: 'PRUEBA CR - SIN VALOR' }],
      resumen: {}
    })
  },
  {
    clave: 'liquidacion', nombre: 'Comprobante de Liquidación', ruta: 'comprobante-liquidacion',
    cuerpo: c => ({
      receptor: { ...receptorCliente(c), codDomiciliado: 1 },
      cuerpoDocumento: [
        { ...fisico(c), tipoDte: '03', ventaGravada: 1, observaciones: 'PRUEBA CL - SIN VALOR' },
        { ...fisico(c, '-E'), tipoDte: '11', exportaciones: 1, observaciones: 'PRUEBA CL EXPORTACION - SIN VALOR' }
      ],
      resumen: {}
    })
  },
  {
    clave: 'contable', nombre: 'Documento Contable de Liquidación', ruta: 'documento-contable-liquidacion',
    cuerpo: c => ({
      receptor: { ...receptorCliente(c), tipoEstablecimiento: '02' },
      cuerpoDocumento: {
        periodoLiquidacionFechaInicio: c.hoy, periodoLiquidacionFechaFin: c.hoy, codLiquidacion: 'PRUEBA', cantidadDoc: 1,
        valorOperaciones: 100, comision: 1, porcentComision: 1, observaciones: 'PRUEBA DCL - SIN VALOR'
      },
      extension: { nombEntrega: 'PRUEBA SIN VALOR', docuEntrega: '00000000-0', codEmpleado: null }
    })
  },
  {
    clave: 'exportacion', nombre: 'Factura de Exportación', ruta: 'factura-exportacion',
    // Se alternan servicios y bienes para cubrir las dos variantes del documento
    cuerpo: c => (c.numero % 2 === 0 ? {
      exportacion: { tipoItemExpor: 2 },
      receptor: extranjero(c.correo),
      cuerpoDocumento: [{ ...item('FEX'), tipoItem: 2 }],
      resumen: { codIncoterms: null, descIncoterms: null, pagos: [{ codigo: '01' }] }
    } : {
      exportacion: { tipoItemExpor: 1, recintoFiscal: '03', tipoRegimen: 'EX-1', regimen: '1000.000' },
      receptor: extranjero(c.correo),
      cuerpoDocumento: [item('FEX BIEN')],
      resumen: { flete: 1, seguro: 1, codIncoterms: '09', descIncoterms: 'FOB - Libre a bordo', pagos: [{ codigo: '01' }] }
    })
  },
  {
    clave: 'sujeto-excluido', nombre: 'Factura de Sujeto Excluido', ruta: 'factura-sujeto-excluido',
    cuerpo: c => ({
      receptor: {
        nit: '01234567-8', tipoDocumento: '13', nombre: 'PRUEBA SUJETO SIN VALOR', codActividad: null, descActividad: null,
        direccion: { ...DIRECCION, complemento: 'Prueba sin valor' }, telefono: null, correo: c.correo
      },
      cuerpoDocumento: [item('FSE')],
      resumen: { pagos: [{ codigo: '01' }] }
    })
  },
  {
    clave: 'donacion', nombre: 'Comprobante de Donación', ruta: 'comprobante-donacion',
    cuerpo: c => ({
      receptor: { ...receptorCliente(c), codDomiciliado: 1, codPais: 'SV' },
      otrosDocumentos: [{ codDocAsociado: 1, descDocumento: 'PRUEBA SIN VALOR', detalleDocumento: 'PRUEBA SIN VALOR' }],
      cuerpoDocumento: [{ ...item('CD'), tipoDonacion: 1, valorUni: 1 }],
      resumen: { pagos: [{ codigo: '01', referencia: null }] }
    })
  },
  { clave: 'invalidacion', nombre: 'Evento de Invalidación' },
  { clave: 'contingencia', nombre: 'Evento de Contingencia' },
  { clave: 'retorno', nombre: 'Evento de Retorno' },
  { clave: 'operaciones-especiales', nombre: 'Evento de Operaciones Especiales' }
];

export const TIPOS_NO_DISPONIBLES = ['retorno', 'operaciones-especiales'];

export interface EstadoTipo {
  completadas: number;
  meta: number;
}

// Interpreta el texto copiado del portal de Hacienda, por ejemplo "* Factura (39/90)".
export function leerEstadoPortal(texto: string): Record<string, EstadoTipo> {
  const estado: Record<string, EstadoTipo> = {};
  for (const linea of texto.split(/\r?\n/)) {
    const partes = linea.match(/^\s*\*?\s*(.+?)\s*\((\d+)\s*\/\s*(\d+)\)/);
    if (!partes) continue;
    const tipo = TIPOS_PRUEBA.find(t => t.nombre.toLowerCase() === partes[1].toLowerCase());
    if (tipo) estado[tipo.clave] = { completadas: Number(partes[2]), meta: Number(partes[3]) };
  }
  return estado;
}

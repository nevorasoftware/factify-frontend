// src/utils/catalogs.ts

export const CATALOGOS = {
  // CAT-001 Ambiente
  ambiente: [
    { code: '00', name: 'Pruebas' },
    { code: '01', name: 'Producción' }
  ],
  
  // CAT-002 Tipo Documento
  tipoDocumento: [
    { code: '01', name: 'Factura' },
    { code: '03', name: 'Comprobante de Crédito Fiscal' },
    { code: '04', name: 'Nota de Remisión' },
    { code: '05', name: 'Nota de Crédito' },
    { code: '06', name: 'Nota de Débito' },
    { code: '07', name: 'Comprobante de Retención' },
    { code: '08', name: 'Comprobante de Liquidación' },
    { code: '09', name: 'Documento Contable Liquidación' },
    { code: '11', name: 'Factura de Exportación' },
    { code: '14', name: 'Factura Sujeto Excluido' },
    { code: '15', name: 'Comprobante de Donación' }
  ],
  
  // CAT-011 Tipo Ítem
  tipoItem: [
    { code: 1, name: 'Bienes' },
    { code: 2, name: 'Servicios' },
    { code: 3, name: 'Ambos' },
    { code: 4, name: 'Otros tributos' }
  ],
  
  // CAT-014 Unidad de Medida
  unidadMedida: [
    { code: 59, name: 'Unidad' },
    { code: 34, name: 'Kilogramo' },
    { code: 36, name: 'Libra' },
    { code: 22, name: 'Galón' },
    { code: 23, name: 'Litro' },
    { code: 30, name: 'Tonelada' },
    { code: 57, name: 'Ciento' },
    { code: 58, name: 'Docena' },
    { code: 55, name: 'Millar' },
    { code: 99, name: 'Otra' }
  ],
  
  // CAT-016 Condición Operación
  condicionOperacion: [
    { code: 1, name: 'Contado' },
    { code: 2, name: 'Crédito' },
    { code: 3, name: 'Otro' }
  ],
  
  // CAT-017 Forma de Pago
  formaPago: [
    { code: '01', name: 'Efectivo' },
    { code: '02', name: 'Tarjeta Débito' },
    { code: '03', name: 'Tarjeta Crédito' },
    { code: '04', name: 'Cheque' },
    { code: '05', name: 'Transferencia Bancaria' },
    { code: '08', name: 'Dinero Electrónico' },
    { code: '11', name: 'Bitcoin' },
    { code: '99', name: 'Otros' }
  ],
  
  // CAT-018 Plazo
  plazo: [
    { code: '01', name: 'Días' },
    { code: '02', name: 'Meses' },
    { code: '03', name: 'Años' }
  ],
  
  // CAT-022 Tipo Documento Receptor
  tipoDocumentoReceptor: [
    { code: '36', name: 'NIT' },
    { code: '13', name: 'DUI' },
    { code: '03', name: 'Pasaporte' },
    { code: '37', name: 'Otro' }
  ],
  
  // CAT-024 Tipo Invalidación
  tipoInvalidacion: [
    { code: '1', name: 'Error en la Información' },
    { code: '2', name: 'Rescindir Operación' },
    { code: '3', name: 'Otro' }
  ],
  
  // CAT-005 Tipo Contingencia
  tipoContingencia: [
    { code: '1', name: 'No disponibilidad sistema MH' },
    { code: '2', name: 'No disponibilidad sistema emisor' },
    { code: '3', name: 'Falla Internet' },
    { code: '4', name: 'Falla energía eléctrica' },
    { code: '5', name: 'Otro' }
  ],
  
  // CAT-026 Tipo Donación
  tipoDonacion: [
    { code: '1', name: 'Efectivo' },
    { code: '2', name: 'Bien' },
    { code: '3', name: 'Servicio' }
  ],
  
  // CAT-030 Transporte
  tipoTransporte: [
    { code: '1', name: 'Terrestre' },
    { code: '2', name: 'Aéreo' },
    { code: '3', name: 'Marítimo' },
    { code: '5', name: 'Multimodal' }
  ],
  
  // CAT-031 Incoterms
  incoterms: [
    { code: '01', name: 'EXW - En fábrica' },
    { code: '09', name: 'FOB - Libre a bordo' },
    { code: '11', name: 'CIF - Costo seguro y flete' },
    { code: '07', name: 'DDP - Entrega con impuestos pagados' }
  ],
  
  // Departamento
  departamentos: [
    { code: '01', name: 'Ahuachapán' },
    { code: '02', name: 'Santa Ana' },
    { code: '03', name: 'Sonsonate' },
    { code: '04', name: 'Chalatenango' },
    { code: '05', name: 'La Libertad' },
    { code: '06', name: 'San Salvador' },
    { code: '07', name: 'Cuscatlán' },
    { code: '08', name: 'La Paz' },
    { code: '09', name: 'Cabañas' },
    { code: '10', name: 'San Vicente' },
    { code: '11', name: 'Usulután' },
    { code: '12', name: 'San Miguel' },
    { code: '13', name: 'Morazán' },
    { code: '14', name: 'La Unión' }
  ]
};

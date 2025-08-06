// Interfaces para reportes de diferentes bancos
export interface SantanderReportRow {
    cuentaCargo: string;
    cuentaAbono: string;
    bancoReceptor: string;
    beneficiario: string;
    sucursal: string;
    importe: number;
    plazaBanxico: string;
    concepto: string;
    estadoCuentaFiscal: string;
    rfc: string;
    iva: number;
    referenciaOrdenante: string;
    formaAplicacion: string;
    fechaAplicacion: string;
    emailBeneficiario: string;
}

export interface AfirmeReportRow {
    nombreBeneficiario: string;
    tipoCuenta: string;
    cuentaDestino: string;
    numeroBanco: string;
    correoElectronico: string;
}

// Función para generar reporte de Santander (estructura actual)
export const generateSantanderReport = async (data: SantanderReportRow[], fileName: string = 'reporte_santander.xlsx') => {
    const ExcelJS = require('exceljs');

    // Crear el workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Pagos');

    // Configurar anchos de columna - Auto-ajuste al contenido
    worksheet.columns = [
        { header: '', key: 'col1', width: 18 }, // CUENTA DE CARGO
        { header: '', key: 'col2', width: 18 }, // CUENTA DE ABONO
        { header: '', key: 'col3', width: 25 }, // BANCO RECEPTOR
        { header: '', key: 'col4', width: 35 }, // BENEFICIARIO
        { header: '', key: 'col5', width: 25 }, // SUCURSAL
        { header: '', key: 'col6', width: 15 }, // IMPORTE
        { header: '', key: 'col7', width: 20 }, // PLAZA BANXICO
        { header: '', key: 'col8', width: 30 }, // CONCEPTO
        { header: '', key: 'col9', width: 25 }, // ESTADO DE CUENTA FISCAL
        { header: '', key: 'col10', width: 18 }, // RFC
        { header: '', key: 'col11', width: 12 }, // IVA
        { header: '', key: 'col12', width: 25 }, // REFERENCIA ORDENANTE
        { header: '', key: 'col13', width: 25 }, // FORMA DE APLICACIÓN
        { header: '', key: 'col14', width: 18 }, // FECHA DE APLICACIÓN
        { header: '', key: 'col15', width: 30 }  // EMAIL BENEFICIARIO
    ];

    // Fila 1: OBLIGATORIO - Solo en columna A con borde
    const row1 = worksheet.addRow(['OBLIGATORIO', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    row1.eachCell((cell: any, colNumber: any) => {
        if (colNumber === 1) { // Solo columna A
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' } // Rojo
            };
            cell.font = {
                name: 'Arial',
                size: 10,
                color: { argb: 'FFFFFFFF' }, // Blanco
                bold: true
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        }
    });

    // Fila 2: OPCIONAL - Solo en columna A con borde
    const row2 = worksheet.addRow(['OPCIONAL', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    row2.eachCell((cell: any, colNumber: any) => {
        if (colNumber === 1) { // Solo columna A
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFFFF' } // Blanco
            };
            cell.font = {
                name: 'Arial',
                size: 10,
                color: { argb: 'FF000000' }, // Negro
                bold: true
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        }
    });

    // Fila 3: Tipo de transferencia - Solo en celda D3 con fondo gris
    const row3 = worksheet.addRow(['', '', '', 'Interbancaria con comprobante fiscal (con email)', '', '', '', '', '', '', '', '', '', '', '']);
    row3.eachCell((cell: any, colNumber: any) => {
        if (colNumber === 4) { // Solo columna D
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD3D3D3' } // Gris claro
            };
            cell.font = {
                name: 'Arial',
                size: 10,
                color: { argb: 'FF000000' } // Negro
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        }
    });

    // Fila 4: Banco (Banorte) - En columna D con fondo rojo en C4:E4
    const row4 = worksheet.addRow(['', '', '', 'Banorte', '', '', '', '', '', '', '', '', '', '', '']);
    row4.eachCell((cell: any, colNumber: any) => {
        if (colNumber >= 3 && colNumber <= 5) { // Columnas C, D, E
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' } // Rojo
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };

            if (colNumber === 4) { // Solo la columna D tiene el texto
                cell.font = {
                    name: 'Arial',
                    size: 12,
                    color: { argb: 'FFFFFFFF' }, // Blanco
                    bold: true
                };
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle'
                };
            }
        }
    });

    // Fila 5: Enlaces - En columnas C y E con fondo rojo
    const row5 = worksheet.addRow(['', '', 'Anexo-Catalogo de Bancos', '', 'CATÁLOGO DE CÓDIGOS DE PLAZAS', '', '', '', '', '', '', '', '', '', '']);
    row5.eachCell((cell: any, colNumber: any) => {
        if (colNumber >= 3 && colNumber <= 5) { // Columnas C, D, E
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF0000' } // Rojo
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };

            if (colNumber === 3 || colNumber === 5) { // Columnas C y E tienen los enlaces
                cell.font = {
                    name: 'Arial',
                    size: 10,
                    color: { argb: 'FF0000FF' }, // Azul
                    underline: true
                };
            }
        }
    });

    // Fila 6: Vacía - Sin bordes
    const row6 = worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

    // Fila 7: Encabezados de la tabla
    const headers = ['CUENTA DE CARGO', 'CUENTA DE ABONO', 'BANCO RECEPTOR', 'BENEFICIARIO', 'SUCURSAL', 'IMPORTE', 'PLAZA BANXICO', 'CONCEPTO', 'ESTADO DE CUENTA FISCAL', 'RFC', 'IVA', 'REFERENCIA ORDENANTE', 'FORMA DE APLICACIÓN', 'FECHA DE APLICACIÓN', 'EMAIL BENEFICIARIO'];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell: any) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF0000' } // Rojo
        };
        cell.font = {
            name: 'Arial',
            size: 10,
            color: { argb: 'FFFFFFFF' }, // Blanco
            bold: true
        };
        cell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        cell.border = {
            top: { style: 'thick', color: { argb: 'FF000000' } },
            bottom: { style: 'thick', color: { argb: 'FF000000' } },
            left: { style: 'thick', color: { argb: 'FF000000' } },
            right: { style: 'thick', color: { argb: 'FF000000' } }
        };
    });

    // Agregar datos
    data.forEach(row => {
        const dataRow = worksheet.addRow([
            row.cuentaCargo,
            row.cuentaAbono,
            row.bancoReceptor,
            row.beneficiario,
            row.sucursal,
            row.importe,
            row.plazaBanxico,
            row.concepto,
            row.estadoCuentaFiscal,
            row.rfc,
            row.iva,
            row.referenciaOrdenante,
            row.formaAplicacion,
            row.fechaAplicacion,
            row.emailBeneficiario
        ]);

        dataRow.eachCell((cell: any, colNumber: any) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFFFF' } // Blanco
            };
            cell.font = {
                name: 'Arial',
                size: 10,
                color: { argb: 'FF000000' } // Negro
            };
            cell.border = {
                top: { style: 'thick', color: { argb: 'FF000000' } },
                bottom: { style: 'thick', color: { argb: 'FF000000' } },
                left: { style: 'thick', color: { argb: 'FF000000' } },
                right: { style: 'thick', color: { argb: 'FF000000' } }
            };

            // Formato de moneda para IMPORTE (columna 6) e IVA (columna 11)
            if (colNumber === 6 || colNumber === 11) {
                cell.numFmt = '$#,##0.00';
            }
        });
    });

    // Configurar altos de fila
    worksheet.getRow(1).height = 20; // OBLIGATORIO
    worksheet.getRow(2).height = 20; // OPCIONAL
    worksheet.getRow(3).height = 20; // Tipo de transferencia
    worksheet.getRow(4).height = 25; // Banco
    worksheet.getRow(5).height = 20; // Enlaces
    worksheet.getRow(6).height = 10; // Vacía
    worksheet.getRow(7).height = 25; // Encabezados

    // Auto-ajustar columnas al contenido
    worksheet.columns.forEach((column: any) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell: any) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = Math.min(Math.max(maxLength + 2, 12), 50); // Mínimo 12, máximo 50
    });

    // Generar y descargar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
};

// Función para generar reporte de Afirme (nueva estructura)
export const generateAfirmeReport = async (data: AfirmeReportRow[], fileName: string = 'reporte_afirme.xlsx') => {
    const ExcelJS = require('exceljs');

    // Crear el workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Pagos Afirme');

    // Configurar anchos de columna
    worksheet.columns = [
        { header: '', key: 'col1', width: 35 }, // Nombre del Beneficiario
        { header: '', key: 'col2', width: 15 }, // Tipo de Cuenta
        { header: '', key: 'col3', width: 25 }, // Cuenta Destino
        { header: '', key: 'col4', width: 20 }, // Número de Banco
        { header: '', key: 'col5', width: 30 }  // Correo Electrónico de Destinatario
    ];

    // Fila 1: Encabezados de la tabla (fondo verde como en la imagen)
    const headers = ['Nombre del Beneficiario', 'Tipo de Cuenta', 'Cuenta Destino', 'Número de Banco', 'Correo Electrónico de Destinatario'];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell: any) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF00FF00' } // Verde
        };
        cell.font = {
            name: 'Arial',
            size: 11,
            color: { argb: 'FF000000' }, // Negro
            bold: true
        };
        cell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
        };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };
    });

    // Agregar datos (fondo azul claro como en la imagen)
    data.forEach(row => {
        const dataRow = worksheet.addRow([
            row.nombreBeneficiario,
            row.tipoCuenta,
            row.cuentaDestino,
            row.numeroBanco,
            row.correoElectronico
        ]);

        dataRow.eachCell((cell: any, colNumber: any) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE6F3FF' } // Azul claro
            };
            cell.font = {
                name: 'Arial',
                size: 10,
                color: { argb: 'FF000000' } // Negro
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
            cell.alignment = {
                horizontal: 'left',
                vertical: 'middle'
            };

            // Formato especial para correo electrónico (columna 5)
            if (colNumber === 5 && row.correoElectronico) {
                cell.font = {
                    name: 'Arial',
                    size: 10,
                    color: { argb: 'FF0000FF' }, // Azul
                    underline: true
                };
            }
        });
    });

    // Configurar alto de fila de encabezados
    worksheet.getRow(1).height = 25;

    // Auto-ajustar columnas al contenido
    worksheet.columns.forEach((column: any) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell: any) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = Math.min(Math.max(maxLength + 2, 12), 50); // Mínimo 12, máximo 50
    });

    // Generar y descargar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
};

// Función principal para generar reporte según el banco
export const generateBankReport = async (
    bankName: string,
    data: any[],
    fileName?: string
) => {
    const defaultFileName = `reporte_${bankName.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const finalFileName = fileName || defaultFileName;

    switch (bankName.toLowerCase()) {
        case 'banorte':
            await generateSantanderReport(data, finalFileName);
            break;
        case 'afirme':
            await generateAfirmeReport(data, finalFileName);
            break;
        default:
            throw new Error(`Banco no soportado: ${bankName}`);
    }
}; 
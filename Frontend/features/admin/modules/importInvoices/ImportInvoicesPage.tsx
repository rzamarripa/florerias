"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import JSZip from 'jszip';
import { CloudUpload, Save } from 'lucide-react';

import { importedInvoicesService } from './services/importedInvoices';
import { companiesService } from '../companies/services/companies';
import { Company } from '../companies/types';

import { ImportedInvoice, Pagination, RawInvoiceData, SummaryData } from './types';
import SummaryCards from './components/SummaryCards';
import InvoicesTable from './components/InvoicesTable';
import { getUserVisibilityForSelects } from '../InvoicesPackpages/services';
import { useUserSessionStore } from '@/stores';

const ImportInvoicesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [invoices, setInvoices] = useState<ImportedInvoice[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [parsedData, setParsedData] = useState<RawInvoiceData[]>([]);
  const [previewPage, setPreviewPage] = useState(1);
  const PREVIEW_PAGE_SIZE = 15;

  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const { user } = useUserSessionStore();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const userVisibility = await getUserVisibilityForSelects(user!._id);
        console.log(userVisibility);
        if (userVisibility.companies) {
          setCompanies(userVisibility.companies);
        } else {
          toast.error('Error al cargar las razones sociales.');
        }
      } catch (error: any) {
        console.error('Error fetching companies:', error);
        toast.error('Error al cargar las razones sociales.');
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  const fetchDataForCompany = useCallback(async (rfcReceptor: string, page: number = 1) => {
    if (!rfcReceptor) return;

    setIsPreview(false);
    setLoadingSummary(true);
    setLoadingInvoices(true);

    try {
      const [summaryRes, invoicesRes] = await Promise.all([
        importedInvoicesService.getSummary(rfcReceptor),
        importedInvoicesService.getInvoices({ rfcReceptor, page })
      ]);

      if (summaryRes.success) setSummary(summaryRes.data);
      else {
        toast.error('Error al cargar el resumen.');
        setSummary(null);
      }

      if (invoicesRes.success) {
        setInvoices(invoicesRes.data);
        setPagination(invoicesRes.pagination || null);
      } else {
        toast.error('Error al cargar las facturas.');
        setInvoices([]);
        setPagination(null);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Ocurrió un error al obtener los datos.');
    } finally {
      setLoadingSummary(false);
      setLoadingInvoices(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchDataForCompany(selectedCompany);
    } else {
      setSummary(null);
      setInvoices([]);
      setPagination(null);
      setParsedData([]);
      setIsPreview(false);
      setPreviewPage(1);
    }
  }, [selectedCompany, fetchDataForCompany]);

  const handlePageChange = (page: number) => {
    if (isPreview) {
      setPreviewPage(page);
    } else if (selectedCompany) {
      fetchDataForCompany(selectedCompany, page);
    }
  };

  const showPreview = (data: RawInvoiceData[], page: number = 1) => {
    // 1. Calculate Summary for preview (once)
    if (page === 1) {
      const summaryPreview: SummaryData = {
        totalFacturas: data.length,
        facturasCanceladas: data.filter(d => d.Estatus === '0').length,
        proveedoresUnicos: [...new Set(data.map(d => d.NombreEmisor))].length
      };
      setSummary(summaryPreview);
    }

    // 2. Transform raw data to ImportedInvoice format for table preview
    const invoicesPreview: ImportedInvoice[] = data.map((d, index) => ({
      _id: `preview-${index}`,
      uuid: d.Uuid,
      rfcEmisor: d.RfcEmisor,
      nombreEmisor: d.NombreEmisor,
      rfcReceptor: d.RfcReceptor,
      nombreReceptor: d.NombreReceptor,
      importeAPagar: parseFloat(String(d.Monto).replace(/[^0-9.-]+/g, "")) || 0,
      importePagado: 0,
      estatus: d.Estatus === '1' ? 1 : 0,
      estadoPago: 0,
      fechaEmision: d.FechaEmision,
      tipoComprobante: d.EfectoComprobante,
      // Default values for fields not in raw data
      empresa: { _id: '', name: '', rfc: '' },
      rfcProveedorCertificacion: d.RfcPac,
      fechaCertificacionSAT: d.FechaCertificacionSat,
      fechaCancelacion: d.FechaCancelacion || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // 3. Paginate the preview data
    const startIndex = (page - 1) * PREVIEW_PAGE_SIZE;
    const endIndex = startIndex + PREVIEW_PAGE_SIZE;
    const paginatedInvoices = invoicesPreview.slice(startIndex, endIndex);
    setInvoices(paginatedInvoices);

    // 4. Set pagination for preview
    setPagination({
      total: data.length,
      page: page,
      pages: Math.ceil(data.length / PREVIEW_PAGE_SIZE),
      limit: PREVIEW_PAGE_SIZE,
    });

    setIsPreview(true);
    setLoadingInvoices(false);
    setLoadingSummary(false);
  };

  useEffect(() => {
    if (isPreview) {
      showPreview(parsedData, previewPage);
    }
  }, [previewPage, isPreview, parsedData]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!selectedCompany) {
      toast.warn('Por favor, seleccione una Razón Social antes de subir un archivo.');
      return;
    }

    const file = acceptedFiles[0];
    if (!file || (file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed')) {
      toast.error('Por favor, suba un archivo ZIP válido.');
      return;
    }

    setIsUploading(true);
    setLoadingInvoices(true);
    setLoadingSummary(true);
    toast.info('Procesando archivo ZIP...');

    new JSZip().loadAsync(file)
      .then((zip: JSZip) => {
        const txtFile = Object.values(zip.files).find((f: any) => f.name.toLowerCase().endsWith('.txt'));
        if (!txtFile) throw new Error('No se encontró un archivo .txt dentro del ZIP.');
        return txtFile.async('string');
      })
      .then((content: string) => {
        const lines = content.split('\n').filter((line: string) => line.trim() !== '');
        if (lines.length <= 1) throw new Error('El archivo de texto está vacío o no tiene el formato esperado.');

        const headerLine = lines.shift()!.trim();
        const header = headerLine.split('~');
        const requiredHeaders = ['Uuid', 'RfcEmisor', 'NombreEmisor', 'RfcReceptor'];
        if (!requiredHeaders.every(h => header.includes(h))) {
          throw new Error('El encabezado del archivo no es válido.');
        }

        const data: RawInvoiceData[] = lines.map((line: string) => {
          const values = line.split('~');
          const row: any = {};
          header.forEach((key, index) => {
            const keyMap: { [key: string]: keyof RawInvoiceData } = {
              'Uuid': 'Uuid', 'RfcEmisor': 'RfcEmisor', 'NombreEmisor': 'NombreEmisor',
              'RfcReceptor': 'RfcReceptor', 'NombreReceptor': 'NombreReceptor', 'RfcPac': 'RfcPac',
              'FechaEmision': 'FechaEmision', 'FechaCertificacionSat': 'FechaCertificacionSat',
              'Monto': 'Monto', 'EfectoComprobante': 'EfectoComprobante',
              'Estatus': 'Estatus', 'FechaCancelacion': 'FechaCancelacion'
            };
            const mappedKey = keyMap[key];
            if (mappedKey) {
              row[mappedKey] = values[index];
            }
          });
          return row;
        });

        const allInvoicesMatch = data.every(
          (invoice) => invoice.RfcReceptor.toUpperCase() === selectedCompany.toUpperCase()
        );

        if (!allInvoicesMatch) {
          throw new Error(`No todas las facturas en el archivo pertenecen a la Razón Social seleccionada (${selectedCompany}).`);
        }

        setParsedData(data);
        setPreviewPage(1);
        showPreview(data, 1);
        toast.success(`${data.length} facturas cargadas en vista previa. Haga clic en "Guardar" para importarlas.`);
      })
      .catch((err: any) => {
        toast.error(`Error al procesar el archivo: ${err.message}`);
        setParsedData([]);
        // If an error occurs, revert to the data from the DB
        if (selectedCompany) fetchDataForCompany(selectedCompany);
      })
      .finally(() => setIsUploading(false));
  }, [selectedCompany, fetchDataForCompany]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    multiple: false,
    disabled: !selectedCompany || isUploading || isSaving,
  });

  const handleSave = async () => {
    if (parsedData.length === 0) {
      toast.warn('No hay facturas cargadas para guardar.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await importedInvoicesService.bulkUpsert(parsedData);
      if (response.success) {
        toast.success(response.message || 'Facturas importadas con éxito.');
        setParsedData([]);
        setPreviewPage(1);
        if (selectedCompany) fetchDataForCompany(selectedCompany);
      } else {
        toast.error(response.message || 'Ocurrió un error al guardar las facturas.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Ocurrió un error en el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container-fluid">

      <Card>
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Razón Social <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={selectedCompany}
                  onChange={e => setSelectedCompany(e.target.value)}
                  disabled={loadingCompanies || isSaving}
                >
                  <option value="">Seleccionar...</option>
                  {companies.map(c => (
                    <option key={c._id} value={c.rfc}>{c.name} ({c.rfc})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Label>Archivo ZIP de Metadatos</Form.Label>
              <div {...getRootProps({ className: `dropzone text-center p-4 border-2 border-dashed ${isDragActive ? 'border-primary' : 'border-secondary'} ${!selectedCompany ? 'bg-light' : 'cursor-pointer'}` })}>
                <input {...getInputProps()} />
                <CloudUpload size={32} className="text-muted" />
                {isUploading ? (
                  <p className="mt-2 mb-0">Procesando archivo...</p>
                ) : (
                  <p className="mt-2 mb-0">
                    {selectedCompany ? 'Arrastre un archivo ZIP o haga clic para seleccionar' : 'Seleccione una Razón Social para activar'}
                  </p>
                )}
              </div>
            </Col>
          </Row>

          {parsedData.length > 0 && (
            <div className="text-center mt-3">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <Save size={16} className="me-1" />}
                Guardar {parsedData.length} Facturas
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      <div className="mt-4">
        <SummaryCards summary={summary} loading={loadingSummary} />
      </div>

      <div className="mt-4">
        <InvoicesTable invoices={invoices} pagination={pagination} loading={loadingInvoices} onPageChange={handlePageChange} isPreview={isPreview} />
      </div>
    </div>
  );
};

export default ImportInvoicesPage; 
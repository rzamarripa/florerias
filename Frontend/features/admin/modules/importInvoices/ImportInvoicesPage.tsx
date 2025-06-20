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

const ImportInvoicesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [invoices, setInvoices] = useState<ImportedInvoice[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [parsedData, setParsedData] = useState<RawInvoiceData[]>([]);
  
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await companiesService.getAllActive();
        if (response.success) {
          const activeCompanies = response.data.filter(company => company.isActive);
          setCompanies(activeCompanies);
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

  const fetchDataForCompany = useCallback(async (taxId: string, page: number = 1, isPageChange: boolean = false) => {
    if (!taxId) return;
    
    if (!isPageChange) {
      setLoadingSummary(true);
      setLoadingInvoices(true);
    }

    try {
      const [summaryRes, invoicesRes] = await Promise.all([
        importedInvoicesService.getSummary(taxId),
        importedInvoicesService.getInvoices({ receiverTaxId: taxId, page })
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
      if (!isPageChange) {
        setLoadingSummary(false);
        setLoadingInvoices(false);
      }
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
    }
  }, [selectedCompany, fetchDataForCompany]);
  
  const handlePageChange = (page: number) => {
    if (selectedCompany) fetchDataForCompany(selectedCompany, page, true);
  };

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
            // Map the text file headers to our RawInvoiceData interface keys
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
        
        // Ensure all invoices in the file belong to the selected company
        const allInvoicesMatch = data.every(
          (invoice) => invoice.RfcReceptor.toUpperCase() === selectedCompany.toUpperCase()
        );

        if (!allInvoicesMatch) {
          toast.error(
            `No todas las facturas en el archivo pertenecen a la Razón Social seleccionada (${selectedCompany}). Verifique el archivo.`
          );
          setParsedData([]);
          return;
        }

        setParsedData(data);
        toast.success(`${data.length} facturas cargadas desde el archivo. Haga clic en "Guardar" para importarlas.`);
      })
      .catch((err: any) => {
        toast.error(`Error al procesar el archivo: ${err.message}`);
        setParsedData([]);
      })
      .finally(() => setIsUploading(false));
  }, [selectedCompany]);

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
                { isUploading ? (
                    <p className="mt-2 mb-0">Procesando archivo...</p>
                ) : (
                    <p className="mt-2 mb-0">
                      { selectedCompany ? 'Arrastre un archivo ZIP o haga clic para seleccionar' : 'Seleccione una Razón Social para activar' }
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
        <InvoicesTable invoices={invoices} pagination={pagination} loading={loadingInvoices} onPageChange={handlePageChange} />
      </div>
    </div>
  );
};

export default ImportInvoicesPage; 
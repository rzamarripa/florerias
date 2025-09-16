"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { CloudUpload, Save } from "lucide-react";

import { blackListProvidersService } from "./services/blackListProviders";
import {
  BlackListProvider,
  Pagination,
  RawBlackListProviderData,
  SummaryData,
} from "./types";
import SummaryCards from "./components/SummaryCards";
import BlackListTable from "./components/BlackListTable";

const ImportBlackListPage: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [providers, setProviders] = useState<BlackListProvider[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [parsedData, setParsedData] = useState<RawBlackListProviderData[]>([]);
  const [previewPage, setPreviewPage] = useState(1);
  const PREVIEW_PAGE_SIZE = 15;

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const fetchInitialData = useCallback(async (page: number = 1) => {
    setIsPreview(false);
    setLoadingSummary(true);
    setLoadingProviders(true);

    try {
      const [summaryRes, providersRes] = await Promise.all([
        blackListProvidersService.getSummary(),
        blackListProvidersService.getProviders({ page }),
      ]);

      if (summaryRes.success) {
        setSummary(summaryRes.data);
      } else {
        toast.error("Error al cargar el resumen.");
        setSummary(null);
      }

      if (providersRes.success) {
        setProviders(providersRes.data);
        setPagination(providersRes.pagination || null);
      } else {
        toast.error("Error al cargar los proveedores.");
        setProviders([]);
        setPagination(null);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Ocurrió un error al obtener los datos.");
    } finally {
      setLoadingSummary(false);
      setLoadingProviders(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handlePageChange = (page: number) => {
    if (isPreview) {
      setPreviewPage(page);
    } else {
      fetchInitialData(page);
    }
  };

  const showPreview = (data: RawBlackListProviderData[], page: number = 1) => {
    // 1. Calculate Summary for preview (once)
    if (page === 1) {
      const activeProviders = data.filter(
        (d) =>
          !d["Publicación página SAT desvirtuados"] &&
          !d["Publicación página SAT definitivos"]
      ).length;

      const desvirtualizedProviders = data.filter(
        (d) => d["Publicación página SAT desvirtuados"]
      ).length;

      const definitiveProviders = data.filter(
        (d) => d["Publicación página SAT definitivos"]
      ).length;

      const summaryPreview: SummaryData = {
        totalProviders: data.length,
        activeProviders,
        desvirtualizedProviders,
        definitiveProviders,
      };

      console.log("Resumen generado:", summaryPreview);
      setSummary(summaryPreview);
    }

    // 2. Transform raw data to BlackListProvider format for table preview
    const providersPreview: BlackListProvider[] = data.map((d, index) => ({
      _id: `preview-${index}`,
      rfc: d.RFC,
      nombre: d.Nombre,
      situacion: d.Situación,
      numeroFechaOficioGlobalPresuncion:
        d["Número y fecha de oficio global de presunción"],
      publicacionPaginaSATPresuntos: d["Publicación página SAT presuntos"],
      publicacionDOFPresuntos: d["Publicación DOF presuntos"],
      publicacionPaginaSATDesvirtuados:
        d["Publicación página SAT desvirtuados"] || null,
      numeroFechaOficioGlobalDesvirtuados:
        d[
          "Número y fecha de oficio global de contribuyentes que desvirtuaron"
        ] || null,
      publicacionDOFDesvirtuados: d["Publicación DOF desvirtuados"] || null,
      numeroFechaOficioGlobalDefinitivos:
        d["Número y fecha de oficio global de definitivos"] || null,
      publicacionPaginaSATDefinitivos:
        d["Publicación página SAT definitivos"] || null,
      publicacionDOFDefinitivos: d["Publicación DOF definitivos"] || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // 3. Paginate the preview data
    const startIndex = (page - 1) * PREVIEW_PAGE_SIZE;
    const endIndex = startIndex + PREVIEW_PAGE_SIZE;
    const paginatedProviders = providersPreview.slice(startIndex, endIndex);
    setProviders(paginatedProviders);

    // 4. Set pagination for preview
    setPagination({
      total: data.length,
      page: page,
      pages: Math.ceil(data.length / PREVIEW_PAGE_SIZE),
      limit: PREVIEW_PAGE_SIZE,
    });

    setIsPreview(true);
    setLoadingProviders(false);
    setLoadingSummary(false);
  };

  useEffect(() => {
    if (isPreview) {
      showPreview(parsedData, previewPage);
    }
  }, [previewPage, isPreview, parsedData]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file || !file.name.toLowerCase().endsWith(".xlsx")) {
        toast.error("Por favor, suba un archivo XLSX válido.");
        return;
      }

      setIsUploading(true);
      setLoadingProviders(true);
      setLoadingSummary(true);
      toast.info("Procesando archivo XLSX...");

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON with header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length <= 1) {
            throw new Error(
              "El archivo está vacío o no tiene el formato esperado."
            );
          }
          console.log(jsonData);
          const headers = jsonData[0] as string[];
          const requiredHeaders = [
            "RFC",
            "Nombre",
            "Situación",
            "Número y fecha de oficio global de presunción",
            "Publicación página SAT presuntos",
            "Publicación DOF presuntos",
          ];
          console.log(headers);
          if (!requiredHeaders.every((h) => headers.includes(h))) {
            throw new Error(
              "El archivo no contiene las columnas requeridas: RFC, Nombre, Situación, Número y fecha de oficio global de presunción, Publicación página SAT presuntos, Publicación DOF presuntos"
            );
          }

          const rows = jsonData.slice(1) as any[][];
          const parsedProviders: RawBlackListProviderData[] = rows
            .filter((row) => row.length > 0 && row[0]) // Filter empty rows
            .map((row) => {
              const provider: any = {};
              headers.forEach((header, index) => {
                provider[header] = row[index] || "";
              });
              return provider as RawBlackListProviderData;
            });

          console.log("Archivo cargado - Respuesta:", {
            totalProviders: parsedProviders.length,
            headers: headers,
            sampleProvider: parsedProviders[0],
            fechasSample: {
              satPresuntos: parsedProviders[0]?.[
                "Publicación página SAT presuntos"
              ],
              dofPresuntos: parsedProviders[0]?.["Publicación DOF presuntos"],
            },
          });

          if (parsedProviders.length === 0) {
            throw new Error(
              "No se encontraron proveedores válidos en el archivo."
            );
          }

          setParsedData(parsedProviders);
          setPreviewPage(1);
          showPreview(parsedProviders, 1);
          toast.success(
            `${parsedProviders.length} proveedores cargados en vista previa. Haga clic en "Guardar" para importarlos.`
          );
        } catch (err: any) {
          toast.error(`Error al procesar el archivo: ${err.message}`);
          console.log(err.message);
          setParsedData([]);
          // If an error occurs, revert to the data from the DB
          fetchInitialData();
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error("Error al leer el archivo.");
        setIsUploading(false);
      };

      reader.readAsArrayBuffer(file);
    },
    [fetchInitialData]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    multiple: false,
    disabled: isUploading || isSaving,
  });

  const handleSave = async () => {
    if (parsedData.length === 0) {
      toast.warn("No hay proveedores cargados para guardar.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await blackListProvidersService.bulkUpsert(parsedData);
      if (response.success) {
        toast.success(response.message || "Proveedores importados con éxito.");
        setParsedData([]);
        setPreviewPage(1);
        fetchInitialData();
      } else {
        toast.error(
          response.message || "Ocurrió un error al guardar los proveedores."
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error en el servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container-fluid">
      <Card>
        <Card.Body>
          <Row className="g-3">
            <Col md={8}>
              <Form.Label>Archivo XLSX de Lista Negra</Form.Label>
              <div
                {...getRootProps({
                  className: `dropzone text-center p-4 border-2 border-dashed ${
                    isDragActive ? "border-primary" : "border-secondary"
                  } cursor-pointer`,
                })}
              >
                <input {...getInputProps()} />
                <CloudUpload size={32} className="text-muted" />
                {isUploading ? (
                  <p className="mt-2 mb-0">Procesando archivo...</p>
                ) : (
                  <p className="mt-2 mb-0">
                    Arrastre un archivo XLSX o haga clic para seleccionar
                  </p>
                )}
                <small className="text-muted d-block mt-2">
                  El archivo debe contener las columnas: RFC, Nombre, Situación,
                  etc.
                </small>
              </div>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              {parsedData.length > 0 && (
                <div className="w-100">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-100"
                  >
                    {isSaving ? (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                    ) : (
                      <Save size={16} className="me-1" />
                    )}
                    Guardar {parsedData.length} Proveedores
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="mt-4">
        <SummaryCards summary={summary} loading={loadingSummary} />
      </div>

      <div className="mt-4">
        <BlackListTable
          providers={providers}
          pagination={pagination}
          loading={loadingProviders}
          onPageChange={handlePageChange}
          isPreview={isPreview}
        />
      </div>
    </div>
  );
};

export default ImportBlackListPage;

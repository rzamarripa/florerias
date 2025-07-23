"use client";
import React from "react";
import { Card, Tab, Tabs } from "react-bootstrap";
import { useBankMovementsImport } from "./hooks/useBankMovementsImport";
import { useMovementsValidation } from "./hooks/useMovementsValidation";
import ConfigurationTab from "./components/ConfigurationTab";
import ResultsTab from "./components/ResultsTab";

const BankMovementsImportPage: React.FC = () => {
  const {
    companies,
    bankAccounts,
    loading,
    previewData,
    previewHeaders,
    activeTab,
    importConfig,
    conciliationData,
    setActiveTab,
    setImportConfig,
    handleImport,
  } = useBankMovementsImport();

  const { validacion, isImportDisabled, movementStats } =
    useMovementsValidation({
      previewData,
      saldoInicialCuenta: conciliationData.saldoInicialCuenta,
    });

  const handleConfigChange = (config: Partial<typeof importConfig>) => {
    setImportConfig((prev) => ({ ...prev, ...config }));
  };

  const handleFileChange = (file: File | null) => {
    setImportConfig((prev) => ({ ...prev, file }));
  };

  const handleImportClick = () => {
    handleImport(validacion);
  };

  return (
    <div className="container-fluid">
      <Card>
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k as string)}
            id="import-wizard"
            className="mb-3"
          >
            <Tab eventKey="configuracion" title="1. Configuración">
              <ConfigurationTab
                companies={companies}
                bankAccounts={bankAccounts}
                importConfig={importConfig}
                saldoInicialCuenta={conciliationData.saldoInicialCuenta}
                onConfigChange={handleConfigChange}
                onFileChange={handleFileChange}
              />
            </Tab>
            <Tab
              eventKey="resultados"
              title="2. Resultados de Conciliación"
              disabled={previewData.length === 0}
            >
              <ResultsTab
                previewData={previewData}
                previewHeaders={previewHeaders}
                conciliationData={conciliationData}
                validacion={validacion}
                loading={loading}
                isImportDisabled={isImportDisabled}
                movementStats={movementStats}
                onImport={handleImportClick}
              />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
};

export default BankMovementsImportPage;

import React from "react";
import { Alert, Col, Form, Row } from "react-bootstrap";
import ImportDropzone from "./ImportDropzone";
import { Company, BankAccount, ImportConfig } from "../types/validation";
import { formatMoney } from "@/utils";

interface ConfigurationTabProps {
  companies: Company[];
  bankAccounts: BankAccount[];
  importConfig: ImportConfig;
  saldoInicialCuenta: number | null;
  onConfigChange: (config: Partial<ImportConfig>) => void;
  onFileChange: (file: File | null) => void;
}

const ConfigurationTab: React.FC<ConfigurationTabProps> = ({
  companies,
  bankAccounts,
  importConfig,
  saldoInicialCuenta,
  onConfigChange,
  onFileChange,
}) => {
  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onConfigChange({ selectedCompany: e.target.value });
  };

  const handleBankAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onConfigChange({ selectedBankAccount: e.target.value });
  };

  return (
    <Form onSubmit={(e) => e.preventDefault()}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Razón Social</Form.Label>
            <Form.Select
              value={importConfig.selectedCompany}
              onChange={handleCompanyChange}
              required
            >
              <option value="">Selecciona una razón social</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Cuenta Bancaria</Form.Label>
            <Form.Select
              value={importConfig.selectedBankAccount}
              onChange={handleBankAccountChange}
              required
              disabled={!importConfig.selectedCompany}
            >
              <option value="">Selecciona una cuenta bancaria</option>
              {bankAccounts.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.accountNumber} ({b.bank?.name})
                </option>
              ))}
            </Form.Select>
            {saldoInicialCuenta !== null && (
              <Alert variant="info" className="mt-2">
                Saldo Actual Registrado:{" "}
                <strong>{formatMoney(saldoInicialCuenta)}</strong>
              </Alert>
            )}
          </Form.Group>
        </Col>
      </Row>
      <Form.Group className="mb-3">
        <Form.Label>Archivo Excel</Form.Label>
        <ImportDropzone file={importConfig.file} setFile={onFileChange} />
        {importConfig.parserWarning && (
          <Alert variant="warning" className="mt-2">
            {importConfig.parserWarning}
          </Alert>
        )}
      </Form.Group>
    </Form>
  );
};

export default ConfigurationTab;

"use client";

import React, { useState, useEffect } from "react";
import { Row, Col, Form, Button, Spinner } from "react-bootstrap";
import { Company, BankAccount } from "../types";
import { companiesService, bankAccountsService } from "../services";

interface FiltrosConciliacionProps {
  onLoadData: (filters: {
    companyId: string;
    bankAccountId: string;
  }) => void;
  onLayoutTypeChange: (layoutType: 'grouped' | 'individual') => void;
  layoutType: 'grouped' | 'individual';
  loading: boolean;
  fechaFacturas: string;
  fechaMovimientos: string;
  hideMovimientosDate?: boolean;
  hideButtons?: boolean;
}

export default function FiltrosConciliacion({
  onLoadData,
  onLayoutTypeChange,
  layoutType,
  loading,
  fechaFacturas,
  fechaMovimientos,
  hideMovimientosDate = false,
  hideButtons = false,
}: FiltrosConciliacionProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>("");

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadBankAccounts();
      setSelectedBankAccount("");
    } else {
      setBankAccounts([]);
      setSelectedBankAccount("");
    }
  }, [selectedCompany]);

  const handleLoadData = () => {
    if (selectedCompany && selectedBankAccount) {
      onLoadData({
        companyId: selectedCompany,
        bankAccountId: selectedBankAccount,
      });
    }
  };


  const isDataLoadEnabled = selectedCompany && selectedBankAccount && fechaFacturas && (hideMovimientosDate || fechaMovimientos);


  const loadCompanies = async () => {
    try {
      const response = await companiesService.getAllCompanies();
      if (response.success) {
        setCompanies(response.data);
      }
    } catch (error) {
      console.error("Error loading companies:", error);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const response = await bankAccountsService.getBankAccountsByCompany(
        selectedCompany
      );
      if (response.success) {
        setBankAccounts(response.data);
      }
    } catch (error) {
      console.error("Error loading bank accounts:", error);
    }
  };


  return (
    <>
      <Row className="mb-3">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Razón Social</Form.Label>
            <Form.Select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              <option value="">Seleccionar razón social</option>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Cuenta Bancaria</Form.Label>
            <Form.Select
              value={selectedBankAccount}
              onChange={(e) => setSelectedBankAccount(e.target.value)}
              disabled={!selectedCompany}
            >
              <option value="">Seleccionar cuenta</option>
              {bankAccounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.accountNumber} - {account.bank.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Tipo de Layout</Form.Label>
            <Form.Select
              value={layoutType}
              onChange={(e) => onLayoutTypeChange(e.target.value as 'grouped' | 'individual')}
            >
              <option value="grouped">Agrupado por Proveedor</option>
              <option value="individual">Facturas Individuales</option>
            </Form.Select>
          </Form.Group>
        </Col>
        {!hideButtons && (
          <Col md={3} className="d-flex align-items-end">
            <Button
              variant="outline-primary"
              onClick={handleLoadData}
              disabled={!isDataLoadEnabled || loading}
              size="sm"
              className="w-100"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Cargando...
                </>
              ) : (
                "Cargar Datos"
              )}
            </Button>
          </Col>
        )}
      </Row>
    </>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Row, Col, Form, Button, Spinner } from "react-bootstrap";
import { format } from "date-fns";
import { Company, BankAccount } from "../types";
import { companiesService, bankAccountsService } from "../services";

interface FiltrosConciliacionProps {
  onFiltersChange: (filters: {
    companyId: string;
    bankAccountId: string;
    fecha: string;
  }) => void;
  onConciliar: (filters: {
    companyId: string;
    bankAccountId: string;
    fecha: string;
  }) => void;
  loading: boolean;
}

export default function FiltrosConciliacion({
  onFiltersChange,
  onConciliar,
  loading,
}: FiltrosConciliacionProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );

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

  const handleFiltersUpdate = () => {
    console.log("handleFiltersUpdate - Valores:", {
      selectedCompany,
      selectedBankAccount,
      selectedDate,
    });
    if (selectedCompany && selectedBankAccount && selectedDate) {
      console.log("handleFiltersUpdate - Llamando a onFiltersChange");
      onFiltersChange({
        companyId: selectedCompany,
        bankAccountId: selectedBankAccount,
        fecha: selectedDate,
      });
    } else {
      console.log("handleFiltersUpdate - No se cumplen las condiciones");
    }
  };

  const handleManualLoad = () => {
    console.log("handleManualLoad - Botón presionado");
    handleFiltersUpdate();
  };

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

  const handleConciliar = () => {
    if (selectedCompany && selectedBankAccount && selectedDate) {
      onConciliar({
        companyId: selectedCompany,
        bankAccountId: selectedBankAccount,
        fecha: selectedDate,
      });
    }
  };

  return (
    <Row className="mb-4">
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
          <Form.Label>Fecha</Form.Label>
          <Form.Control
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </Form.Group>
      </Col>
      <Col md={3} className="d-flex align-items-end gap-2">
        <Button
          variant="outline-primary"
          onClick={handleManualLoad}
          disabled={!selectedCompany || !selectedBankAccount || loading}
        >
          Cargar Datos
        </Button>
        <Button
          variant="primary"
          onClick={handleConciliar}
          disabled={!selectedCompany || !selectedBankAccount || loading}
        >
          {loading ? <Spinner animation="border" size="sm" /> : "Conciliar"}
        </Button>
      </Col>
    </Row>
  );
}

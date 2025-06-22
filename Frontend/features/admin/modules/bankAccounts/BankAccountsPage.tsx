"use client";

import { ArrowLeft, FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Spinner, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import BankAccountActions from "./components/Actions";
import BankAccountModal from "./components/BankAccountModal";
import { bankAccountsService } from "./services/bankAccounts";
import { BankAccount } from "./types";

const BankAccountsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const searchParams = useSearchParams();
  const router = useRouter();
  const companyIdFromQuery = searchParams.get("company") || "";
  const [companyFilter, setCompanyFilter] =
    useState<string>(companyIdFromQuery);

  const loadBankAccounts = useCallback(
    async (isInitial: boolean, page: number = pagination.page) => {
      try {
        if (isInitial) {
          setLoading(true);
        }
        const response = await bankAccountsService.getAll({
          page,
          limit: pagination.limit,
          ...(searchTerm && { search: searchTerm }),
          ...(companyFilter && { company: companyFilter }),
        });
        if (
          response &&
          response.success &&
          Array.isArray((response as any).data)
        ) {
          setBankAccounts((response as any).data);
          if ((response as any).pagination) {
            setPagination((response as any).pagination);
          }
        } else {
          toast.error(
            response?.message || "Error al cargar las cuentas bancarias"
          );
        }
      } catch (error: any) {
        toast.error(error.message || "Error al cargar las cuentas bancarias");
        console.error("Error loading bank accounts:", error);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, searchTerm, companyFilter]
  );

  useEffect(() => {
    loadBankAccounts(true, 1);
  }, [searchTerm]);

  useEffect(() => {
    if (companyIdFromQuery) {
      setCompanyFilter(companyIdFromQuery);
    }
  }, [companyIdFromQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    loadBankAccounts(true, newPage);
  };

  const handleBankAccountSaved = () => {
    loadBankAccounts(false);
  };

  const handleGoBack = () => {
    router.push("/catalogos/razones-sociales");
  };

  // Función para generar los números de página a mostrar
  const getPageNumbers = () => {
    const { page, pages } = pagination;
    const delta = 2; // Número de páginas a mostrar antes y después de la página actual
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < pages - 1) {
      rangeWithDots.push('...', pages);
    } else if (pages > 1) {
      rangeWithDots.push(pages);
    }

    return rangeWithDots;
  };

  return (
    <div className="container-fluid">
      {companyFilter && (
        <div className="mb-1">
          <Button
            variant="link"
            className="d-flex align-items-center gap-1 px-0 text-primary text-decoration-none"
            onClick={handleGoBack}
          >
            <ArrowLeft size={16} className="text-primary" />
            Atrás
          </Button>
        </div>
      )}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header border-light d-flex justify-content-between align-items-center py-3">
              <div className="d-flex gap-2">
                <div className="position-relative" style={{ maxWidth: 400 }}>
                  <Form.Control
                    type="search"
                    placeholder="Buscar cuentas bancarias..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="shadow-none px-4"
                    style={{ fontSize: 15, paddingLeft: "2.5rem" }}
                  />
                  <Search
                    className="text-muted position-absolute"
                    size={18}
                    style={{
                      left: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                </div>
              </div>
              <BankAccountModal
                mode="create"
                onBankAccountSaved={handleBankAccountSaved}
              />
            </div>
            <div className="table-responsive shadow-sm">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <span className="ms-2">Cargando cuentas bancarias...</span>
                </div>
              ) : (
                <>
                  <Table
                    className="table table-custom table-centered table-select table-hover w-100 mb-0"
                    style={{ tableLayout: "fixed" }}
                  >
                    <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                      <tr>
                        <th className="text-center" style={{ width: "5%" }}>
                          #
                        </th>
                        <th className="text-center" style={{ width: "20%" }}>
                          Razón Social
                        </th>
                        <th className="text-center" style={{ width: "15%" }}>
                          Banco
                        </th>
                        <th className="text-center" style={{ width: "15%" }}>
                          Número de cuenta
                        </th>
                        <th className="text-center" style={{ width: "15%" }}>
                          Clabe
                        </th>
                        <th className="text-center" style={{ width: "15%" }}>
                          Sucursal
                        </th>
                        <th className="text-center" style={{ width: "10%" }}>
                          Estado
                        </th>
                        <th className="text-center" style={{ width: "10%" }}>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankAccounts.map((account, index) => (
                        <tr key={account._id}>
                          <td className="text-center">
                            <span className="text-muted fw-medium">
                              {(pagination.page - 1) * pagination.limit +
                                index +
                                1}
                            </span>
                          </td>
                          <td className="text-center">
                            {account.company?.name}
                          </td>
                          <td className="text-center">{account.bank?.name}</td>
                          <td className="text-center">
                            {account.accountNumber}
                          </td>
                          <td className="text-center">{account.clabe}</td>
                          <td className="text-center">{account.branch}</td>
                          <td className="text-center">
                            <span
                              className={`badge fs-6 ${account.isActive
                                  ? "bg-success bg-opacity-10 text-success"
                                  : "bg-danger bg-opacity-10 text-danger"
                                }`}
                            >
                              {account.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="text-center">
                            <BankAccountActions
                              bankAccount={account}
                              onBankAccountSaved={handleBankAccountSaved}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {bankAccounts.length === 0 && (
                    <div className="text-center py-5">
                      <FileText size={48} className="text-muted mb-3" />
                      <h5 className="text-muted">
                        No se encontraron cuentas bancarias
                      </h5>
                      <p className="text-muted">
                        {searchTerm
                          ? "Intenta cambiar los filtros de búsqueda"
                          : "No hay cuentas bancarias disponibles en el sistema"}
                      </p>
                    </div>
                  )}
                </>
              )}
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <span className="text-muted">
                  Mostrando {bankAccounts.length} de {pagination.total}{" "}
                  registros
                </span>
                <div className="d-flex gap-1 align-items-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="d-flex align-items-center"
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </Button>

                  {getPageNumbers().map((pageNum, index) => (
                    <React.Fragment key={index}>
                      {pageNum === '...' ? (
                        <span className="px-2 text-muted">...</span>
                      ) : (
                        <Button
                          variant={
                            pageNum === pagination.page
                              ? "primary"
                              : "outline-secondary"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum as number)}
                        >
                          {pageNum}
                        </Button>
                      )}
                    </React.Fragment>
                  ))}

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={
                      pagination.page === pagination.pages ||
                      pagination.pages === 0
                    }
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="d-flex align-items-center"
                  >
                    Siguiente
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankAccountsPage;

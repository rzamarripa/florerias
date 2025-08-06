"use client";
import { FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Form, Table, Spinner } from "react-bootstrap";
import BankNumberModal from "./components/BankNumberModal";
import { BankNumber, GetBankNumbersParams, PaginationResponse } from "./types";
import { getBankNumbers } from "./services/bankNumbers";

const BankNumbersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [bankNumbers, setBankNumbers] = useState<BankNumber[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [error, setError] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationResponse>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchBankNumbers = async (
    params?: GetBankNumbersParams,
    isInitial = false
  ) => {
    if (isInitial) setLoading(true);
    setError("");
    try {
      const query: GetBankNumbersParams = {
        page: params?.page || pagination.page,
        limit: params?.limit || pagination.limit,
      };
      if (searchTerm) query.search = searchTerm;

      const res = await getBankNumbers(query);
      if (res.success && Array.isArray(res.data)) {
        setBankNumbers(res.data);
        if (res.pagination) setPagination(res.pagination);
      } else {
        setBankNumbers([]);
        setError(res.message || "Error al cargar números de banco");
      }
    } catch {
      setError("Error de conexión con el servidor");
      setBankNumbers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankNumbers({}, true);
  }, []);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchBankNumbers();
    }, 500);
    setSearchTimeout(timeout);
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    fetchBankNumbers({ page });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const getPageNumbers = () => {
    const { page, pages } = pagination;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(pages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < pages - 1) {
      rangeWithDots.push("...", pages);
    } else if (pages > 1) {
      rangeWithDots.push(pages);
    }

    return rangeWithDots;
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header border-light d-flex justify-content-between align-items-center py-3">
            <div className="d-flex gap-2">
              <div className="position-relative" style={{ maxWidth: 400 }}>
                <Form.Control
                  type="search"
                  placeholder="Buscar números de banco..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="shadow-none px-4"
                  style={{
                    fontSize: 15,
                    paddingLeft: "2.5rem",
                  }}
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

            <div className="d-flex align-items-center gap-2">
              <BankNumberModal
                mode="create"
                onBankNumberSaved={() => fetchBankNumbers()}
              />
            </div>
          </div>

          <div className="table-responsive shadow-sm">
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : bankNumbers.length === 0 ? (
              <div className="text-center my-5">
                <FileText size={48} className="text-muted mb-2" />
                <p className="text-muted">
                  No hay números de banco registrados
                </p>
              </div>
            ) : (
              <>
                <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
                  <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                    <tr>
                      <th className="text-center">#</th>
                      <th>Banco de Cargo</th>
                      <th>Banco de Abono</th>
                      <th>Número de Banco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankNumbers.map((bankNumber, index) => (
                      <tr key={bankNumber._id}>
                        <td className="text-center">
                          <span className="text-muted">
                            {(pagination.page - 1) * pagination.limit +
                              index +
                              1}
                          </span>
                        </td>
                        <td>
                          <span className="fw-medium">
                            {bankNumber.bankDebited.name}
                          </span>
                        </td>
                        <td>
                          <span className="fw-medium">
                            {bankNumber.bankCredited}
                          </span>
                        </td>
                        <td>
                          <span className="fw-medium">
                            {bankNumber.bankNumber}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                  <span className="text-muted">
                    Mostrando {bankNumbers.length} de {pagination.total}{" "}
                    registros
                  </span>
                  <div className="d-flex gap-1 align-items-center">
                    <button
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      <ChevronLeft size={16} />
                      Anterior
                    </button>

                    {getPageNumbers().map((pageNum, index) => (
                      <React.Fragment key={index}>
                        {pageNum === "..." ? (
                          <span className="px-2 text-muted">...</span>
                        ) : (
                          <button
                            className={`btn btn-sm ${
                              pageNum === pagination.page
                                ? "btn-primary"
                                : "btn-outline-secondary"
                            }`}
                            onClick={() => handlePageChange(pageNum as number)}
                          >
                            {pageNum}
                          </button>
                        )}
                      </React.Fragment>
                    ))}

                    <button
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Siguiente
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankNumbersPage;

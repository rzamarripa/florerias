"use client";

import { FileText, Search } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Spinner, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import CountryActions from "./components/Actions";
import CountryModal from "./components/CountryModal";
import { countriesService } from "./services/countries";

interface Country {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

const CountryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const loadCountries = useCallback(
    async (isInitial: boolean, page: number = pagination.page) => {
      try {
        if (isInitial) {
          setLoading(true);
        }

        const response = await countriesService.getAll({
          page,
          limit: pagination.limit,
          ...(searchTerm && { search: searchTerm }),
        });

        if (response && response.success && Array.isArray(response.data)) {
          setCountries(response.data);
          if (response.pagination) {
            setPagination(response.pagination);
          }
        } else {
          toast.error(response?.message || "Error al cargar los países");
        }
      } catch (error: any) {
        toast.error(error.message || "Error al cargar los países");
        console.error("Error loading countries:", error);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, searchTerm]
  );

  useEffect(() => {
    loadCountries(true, 1);
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    loadCountries(true, newPage);
  };

  const handleCountrySaved = () => {
    loadCountries(false);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header border-light d-flex justify-content-between align-items-center py-3">
              <div className="d-flex gap-2">
                <div className="position-relative" style={{ maxWidth: 400 }}>
                  <Form.Control
                    type="search"
                    placeholder="Buscar países..."
                    value={searchTerm}
                    onChange={handleSearchChange}
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

              <CountryModal mode="create" onCountrySaved={handleCountrySaved} />
            </div>

            <div className="table-responsive shadow-sm">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <span className="ms-2">Cargando países...</span>
                </div>
              ) : (
                <>
                  <Table
                    className="table table-custom table-centered table-select table-hover w-100 mb-0"
                    style={{ tableLayout: "fixed" }}
                  >
                    <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                      <tr>
                        <th className="text-center" style={{ width: "10%" }}>
                          #
                        </th>
                        <th className="text-center" style={{ width: "50%" }}>
                          PAÍS
                        </th>
                        <th className="text-center" style={{ width: "20%" }}>
                          ESTADO
                        </th>
                        <th className="text-center" style={{ width: "20%" }}>
                          ACCIONES
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {countries.map((country, index) => (
                        <tr key={country._id}>
                          <td className="text-center">
                            <span className="text-muted fw-medium">
                              {(pagination.page - 1) * pagination.limit +
                                index +
                                1}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center align-items-center">
                              <span className="fw-medium text-dark">
                                {country.name}
                              </span>
                            </div>
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge fs-6 ${
                                country.isActive
                                  ? "bg-success bg-opacity-10 text-success"
                                  : "bg-danger bg-opacity-10 text-danger"
                              }`}
                            >
                              {country.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="text-center">
                            <CountryActions
                              country={country}
                              onCountrySaved={handleCountrySaved}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {countries.length === 0 && (
                    <div className="text-center py-5">
                      <FileText size={48} className="text-muted mb-3" />
                      <h5 className="text-muted">No se encontraron países</h5>
                      <p className="text-muted">
                        {searchTerm
                          ? "Intenta cambiar los filtros de búsqueda"
                          : "No hay países disponibles en el sistema"}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <span className="text-muted">
                  Mostrando {countries.length} de {pagination.total} registros
                </span>
                <div className="d-flex gap-1">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Anterior
                  </Button>
                  {Array.from(
                    { length: Math.min(5, pagination.pages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pagination.page === pageNum
                              ? "primary"
                              : "outline-secondary"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Siguiente
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

export default CountryPage;

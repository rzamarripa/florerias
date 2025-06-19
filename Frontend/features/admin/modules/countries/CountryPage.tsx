"use client";

import { FileText, Search } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Form, Spinner, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import CountryModal from "./components/CountryModal";
import { countriesService } from "./services/countries";
import { FiTrash2 } from "react-icons/fi";
import { BsCheck2 } from "react-icons/bs";

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
    limit: 15,
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

  const handleToggleCountry = (country: Country) => {
    // Implement the logic to toggle the country's active status
    console.log("Toggling country:", country._id, country.name);
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
                <div className="text-center my-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : countries.length === 0 ? (
                <div className="text-center my-5">
                  <FileText size={48} className="text-muted mb-2" />
                  <p className="text-muted">No hay países registrados</p>
                </div>
              ) : (
                <>
                  <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
                    <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                      <tr>
                        <th className="text-center">#</th>
                        <th>Nombre</th>
                        <th className="text-center">Estatus</th>
                        <th className="text-center text-nowrap">Fecha creación</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countries.map((country, index) => (
                        <tr key={country._id}>
                          <td className="text-center">
                            <span className="text-muted">
                              {(pagination.page - 1) * pagination.limit + index + 1}
                            </span>
                          </td>
                          <td>
                            <span className="fw-medium">{country.name}</span>
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
                            <span>
                              {new Date(country.createdAt).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-1">
                              <CountryModal
                                mode="edit"
                                editingCountry={country}
                                onCountrySaved={handleCountrySaved}
                              />
                              <button
                                className="btn btn-light btn-icon btn-sm rounded-circle"
                                title={
                                  country.isActive
                                    ? "Desactivar país"
                                    : "Activar país"
                                }
                                onClick={() => handleToggleCountry(country)}
                              >
                                {country.isActive ? (
                                  <FiTrash2 size={16} />
                                ) : (
                                  <BsCheck2 size={16} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <div className="d-flex justify-content-between align-items-center p-3 border-top">
                    <span className="text-muted">
                      Mostrando {countries.length} de {pagination.total} registros
                    </span>
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        disabled={pagination.page === 1}
                        onClick={() => handlePageChange(pagination.page - 1)}
                      >
                        Anterior
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                      >
                        {pagination.page}
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => handlePageChange(pagination.page + 1)}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountryPage;

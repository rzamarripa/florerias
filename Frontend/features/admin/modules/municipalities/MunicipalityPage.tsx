"use client";

import { FileText, Search } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { Form, Table, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import MunicipalityModal from "./components/MunicipalityModal";
import { getAll, deleteMunicipality, activateMunicipality, getAllActives } from "./services/municipalities";
import { Municipality, MunicipalitySearchParams } from "./types";
import { FiTrash2 } from "react-icons/fi";
import { BsCheck2 } from "react-icons/bs";

const MunicipalityPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedType, setSelectedType] = useState<string>("todos");
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 15,
        total: 0,
        pages: 0,
    });

    const loadMunicipalities = useCallback(
        async (params?: Partial<MunicipalitySearchParams>, isInitial: boolean = false) => {
            try {
                if (isInitial) setLoading(true);
                const searchParams: MunicipalitySearchParams = {
                    page: params?.page || pagination.page,
                    limit: params?.limit || pagination.limit,
                    search: searchTerm.trim() || undefined,
                    isActive:
                        selectedType === "todos"
                            ? undefined
                            : selectedType === "activos"
                            ? "true"
                            : "false",
                    ...params,
                };
                const response = await getAll(searchParams);
                if (response.success) {
                    setMunicipalities(response.data);
                    if (response.pagination) setPagination(response.pagination);
                } else {
                    toast.error(response.message || "Error al cargar los municipios");
                }
            } catch (error: any) {
                toast.error(error.message || "Error al cargar los municipios");
                console.error("Error loading municipalities:", error);
            } finally {
                setLoading(false);
            }
        }, [pagination.page, pagination.limit, searchTerm, selectedType]);

    useEffect(() => {
        const fetchInitial = async () => {
            setLoading(true);
            const response = await getAllActives();
            if (response.success) {
                setMunicipalities(response.data);
            } else {
                toast.error(response.message || "Error al cargar los municipios");
            }
            setLoading(false);
        };
        fetchInitial();
    }, []);

    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            loadMunicipalities({ page: 1 }, true);
        }, searchTerm ? 500 : 0);

        setSearchTimeout(timeout);

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [searchTerm, selectedType]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        setSelectedType(e.target.value);
    };

    const handlePageChange = (newPage: number) => {
        loadMunicipalities({ page: newPage, limit: pagination.limit }, false);
    };

    const handleMunicipalitySaved = () => {
        loadMunicipalities({ page: pagination.page, limit: pagination.limit }, false);
    };

    const handleToggleStatus = async (id: string, isActive: boolean) => {
        try {
            if (isActive) {
                await deleteMunicipality(id);
            } else {
                await activateMunicipality(id);
            }
            loadMunicipalities({ page: pagination.page, limit: pagination.limit }, false);
        } catch (error: any) {
            toast.error(error.message || "Error al cambiar el estado del municipio");
        }
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
                                        placeholder="Buscar municipios..."
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

                            <div className="d-flex align-items-center gap-2">
                                <Form.Select
                                    value={selectedType}
                                    onChange={handleTypeChange}
                                    style={{ minWidth: "150px" }}
                                    disabled={loading}
                                >
                                    <option value="todos">Todos los estados</option>
                                    <option value="activos">Municipios activos</option>
                                    <option value="inactivos">Municipios inactivos</option>
                                </Form.Select>

                                <MunicipalityModal
                                    mode="create"
                                    onMunicipalitySaved={handleMunicipalitySaved}
                                />
                            </div>
                        </div>

                        <div className="table-responsive shadow-sm">
                            {loading ? (
                                <div className="text-center my-5">
                                    <Spinner animation="border" variant="primary" />
                                </div>
                            ) : municipalities.length === 0 ? (
                                <div className="text-center my-5">
                                    <FileText size={48} className="text-muted mb-2" />
                                    <p className="text-muted">No hay municipios registrados</p>
                                </div>
                            ) : (
                                <>
                                    <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
                                        <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                                            <tr>
                                                <th className="text-center">#</th>
                                                <th>Nombre</th>
                                                <th>Estado</th>
                                                <th>País</th>
                                                <th className="text-center">Estatus</th>
                                                <th className="text-center text-nowrap">Fecha creación</th>
                                                <th className="text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {municipalities.map((municipality, index) => (
                                                <tr key={municipality._id}>
                                                    <td className="text-center">
                                                        <span className="text-muted">
                                                            {(pagination.page - 1) * pagination.limit + index + 1}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="fw-medium">{municipality.name}</span>
                                                    </td>
                                                    <td>
                                                        <span>{municipality.stateId?.name || "-"}</span>
                                                    </td>
                                                    <td>
                                                        <span>{municipality.stateId?.countryId?.name || "-"}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span
                                                            className={`badge fs-6 ${municipality.isActive
                                                                ? "bg-success bg-opacity-10 text-success"
                                                                : "bg-danger bg-opacity-10 text-danger"
                                                                }`}
                                                        >
                                                            {municipality.isActive ? "Activo" : "Inactivo"}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span>
                                                            {new Date(municipality.createdAt).toLocaleDateString("es-ES", {
                                                                year: "numeric",
                                                                month: "long",
                                                                day: "numeric",
                                                            })}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="d-flex justify-content-center gap-1">
                                                            <MunicipalityModal
                                                                mode="edit"
                                                                editingMunicipality={municipality}
                                                                onMunicipalitySaved={handleMunicipalitySaved}
                                                            />
                                                            <button
                                                                className="btn btn-light btn-icon btn-sm rounded-circle"
                                                                title={
                                                                    municipality.isActive
                                                                        ? "Desactivar municipio"
                                                                        : "Activar municipio"
                                                                }
                                                                onClick={() => handleToggleStatus(municipality._id, municipality.isActive)}
                                                            >
                                                                {municipality.isActive ? (
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
                                            Mostrando {municipalities.length} de {pagination.total} registros
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

export default MunicipalityPage;
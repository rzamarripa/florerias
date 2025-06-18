"use client";

import { FileText, Search } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { Form, Table, Spinner, Pagination } from "react-bootstrap";
import { toast } from "react-toastify";
import StateActions from "./components/Actions";
import StateModal from "./components/StateModal";
import { State } from "./types";


interface StateSearchParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: string;
}

const stateService = {
    getAll: async (params: StateSearchParams) => {
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockData: State[] = [
            { _id: "1", name: "Sinaloa", country: "México", isActive: true, createdAt: "2025-06-17T10:00:00Z" },
            { _id: "2", name: "California", country: "Estados Unidos", isActive: true, createdAt: "2025-06-17T10:00:00Z" },
            { _id: "3", name: "Ontario", country: "Canadá", isActive: false, createdAt: "2025-06-17T10:00:00Z" },
            { _id: "4", name: "Jalisco", country: "México", isActive: true, createdAt: "2025-06-17T10:00:00Z" },
        ];

        return {
            success: true,
            data: mockData,
            pagination: {
                page: params.page || 1,
                limit: params.limit || 10,
                total: mockData.length,
                pages: Math.ceil(mockData.length / (params.limit || 10))
            }
        };
    },

    toggleStatus: async (id: string, currentStatus: boolean) => {
        console.log(id, currentStatus);
    }
};

const StatesPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedType, setSelectedType] = useState<string>("todos");
    const [states, setStates] = useState<State[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
    });

    const loadStates = useCallback(async (isInitial: boolean, params?: Partial<StateSearchParams>) => {
        try {
            if (isInitial) {
                setLoading(true);
            }
            const searchParams: StateSearchParams = {
                page: params?.page || pagination.page,
                limit: params?.limit || pagination.limit,
                search: searchTerm.trim() || undefined,
                isActive: selectedType === "todos" ? undefined :
                    selectedType === "activos" ? "true" : "false",
                ...params,
            };

            const response = await stateService.getAll(searchParams);

            if (response.success) {
                setStates(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            } else {
                toast.error("Error al cargar los estados");
            }
        } catch (error: any) {
            toast.error(error.message || "Error al cargar los estados");
            console.error("Error loading states:", error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, searchTerm, selectedType]);

    useEffect(() => {
        loadStates(true);
    }, []);

    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            loadStates(false, { page: 1 });
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
        loadStates(false, { page: newPage });
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLimit = parseInt(e.target.value);
        loadStates(false, { page: 1, limit: newLimit });
    };

    const handleStateSaved = () => {
        loadStates(false);
    };

    const renderPagination = () => {
        if (pagination.pages <= 1) return null;

        const items = [];
        const currentPage = pagination.page;
        const totalPages = pagination.pages;

        items.push(
            <Pagination.Prev
                key="prev"
                disabled={currentPage === 1}
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
            />
        );

        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        if (endPage - startPage < 4) {
            if (startPage === 1) {
                endPage = Math.min(totalPages, startPage + 4);
            } else {
                startPage = Math.max(1, endPage - 4);
            }
        }

        for (let page = startPage; page <= endPage; page++) {
            items.push(
                <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => handlePageChange(page)}
                >
                    {page}
                </Pagination.Item>
            );
        }

        items.push(
            <Pagination.Next
                key="next"
                disabled={currentPage === totalPages}
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
            />
        );

        return (
            <Pagination className="mb-0">
                {items}
            </Pagination>
        );
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
                                        placeholder="Buscar estados..."
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
                                    <option value="activos">Estados activos</option>
                                    <option value="inactivos">Estados inactivos</option>
                                </Form.Select>

                                <StateModal
                                    mode="create"
                                    onStateSaved={handleStateSaved}
                                />
                            </div>
                        </div>

                        <div className="table-responsive shadow-sm">
                            {loading ? (
                                <div className="d-flex justify-content-center align-items-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <span className="ms-2">Cargando estados...</span>
                                </div>
                            ) : (
                                <>
                                    <Table className="table table-custom table-centered table-select table-hover w-100 mb-0" style={{ tableLayout: "fixed" }}>
                                        <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                                            <tr>
                                                <th className="text-center" style={{ width: "8%" }}>#</th>
                                                <th className="text-center" style={{ width: "25%" }}>PAÍS</th>
                                                <th className="text-center" style={{ width: "35%" }}>ESTADO</th>
                                                <th className="text-center" style={{ width: "15%" }}>STATUS</th>
                                                <th className="text-center" style={{ width: "17%" }}>ACCIONES</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {states.map((state, index) => (
                                                <tr key={state._id}>
                                                    <td className="text-center">
                                                        <span className="text-muted fw-medium">
                                                            {(pagination.page - 1) * pagination.limit + index + 1}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="d-flex justify-content-center align-items-center">
                                                            <span className="fw-medium text-dark">
                                                                {state.country}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="d-flex justify-content-center align-items-center">
                                                            <span className="fw-medium text-dark">
                                                                {state.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <span
                                                            className={`badge fs-6 ${state.isActive
                                                                ? "bg-success bg-opacity-10 text-success"
                                                                : "bg-danger bg-opacity-10 text-danger"
                                                                }`}
                                                        >
                                                            {state.isActive ? "Activo" : "Inactivo"}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <StateActions
                                                            state={state}
                                                            onStateSaved={handleStateSaved}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>

                                    {states.length === 0 && (
                                        <div className="text-center py-5">
                                            <FileText size={48} className="text-muted mb-3" />
                                            <h5 className="text-muted">No se encontraron estados</h5>
                                            <p className="text-muted">
                                                {searchTerm || selectedType !== "todos"
                                                    ? "Intenta cambiar los filtros de búsqueda"
                                                    : "No hay estados disponibles en el sistema"}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="d-flex justify-content-between align-items-center p-3 border-top">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        Mostrando {states.length} de {pagination.total} registros
                                    </span>
                                    <Form.Select
                                        size="sm"
                                        value={pagination.limit}
                                        onChange={handleLimitChange}
                                        style={{ width: "auto" }}
                                        disabled={loading}
                                    >
                                        <option value={5}>5 por página</option>
                                        <option value={10}>10 por página</option>
                                        <option value={25}>25 por página</option>
                                        <option value={50}>50 por página</option>
                                    </Form.Select>
                                </div>

                                {renderPagination()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatesPage;
"use client";

import { FileText, Search } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { Form, Table, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import StateModal from "./components/StateModal";
import { State } from "./types";
import { getAll } from "./services/states";
import StateActions from "./components/Actions";

const StatesPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedType, setSelectedType] = useState<string>("todos");
    const [states, setStates] = useState<State[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 15,
        total: 0,
        pages: 0,
    });

    const loadStates = useCallback(async (isInitial: boolean = false, params?: { page?: number; limit?: number }) => {
        try {
            if (isInitial) setLoading(true);
            const page = params?.page || pagination.page;
            const limit = params?.limit || pagination.limit;
            const searchParams: any = { page, limit };

            if (selectedType === "activos") {
                searchParams.isActive = "true";
            } else if (selectedType === "inactivos") {
                searchParams.isActive = "false";
            }

            if (searchTerm) {
                searchParams.search = searchTerm;
            }

            const response = await getAll(searchParams);
            if (response.success) {
                setStates(response.data);
                if (response.pagination) setPagination(response.pagination);
            } else {
                toast.error(response.message || "Error al cargar los estados");
            }
        } catch (error: any) {
            toast.error(error.message || "Error al cargar los estados");
            console.error("Error loading states:", error);
        } finally {
            if (isInitial) setLoading(false);
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
        loadStates(false, { page: newPage, limit: pagination.limit });
    };

    const handleStateSaved = () => {
        loadStates(false, { page: pagination.page, limit: pagination.limit });
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
                                <div className="text-center my-5">
                                    <Spinner animation="border" variant="primary" />
                                </div>
                            ) : states.length === 0 ? (
                                <div className="text-center my-5">
                                    <FileText size={48} className="text-muted mb-2" />
                                    <p className="text-muted">No hay estados registrados</p>
                                </div>
                            ) : (
                                <>
                                    <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
                                        <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                                            <tr>
                                                <th className="text-center">#</th>
                                                <th>Nombre</th>
                                                <th>País</th>
                                                <th className="text-center">Estatus</th>
                                                <th className="text-center text-nowrap">Fecha creación</th>
                                                <th className="text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {states.map((state, index) => (
                                                <tr key={state._id}>
                                                    <td className="text-center">
                                                        <span className="text-muted">
                                                            {(pagination.page - 1) * pagination.limit + index + 1}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="fw-medium">{state.name}</span>
                                                    </td>
                                                    <td>
                                                        <span>{state.countryId?.name || "-"}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span
                                                            className={`badge fs-6 ${
                                                                state.isActive
                                                                    ? "bg-success bg-opacity-10 text-success"
                                                                    : "bg-danger bg-opacity-10 text-danger"
                                                            }`}
                                                        >
                                                            {state.isActive ? "Activo" : "Inactivo"}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span>
                                                            {new Date(state.createdAt).toLocaleDateString("es-ES", {
                                                                year: "numeric",
                                                                month: "long",
                                                                day: "numeric",
                                                            })}
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

                                    <div className="d-flex justify-content-between align-items-center p-3 border-top">
                                        <span className="text-muted">
                                            Mostrando {states.length} de {pagination.total} registros
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

export default StatesPage;
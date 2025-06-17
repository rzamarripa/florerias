"use client"
import { FileText, Search } from "lucide-react";
import React, { useState } from "react";
import { Form, Table } from "react-bootstrap";
import { Category } from "../types";
import CategoryModal from "./CategoryModal";
import CategoryActions from "./Actions";


const CategoriasTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("todos");

  const [categorias] = useState<Category[]>([
    {
      _id: "1",
      nombre: "Electrónicos",
      status: true,
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z"
    },
    {
      _id: "2",
      nombre: "Ropa & Accesorios",
      status: true,
      createdAt: "2024-02-10T14:20:00Z",
      updatedAt: "2024-02-10T14:20:00Z"
    },
    {
      _id: "3",
      nombre: "Hogar & Jardín",
      status: false,
      createdAt: "2024-03-05T09:15:00Z",
      updatedAt: "2024-03-05T09:15:00Z"
    },
    {
      _id: "4",
      nombre: "Deportes & Recreación",
      status: true,
      createdAt: "2024-01-20T16:45:00Z",
      updatedAt: "2024-01-20T16:45:00Z"
    },
    {
      _id: "5",
      nombre: "Libros & Medios",
      status: true,
      createdAt: "2024-02-28T11:30:00Z",
      updatedAt: "2024-02-28T11:30:00Z"
    },
    {
      _id: "6",
      nombre: "Alimentación & Bebidas",
      status: false,
      createdAt: "2024-03-10T08:20:00Z",
      updatedAt: "2024-03-10T08:20:00Z"
    },
    {
      _id: "7",
      nombre: "Salud & Belleza",
      status: true,
      createdAt: "2024-01-25T13:15:00Z",
      updatedAt: "2024-01-25T13:15:00Z"
    },
    {
      _id: "8",
      nombre: "Automotriz",
      status: true,
      createdAt: "2024-02-15T10:00:00Z",
      updatedAt: "2024-02-15T10:00:00Z"
    }
  ]);

  const filteredCategorias: Category[] = categorias.filter((categoria: Category) => {
    const matchesSearch: boolean =
      categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType: boolean =
      selectedType === "todos" ||
      (selectedType === "activos" && categoria.status) ||
      (selectedType === "inactivos" && !categoria.status);
    return matchesSearch && matchesType;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedType(e.target.value);
  };

  const handleCategoriaSaved = () => {
    console.log("Categoria saved, would refresh data here");
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
                  placeholder="Buscar categorías..."
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
              >
                <option value="todos">Todos los estados</option>
                <option value="activos">Categorías activas</option>
                <option value="inactivos">Categorías inactivas</option>
              </Form.Select>

              <CategoryModal
                mode="create"
                onCategoriaSaved={handleCategoriaSaved}
              />
            </div>
          </div>

          <div className="table-responsive shadow-sm">
            <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
              <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                <tr>
                  <th className="text-center">#</th>
                  <th className="text-center">NOMBRE</th>
                  <th className="text-center">ESTADO</th>
                  <th className="text-center text-nowrap">FECHA CREACIÓN</th>
                  <th className="text-center text-nowrap">ÚLTIMA ACTUALIZACIÓN</th>
                  <th className="text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategorias.map((categoria: Category, index: number) => (
                  <tr key={categoria._id}>
                    <td className="text-center">
                      <span className="text-muted fw-medium">
                        {index + 1}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center align-items-center">
                        <span className="fw-medium text-dark">
                          {categoria.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge fs-6 ${
                          categoria.status
                            ? "bg-success bg-opacity-10 text-success"
                            : "bg-danger bg-opacity-10 text-danger"
                        }`}
                      >
                        {categoria.status ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="text-center">
                      <span>
                        {new Date(categoria.createdAt).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </td>
                    <td className="text-center">
                      <span>
                        {new Date(categoria.updatedAt).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </td>
                    <td className="text-center">
                      <CategoryActions
                        categoria={categoria}
                        onCategoriaSaved={handleCategoriaSaved}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {filteredCategorias.length === 0 && (
              <div className="text-center py-5">
                <FileText size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No se encontraron categorías</h5>
                <p className="text-muted">
                  {searchTerm || selectedType !== "todos"
                    ? "Intenta cambiar los filtros de búsqueda"
                    : "No hay categorías disponibles en el sistema"}
                </p>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <span className="text-muted">
                Mostrando {filteredCategorias.length} de {categorias.length} registros
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriasTable;
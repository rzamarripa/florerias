"use client"
import { FileText, Search } from "lucide-react";
import React, { useState } from "react";
import {  Form, Table } from "react-bootstrap";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import BranchModal from "./components/BranchModal";
import { Sucursal } from "./types";


const SucursalesTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("todos");

  // Datos mock para demostración (sin servicios)
  const [sucursales] = useState<Sucursal[]>([
    {
      _id: "1",
      nombre: "Sucursal Centro",
      razonSocial: "Razón social SA de CV",
      marca: "Marca Principal",
      pais: "México",
      estado: "Jalisco",
      ciudad: "Guadalajara",
      direccion: "Av. Vallarta 1234, Col. Americana",
      telefono: "+52 33 1234 5678",
      correo: "centro@empresa.com",
      descripcion: "Sucursal principal en el centro de la ciudad",
      status: true,
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z"
    },
    {
      _id: "2",
      nombre: "Sucursal Norte",
      razonSocial: "Empresa Nacional S.A.",
      marca: "Marca Secundaria",
      pais: "México",
      estado: "Jalisco",
      ciudad: "Zapopan",
      direccion: "Av. López Mateos 5678, Col. Providencia",
      telefono: "+52 33 9876 5432",
      correo: "norte@empresa.com",
      descripcion: "Sucursal en zona norte",
      status: false,
      createdAt: "2024-02-10T14:20:00Z",
      updatedAt: "2024-02-10T14:20:00Z"
    },
    {
      _id: "3",
      nombre: "Sucursal Sur",
      razonSocial: "Corporativo Internacional S. de R.L.",
      marca: "Marca Premium",
      pais: "México",
      estado: "Jalisco",
      ciudad: "Tlaquepaque",
      direccion: "Carretera a Chapala 9012, Col. Mirasol",
      telefono: "+52 33 5555 1111",
      correo: "sur@empresa.com",
      descripcion: "",
      status: true,
      createdAt: "2024-03-05T09:15:00Z",
      updatedAt: "2024-03-05T09:15:00Z"
    }
  ]);

  const filteredSucursales: Sucursal[] = sucursales.filter((sucursal: Sucursal) => {
    const matchesSearch: boolean =
      sucursal.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sucursal.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sucursal.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sucursal.correo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType: boolean =
      selectedType === "todos" ||
      (selectedType === "activos" && sucursal.status) ||
      (selectedType === "inactivos" && !sucursal.status);
    return matchesSearch && matchesType;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedType(e.target.value);
  };

  const handleToggleSucursal = async (id: string) => {
    console.log(`Toggle sucursal status for ID: ${id}`);
  };

  const isSucursalActive = (id: string) => {
    return sucursales.find((sucursal) => sucursal._id === id)?.status;
  };

  const handleSucursalSaved = () => {
    console.log("Sucursal saved, would refresh data here");
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
                  placeholder="Buscar sucursales..."
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
                <option value="activos">Sucursales activas</option>
                <option value="inactivos">Sucursales inactivas</option>
              </Form.Select>

              <BranchModal
                mode="create"
                onSucursalSaved={handleSucursalSaved}
              />
            </div>
          </div>

          <div className="table-responsive shadow-sm">
            <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
              <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                <tr>
                  <th className="text-center">#</th>
                  <th className="text-center">NOMBRE</th>
                  <th className="text-center">RAZÓN SOCIAL</th>
                  <th className="text-center">MARCA</th>
                  <th className="text-center">UBICACIÓN</th>
                  <th className="text-center">CONTACTO</th>
                  <th className="text-center">ESTADO</th>
                  <th className="text-center text-nowrap">FECHA CREACIÓN</th>
                  <th className="text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredSucursales.map((sucursal: Sucursal, index: number) => (
                  <tr key={sucursal._id}>
                    <td className="text-center">
                      <span className="text-muted fw-medium">
                        {index + 1}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex flex-column">
                        <span className="fw-medium text-dark">
                          {sucursal.nombre}
                        </span>
                        {sucursal.descripcion && (
                          <small className="text-muted">
                            {sucursal.descripcion}
                          </small>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="text-dark">
                        {sucursal.razonSocial}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-primary bg-opacity-10 text-primary">
                        {sucursal.marca}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex flex-column">
                        <span className="fw-medium text-dark">
                          {sucursal.ciudad}, {sucursal.estado}
                        </span>
                        <small className="text-muted">
                          {sucursal.pais}
                        </small>
                        {sucursal.direccion && (
                          <small className="text-muted">
                            {sucursal.direccion.length > 30 
                              ? `${sucursal.direccion.substring(0, 30)}...` 
                              : sucursal.direccion}
                          </small>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="d-flex flex-column">
                        <span className="text-dark">
                          {sucursal.telefono}
                        </span>
                        <small className="text-muted">
                          {sucursal.correo}
                        </small>
                      </div>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge fs-6 ${
                          sucursal.status
                            ? "bg-success bg-opacity-10 text-success"
                            : "bg-danger bg-opacity-10 text-danger"
                        }`}
                      >
                        {sucursal.status ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="text-center">
                      <span>
                        {new Date(sucursal.createdAt).toLocaleDateString(
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
                      <div className="d-flex justify-content-center gap-1">
                        {/* Botón autocontenido para editar sucursal */}
                        <BranchModal
                          mode="edit"
                          editingSucursal={sucursal}
                          onSucursalSaved={handleSucursalSaved}
                        />
                        
                        <button
                          className="btn btn-light btn-icon btn-sm rounded-circle"
                          title={
                            isSucursalActive(sucursal._id)
                              ? "Desactivar sucursal"
                              : "Activar sucursal"
                          }
                          onClick={() => handleToggleSucursal(sucursal._id)}
                        >
                          {isSucursalActive(sucursal._id) ? (
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

            {filteredSucursales.length === 0 && (
              <div className="text-center py-5">
                <FileText size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No se encontraron sucursales</h5>
                <p className="text-muted">
                  {searchTerm || selectedType !== "todos"
                    ? "Intenta cambiar los filtros de búsqueda"
                    : "No hay sucursales disponibles en el sistema"}
                </p>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <span className="text-muted">
                Mostrando {filteredSucursales.length} registros
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SucursalesTable;
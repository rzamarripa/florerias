"use client"
import { FileText, Search } from "lucide-react";
import React, { useState } from "react";
import { Form, Table } from "react-bootstrap";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import ProviderModal from "./ProviderModal";
import { Proveedor } from "../types";

const ProvidersTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("todos");

  const [proveedores] = useState<Proveedor[]>([
    {
      _id: "1",
      nombreComercial: "MaSoft",
      razonSocial: "Servicios Informáticos SA de CV",
      nombreContacto: "Raúl López",
      pais: "México",
      estado: "Jalisco",
      ciudad: "Guadalajara",
      direccion: "Av. Chapultepec 1234, Col. Americana",
      telefono: "+52 33 1234 5678",
      correo: "contacto@masoft.com",
      descripcion: "Proveedor principal de servicios informáticos",
      status: true,
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z"
    },
    {
      _id: "2",
      nombreComercial: "TechCorp",
      razonSocial: "Tecnología Avanzada S.A.",
      nombreContacto: "María González",
      pais: "México",
      estado: "Nuevo León",
      ciudad: "Monterrey",
      direccion: "Av. Constitución 5678, Col. Centro",
      telefono: "+52 81 9876 5432",
      correo: "ventas@techcorp.com",
      descripcion: "Especialistas en hardware y equipos",
      status: false,
      createdAt: "2024-02-10T14:20:00Z",
      updatedAt: "2024-02-10T14:20:00Z"
    },
    {
      _id: "3",
      nombreComercial: "SoftSolutions",
      razonSocial: "Soluciones Digitales S. de R.L.",
      nombreContacto: "Carlos Martínez",
      pais: "México",
      estado: "Ciudad de México",
      ciudad: "Benito Juárez",
      direccion: "Insurgentes Sur 9012, Col. Del Valle",
      telefono: "+52 55 5555 1111",
      correo: "info@softsolutions.com",
      descripcion: "",
      status: true,
      createdAt: "2024-03-05T09:15:00Z",
      updatedAt: "2024-03-05T09:15:00Z"
    },
    {
      _id: "4",
      nombreComercial: "DataPro",
      razonSocial: "Sistemas Integrados S.A.P.I.",
      nombreContacto: "Ana Rodríguez",
      pais: "España",
      estado: "Madrid",
      ciudad: "Madrid",
      direccion: "Gran Vía 123, 28013 Madrid",
      telefono: "+34 91 1234 567",
      correo: "contacto@datapro.es",
      descripcion: "Proveedor internacional de bases de datos",
      status: true,
      createdAt: "2024-01-20T16:45:00Z",
      updatedAt: "2024-01-20T16:45:00Z"
    }
  ]);

  const filteredProveedores: Proveedor[] = proveedores.filter((proveedor: Proveedor) => {
    const matchesSearch: boolean =
      proveedor.nombreComercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.nombreContacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.correo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType: boolean =
      selectedType === "todos" ||
      (selectedType === "activos" && proveedor.status) ||
      (selectedType === "inactivos" && !proveedor.status);
    return matchesSearch && matchesType;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedType(e.target.value);
  };

  const handleToggleProveedor = async (id: string) => {
    console.log(`Toggle proveedor status for ID: ${id}`);
  };

  const isProveedorActive = (id: string) => {
    return proveedores.find((proveedor) => proveedor._id === id)?.status;
  };

  const handleProveedorSaved = () => {
    console.log("Proveedor saved, would refresh data here");
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
                  placeholder="Buscar proveedores..."
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
                <option value="activos">Proveedores activos</option>
                <option value="inactivos">Proveedores inactivos</option>
              </Form.Select>

              <ProviderModal
                mode="create"
                onProveedorSaved={handleProveedorSaved}
              />
            </div>
          </div>

          <div className="table-responsive shadow-sm">
            <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
              <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                <tr>
                  <th className="text-center">#</th>
                  <th className="text-center">NOMBRE COMERCIAL</th>
                  <th className="text-center">RAZÓN SOCIAL</th>
                  <th className="text-center">CONTACTO</th>
                  <th className="text-center">UBICACIÓN</th>
                  <th className="text-center">INFORMACIÓN</th>
                  <th className="text-center">ESTADO</th>
                  <th className="text-center text-nowrap">FECHA CREACIÓN</th>
                  <th className="text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredProveedores.map((proveedor: Proveedor, index: number) => (
                  <tr key={proveedor._id}>
                    <td className="text-center">
                      <span className="text-muted fw-medium">
                        {index + 1}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex flex-column">
                        <span className="fw-medium text-dark">
                          {proveedor.nombreComercial}
                        </span>
                        {proveedor.descripcion && (
                          <small className="text-muted">
                            {proveedor.descripcion}
                          </small>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="text-dark">
                        {proveedor.razonSocial}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex flex-column">
                        <span className="fw-medium text-dark">
                          {proveedor.nombreContacto}
                        </span>
                        <small className="text-muted">
                          {proveedor.telefono}
                        </small>
                        <small className="text-muted">
                          {proveedor.correo}
                        </small>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="d-flex flex-column">
                        <span className="fw-medium text-dark">
                          {proveedor.ciudad}, {proveedor.estado}
                        </span>
                        <small className="text-muted">
                          {proveedor.pais}
                        </small>
                        {proveedor.direccion && (
                          <small className="text-muted">
                            {proveedor.direccion.length > 30 
                              ? `${proveedor.direccion.substring(0, 30)}...` 
                              : proveedor.direccion}
                          </small>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="d-flex flex-column">
                        <span className="badge bg-info bg-opacity-10 text-info mb-1">
                          Proveedor
                        </span>
                        <small className="text-muted">
                          {new Date(proveedor.updatedAt).toLocaleDateString("es-ES")}
                        </small>
                      </div>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge fs-6 ${
                          proveedor.status
                            ? "bg-success bg-opacity-10 text-success"
                            : "bg-danger bg-opacity-10 text-danger"
                        }`}
                      >
                        {proveedor.status ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="text-center">
                      <span>
                        {new Date(proveedor.createdAt).toLocaleDateString(
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
                        <ProviderModal
                          mode="edit"
                          editingProveedor={proveedor}
                          onProveedorSaved={handleProveedorSaved}
                        />
                        
                        <button
                          className="btn btn-light btn-icon btn-sm rounded-circle"
                          title={
                            isProveedorActive(proveedor._id)
                              ? "Desactivar proveedor"
                              : "Activar proveedor"
                          }
                          onClick={() => handleToggleProveedor(proveedor._id)}
                        >
                          {isProveedorActive(proveedor._id) ? (
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

            {filteredProveedores.length === 0 && (
              <div className="text-center py-5">
                <FileText size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No se encontraron proveedores</h5>
                <p className="text-muted">
                  {searchTerm || selectedType !== "todos"
                    ? "Intenta cambiar los filtros de búsqueda"
                    : "No hay proveedores disponibles en el sistema"}
                </p>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <span className="text-muted">
                Mostrando {filteredProveedores.length} registros
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvidersTable;
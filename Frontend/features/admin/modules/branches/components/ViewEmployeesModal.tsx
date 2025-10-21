"use client";

import React from "react";
import { Modal, Table, Badge, Alert } from "react-bootstrap";
import { Users, UserCheck, Shield } from "lucide-react";
import { Branch, Employee, Manager } from "../types";

interface ViewEmployeesModalProps {
  show: boolean;
  onHide: () => void;
  branch: Branch;
}

const ViewEmployeesModal: React.FC<ViewEmployeesModalProps> = ({
  show,
  onHide,
  branch,
}) => {
  // Verificar si hay empleados
  const hasEmployees = Array.isArray(branch.employees) && branch.employees.length > 0;

  // Verificar si el manager está poblado
  const hasManager = branch.manager && typeof branch.manager !== "string";

  // Contar total de personal (gerente + empleados)
  const totalStaff = (hasManager ? 1 : 0) + (hasEmployees ? branch.employees.length : 0);

  // Función para obtener el rol del empleado
  const getEmployeeRole = (employee: Employee | string): string => {
    if (typeof employee === "string") return "N/A";
    return employee.role?.name || "N/A";
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton style={{ borderBottom: "2px solid #f1f3f5" }}>
        <Modal.Title className="d-flex align-items-center gap-2">
          <Users size={24} className="text-primary" />
          <div>
            <div>Personal de {branch.branchName}</div>
            <small className="text-muted fw-normal">
              {branch.branchCode && <span className="badge bg-secondary me-2">{branch.branchCode}</span>}
              Total: {totalStaff} persona{totalStaff !== 1 ? "s" : ""}
            </small>
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {/* Información del Gerente */}
        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Shield size={20} className="text-warning" />
            <h6 className="mb-0 fw-bold">Gerente de Sucursal</h6>
          </div>
          {hasManager ? (
            <div className="card border-0 shadow-sm" style={{ borderRadius: "10px" }}>
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "white",
                          fontSize: "20px",
                          fontWeight: "bold",
                        }}
                      >
                        {(branch.manager as Manager).profile.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-bold">{(branch.manager as Manager).profile.fullName}</div>
                        <small className="text-muted">@{(branch.manager as Manager).username}</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block">Email</small>
                    <div>{(branch.manager as Manager).email}</div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block">Teléfono</small>
                    <div>{(branch.manager as Manager).phone || "N/A"}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Alert variant="warning" className="mb-0">
              <div className="d-flex align-items-center gap-2">
                <Shield size={18} />
                <span>Esta sucursal no tiene un gerente asignado</span>
              </div>
            </Alert>
          )}
        </div>

        {/* Lista de Empleados */}
        <div>
          <div className="d-flex align-items-center gap-2 mb-3">
            <UserCheck size={20} className="text-success" />
            <h6 className="mb-0 fw-bold">
              Empleados ({hasEmployees ? branch.employees.length : 0})
            </h6>
          </div>

          {hasEmployees ? (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-muted">#</th>
                    <th className="px-4 py-3 fw-semibold text-muted">NOMBRE COMPLETO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">USUARIO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">EMAIL</th>
                    <th className="px-4 py-3 fw-semibold text-muted">TELÉFONO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">ROL</th>
                  </tr>
                </thead>
                <tbody>
                  {branch.employees.map((employee, index) => {
                    if (typeof employee === "string") {
                      return (
                        <tr key={employee}>
                          <td className="px-4 py-3">{index + 1}</td>
                          <td className="px-4 py-3" colSpan={5}>
                            <span className="text-muted">Información no disponible</span>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={employee._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="d-flex align-items-center justify-content-center"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: "#e9ecef",
                                color: "#495057",
                                fontSize: "14px",
                                fontWeight: "bold",
                              }}
                            >
                              {employee.profile.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="fw-semibold">{employee.profile.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-muted">@{employee.username}</span>
                        </td>
                        <td className="px-4 py-3">{employee.email}</td>
                        <td className="px-4 py-3">{employee.phone || "N/A"}</td>
                        <td className="px-4 py-3">
                          <Badge
                            bg="info"
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontWeight: "500",
                            }}
                          >
                            {getEmployeeRole(employee)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <Alert variant="info" className="mb-0">
              <div className="d-flex align-items-center gap-2">
                <UserCheck size={18} />
                <span>Esta sucursal no tiene empleados asignados</span>
              </div>
            </Alert>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer style={{ borderTop: "2px solid #f1f3f5" }}>
        <div className="d-flex justify-content-between align-items-center w-100">
          <div className="text-muted">
            <small>
              <strong>Contacto de Sucursal:</strong> {branch.contactEmail} | {branch.contactPhone}
            </small>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onHide}
            style={{ borderRadius: "8px" }}
          >
            Cerrar
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewEmployeesModal;

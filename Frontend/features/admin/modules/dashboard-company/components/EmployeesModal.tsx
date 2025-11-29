"use client";

import React from "react";
import { Modal, Table, Badge } from "react-bootstrap";
import { Employee } from "../types";
import { User, Mail, Phone, CheckCircle, XCircle } from "lucide-react";

interface EmployeesModalProps {
  show: boolean;
  onHide: () => void;
  employees: Employee[];
  branchName: string;
}

const EmployeesModal: React.FC<EmployeesModalProps> = ({
  show,
  onHide,
  employees,
  branchName,
}) => {
  const getAvatarColor = (name: string) => {
    const colors = [
      "#0d6efd",
      "#6610f2",
      "#6f42c1",
      "#d63384",
      "#dc3545",
      "#fd7e14",
      "#ffc107",
      "#198754",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (fullName: string) => {
    const names = fullName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header
        closeButton
        className="bg-primary text-white"
        style={{
          borderTopLeftRadius: "var(--bs-modal-inner-border-radius)",
          borderTopRightRadius: "var(--bs-modal-inner-border-radius)",
        }}
      >
        <Modal.Title className="d-flex align-items-center">
          <User size={24} className="me-2" />
          Empleados de {branchName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "600px", overflowY: "auto" }}>
        {employees.length === 0 ? (
          <div className="text-center py-5">
            <User size={48} className="text-muted mb-3" />
            <p className="text-muted">
              No hay empleados registrados en esta sucursal
            </p>
          </div>
        ) : (
          <Table hover responsive className="mb-0">
            <thead>
              <tr style={{ borderBottom: "2px solid #dee2e6" }}>
                <th style={{ fontSize: "13px", fontWeight: "600" }}>
                  Empleado
                </th>
                <th style={{ fontSize: "13px", fontWeight: "600" }}>Rol</th>
                <th style={{ fontSize: "13px", fontWeight: "600" }}>
                  Contacto
                </th>
                <th style={{ fontSize: "13px", fontWeight: "600" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee._id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-3"
                        style={{
                          width: "40px",
                          height: "40px",
                          background: getAvatarColor(
                            employee.profile.fullName
                          ),
                          fontSize: "14px",
                          flexShrink: 0,
                        }}
                      >
                        {employee.profile.image ? (
                          <img
                            src={employee.profile.image}
                            alt={employee.profile.fullName}
                            className="rounded-circle"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          getInitials(employee.profile.fullName)
                        )}
                      </div>
                      <div>
                        <p className="mb-0 fw-semibold" style={{ fontSize: "14px" }}>
                          {employee.profile.fullName}
                        </p>
                        <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                          @{employee.username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="align-middle">
                    <Badge
                      bg="light"
                      text="dark"
                      className="px-3 py-2"
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        borderRadius: "8px",
                      }}
                    >
                      {employee.role.name}
                    </Badge>
                  </td>
                  <td className="align-middle">
                    <div>
                      <div className="d-flex align-items-center mb-1">
                        <Mail size={14} className="me-2 text-muted" />
                        <span style={{ fontSize: "13px" }}>
                          {employee.email}
                        </span>
                      </div>
                      <div className="d-flex align-items-center">
                        <Phone size={14} className="me-2 text-muted" />
                        <span style={{ fontSize: "13px" }}>
                          {employee.phone}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="align-middle">
                    {employee.profile.estatus ? (
                      <Badge
                        bg="success"
                        className="px-3 py-2 d-flex align-items-center justify-content-center"
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          borderRadius: "8px",
                          width: "fit-content",
                        }}
                      >
                        <CheckCircle size={14} className="me-1" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge
                        bg="danger"
                        className="px-3 py-2 d-flex align-items-center justify-content-center"
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          borderRadius: "8px",
                          width: "fit-content",
                        }}
                      >
                        <XCircle size={14} className="me-1" />
                        Inactivo
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <p className="text-muted mb-0 me-auto" style={{ fontSize: "13px" }}>
          Total: {employees.length} empleado{employees.length !== 1 ? "s" : ""}
        </p>
      </Modal.Footer>
    </Modal>
  );
};

export default EmployeesModal;

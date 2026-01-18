"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
    <Dialog open={show} onOpenChange={onHide}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User size={20} />
            Empleados de {branchName}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[600px] overflow-y-auto">
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <User size={48} className="text-muted-foreground mb-3 mx-auto" />
              <p className="text-muted-foreground">
                No hay empleados registrados en esta sucursal
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow style={{ borderBottom: "2px solid #dee2e6" }}>
                  <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                    Empleado
                  </TableHead>
                  <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>Rol</TableHead>
                  <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                    Contacto
                  </TableHead>
                  <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div
                          className="rounded-full flex items-center justify-center text-white font-bold mr-3"
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
                              className="rounded-full"
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
                          <p className="mb-0 font-semibold" style={{ fontSize: "14px" }}>
                            {employee.profile.fullName}
                          </p>
                          <p className="mb-0 text-muted-foreground" style={{ fontSize: "12px" }}>
                            @{employee.username}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">
                      <Badge
                        variant="secondary"
                        className="px-3 py-2"
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          borderRadius: "8px",
                        }}
                      >
                        {employee.role.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle">
                      <div>
                        <div className="flex items-center mb-1">
                          <Mail size={14} className="mr-2 text-muted-foreground" />
                          <span style={{ fontSize: "13px" }}>
                            {employee.email}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Phone size={14} className="mr-2 text-muted-foreground" />
                          <span style={{ fontSize: "13px" }}>
                            {employee.phone}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">
                      {employee.profile.estatus ? (
                        <Badge
                          variant="default"
                          className="px-3 py-2 flex items-center justify-center w-fit bg-green-500"
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            borderRadius: "8px",
                          }}
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge
                          variant="destructive"
                          className="px-3 py-2 flex items-center justify-center w-fit"
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            borderRadius: "8px",
                          }}
                        >
                          <XCircle size={14} className="mr-1" />
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <p className="text-muted-foreground mb-0 mr-auto" style={{ fontSize: "13px" }}>
            Total: {employees.length} empleado{employees.length !== 1 ? "s" : ""}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeesModal;

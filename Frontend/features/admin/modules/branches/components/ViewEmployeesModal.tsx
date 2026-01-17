"use client";

import React from "react";
import { Users, UserCheck, Shield } from "lucide-react";
import { Branch, Employee, Manager } from "../types";

import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

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
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <div>Personal de {branch.branchName}</div>
              <div className="text-sm font-normal text-muted-foreground">
                {branch.branchCode && (
                  <Badge variant="secondary" className="mr-2">{branch.branchCode}</Badge>
                )}
                Total: {totalStaff} persona{totalStaff !== 1 ? "s" : ""}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 p-1">
            {/* Información del Gerente */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-yellow-500" />
                <h6 className="font-bold">Gerente de Sucursal</h6>
              </div>
              {hasManager ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                            {(branch.manager as Manager).profile.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold">{(branch.manager as Manager).profile.fullName}</div>
                          <span className="text-sm text-muted-foreground">@{(branch.manager as Manager).username}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block">Email</span>
                        <div>{(branch.manager as Manager).email}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block">Teléfono</span>
                        <div>{(branch.manager as Manager).phone || "N/A"}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Esta sucursal no tiene un gerente asignado
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Lista de Empleados */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="h-5 w-5 text-green-500" />
                <h6 className="font-bold">
                  Empleados ({hasEmployees ? branch.employees.length : 0})
                </h6>
              </div>

              {hasEmployees ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Rol</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branch.employees.map((employee, index) => {
                      if (typeof employee === "string") {
                        return (
                          <TableRow key={employee}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell colSpan={5}>
                              <span className="text-muted-foreground">Información no disponible</span>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return (
                        <TableRow key={employee._id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-sm">
                                  {employee.profile.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-semibold">{employee.profile.fullName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">@{employee.username}</span>
                          </TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.phone || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {getEmployeeRole(employee)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <UserCheck className="h-4 w-4" />
                  <AlertDescription>
                    Esta sucursal no tiene empleados asignados
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            <strong>Contacto de Sucursal:</strong> {branch.contactEmail} | {branch.contactPhone}
          </div>
          <Button variant="outline" onClick={onHide}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewEmployeesModal;

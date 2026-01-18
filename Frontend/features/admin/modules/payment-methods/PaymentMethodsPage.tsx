"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { paymentMethodsService } from "./services/paymentMethods";
import { PaymentMethod, PaymentMethodFilters, CreatePaymentMethodData } from "./types";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";

const PaymentMethodsPage: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<CreatePaymentMethodData>({
    name: "",
    abbreviation: "",
    status: true,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const { user } = useUserSessionStore();
  const { activeBranch } = useActiveBranchStore();
  const isGerente = user?.role?.name === "Gerente";

  const loadPaymentMethods = async (isInitial: boolean, page: number = pagination.page) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: PaymentMethodFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters.name = searchTerm;
      }

      if (statusFilter !== "all") {
        filters.status = statusFilter === "true";
      }

      const response = await paymentMethodsService.getAllPaymentMethods(filters);

      if (response.data) {
        setPaymentMethods(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los métodos de pago");
      console.error("Error loading payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods(true, 1);
  }, [searchTerm, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadPaymentMethods(true, page);
  };

  const handleNewPaymentMethod = () => {
    setEditingPaymentMethod(null);
    setFormData({ name: "", abbreviation: "", status: true });
    setShowModal(true);
  };

  const handleEditPaymentMethod = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setFormData({
      name: paymentMethod.name,
      abbreviation: paymentMethod.abbreviation,
      status: paymentMethod.status,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPaymentMethod(null);
    setFormData({ name: "", abbreviation: "", status: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.abbreviation.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      if (editingPaymentMethod) {
        const { branch, ...updateData } = formData;
        await paymentMethodsService.updatePaymentMethod(editingPaymentMethod._id, updateData);
        toast.success("Método de pago actualizado exitosamente");
      } else {
        let finalData = { ...formData };

        if (isGerente) {
          delete finalData.branch;
        } else if (activeBranch) {
          finalData.branch = activeBranch._id;
        } else {
          toast.error("Por favor selecciona una sucursal");
          return;
        }

        await paymentMethodsService.createPaymentMethod(finalData);
        toast.success("Método de pago creado exitosamente");
      }
      handleCloseModal();
      loadPaymentMethods(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el método de pago");
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    if (!confirm("¿Estás seguro de eliminar este método de pago?")) return;

    try {
      await paymentMethodsService.deletePaymentMethod(paymentMethodId);
      toast.success("Método de pago eliminado exitosamente");
      loadPaymentMethods(false);
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el método de pago");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Métodos de Pago"
        description="Gestiona los métodos de pago del sistema"
        action={{
          label: "Nuevo Método de Pago",
          icon: <Plus className="h-4 w-4" />,
          onClick: handleNewPaymentMethod,
        }}
      />

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-4 p-4 border-b">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground mt-3">Cargando métodos de pago...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Abreviatura</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <CreditCard className="h-12 w-12 opacity-50" />
                          <p>No se encontraron métodos de pago</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentMethods.map((paymentMethod, index) => (
                      <TableRow key={paymentMethod._id}>
                        <TableCell>
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">{paymentMethod.name}</TableCell>
                        <TableCell>{paymentMethod.abbreviation}</TableCell>
                        <TableCell>
                          <Badge variant={paymentMethod.status ? "default" : "destructive"}>
                            {paymentMethod.status ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditPaymentMethod(paymentMethod)}
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(paymentMethod._id)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {paymentMethods.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                    {pagination.total} métodos de pago
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-2">
                      Página {pagination.page} de {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal para crear/editar */}
      <Dialog open={showModal} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPaymentMethod ? "Editar Método de Pago" : "Nuevo Método de Pago"}
            </DialogTitle>
            <DialogDescription>
              {editingPaymentMethod
                ? "Actualiza la información del método de pago"
                : "Completa los datos del nuevo método de pago"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ej: Efectivo, Tarjeta de Crédito, Transferencia"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abbreviation">
                  Abreviatura <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="abbreviation"
                  type="text"
                  placeholder="Ej: EFE, TC, TRANS"
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
                  required
                  maxLength={10}
                />
                <p className="text-sm text-muted-foreground">Máximo 10 caracteres</p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="status">Estado</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="status"
                    checked={formData.status}
                    onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.status ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingPaymentMethod ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentMethodsPage;

"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Select from "react-select";
import { clientsService } from "../../clients/services/clients";
import { paymentMethodsService } from "../../payment-methods/services/paymentMethods";
import { branchesService } from "../../branches/services/branches";
import { Client } from "../../clients/types";
import { PaymentMethod } from "../types";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FinanceFiltersProps {
  onSearch: (filters: {
    startDate: string;
    endDate: string;
    clientIds?: string[];
    paymentMethods?: string[];
    branchId?: string;
    cashierId?: string;
  }) => void;
}

const FinanceFilters: React.FC<FinanceFiltersProps> = ({ onSearch }) => {
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [selectedClients, setSelectedClients] = useState<any[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<any[]>(
    []
  );
  const [branchId, setBranchId] = useState<string>("");
  const [cashierId, setCashierId] = useState<string>("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingCashiers, setLoadingCashiers] = useState(false);

  const { activeBranch } = useActiveBranchStore();
  const { hasRole } = useUserRoleStore();
  const isAdmin = hasRole("Administrador") || hasRole("Admin");

  useEffect(() => {
    loadClients();
    loadPaymentMethods();
    // Solo cargar sucursales si NO es administrador
    if (!isAdmin) {
      loadUserBranches();
    }
  }, [isAdmin]);

  // Si es administrador con sucursal activa, usarla automáticamente
  useEffect(() => {
    if (isAdmin && activeBranch) {
      setBranchId(activeBranch._id);
    } else if (isAdmin && !activeBranch) {
      setBranchId(""); // Sin sucursal
    }
  }, [isAdmin, activeBranch]);

  // Cargar cajeros cuando se selecciona una sucursal
  useEffect(() => {
    if (branchId) {
      loadCashiers(branchId);
    } else {
      setCashiers([]);
      setCashierId("");
    }
  }, [branchId]);

  // Ejecutar búsqueda automática al cargar la página
  useEffect(() => {
    // Esperar a que se carguen los datos necesarios
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const loadClients = async () => {
    try {
      const response = await clientsService.getAllClients({
        page: 1,
        limit: 1000,
        status: true,
      });
      if (response.data) {
        setClients(response.data);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await paymentMethodsService.getAllPaymentMethods({
        status: true,
      });
      if (response.data) {
        setPaymentMethods(response.data);
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
    }
  };

  const loadUserBranches = async () => {
    try {
      setLoadingBranches(true);
      const response = await branchesService.getUserBranches();
      if (response.success) {
        setBranches(response.data);
        // Si solo hay una sucursal, seleccionarla automáticamente
        if (response.data.length === 1) {
          setBranchId(response.data[0]._id);
        }
      }
    } catch (error) {
      console.error("Error loading branches:", error);
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadCashiers = async (selectedBranchId: string) => {
    try {
      setLoadingCashiers(true);
      const response = await branchesService.getCashiersByBranch(selectedBranchId);
      if (response.success) {
        setCashiers(response.data);
      }
    } catch (error) {
      console.error("Error loading cashiers:", error);
      setCashiers([]);
    } finally {
      setLoadingCashiers(false);
    }
  };

  const handleSearch = () => {
    // El backend resolverá automáticamente las sucursales según el rol
    // Si branchId está vacío, el backend buscará en todas las sucursales de la empresa del admin
    onSearch({
      startDate,
      endDate,
      clientIds: selectedClients.map((client) => client.value),
      paymentMethods: selectedPaymentMethods.map((method) => method.value),
      branchId: branchId || undefined,
      cashierId: cashierId || undefined,
    });
  };

  const clientOptions = clients.map((client) => ({
    value: client._id,
    label: `${client.name} ${client.lastName}`,
  }));

  const paymentMethodOptions = paymentMethods.map((method) => ({
    value: method._id,
    label: method.name,
  }));

  const customStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: "42px",
      borderRadius: "10px",
      borderColor: "#dee2e6",
      "&:hover": {
        borderColor: "var(--bs-primary)",
      },
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: "var(--bs-primary-bg-subtle)",
      borderRadius: "6px",
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: "var(--bs-primary)",
      fontWeight: "500",
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: "var(--bs-primary)",
      "&:hover": {
        backgroundColor: "var(--bs-primary)",
        color: "white",
      },
    }),
  };

  return (
    <Card className="shadow-sm mb-4 rounded-[15px]">
      <CardContent className="p-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label className="font-semibold text-muted-foreground text-sm">
              Fecha Inicial *
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-[10px] h-[42px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-muted-foreground text-sm">
              Fecha Final *
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-[10px] h-[42px]"
            />
          </div>

          {isAdmin && activeBranch ? (
            <div className="space-y-2">
              <Label className="font-semibold text-muted-foreground text-sm">
                Sucursal *
              </Label>
              <Input
                type="text"
                value={activeBranch.branchName}
                disabled
                readOnly
                className="rounded-[10px] h-[42px] bg-muted"
              />
            </div>
          ) : isAdmin && !activeBranch ? (
            <div className="flex items-end">
              <Alert className="mb-0 p-2">
                <AlertDescription className="text-sm">
                  <strong>Sin sucursal:</strong> Los resultados incluirán todas las sucursales
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="font-semibold text-muted-foreground text-sm">
                Sucursal *
              </Label>
              <ShadcnSelect
                value={branchId}
                onValueChange={setBranchId}
                disabled={loadingBranches}
              >
                <SelectTrigger className="rounded-[10px] h-[42px]">
                  <SelectValue
                    placeholder={
                      branches.length > 1
                        ? "Selecciona una sucursal"
                        : "Cargando..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.branchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadcnSelect>
            </div>
          )}

          {(isAdmin && activeBranch) || !isAdmin ? (
            <div className="space-y-2">
              <Label className="font-semibold text-muted-foreground text-sm">
                Cajero
              </Label>
              <ShadcnSelect
                value={cashierId}
                onValueChange={setCashierId}
                disabled={!branchId || loadingCashiers}
              >
                <SelectTrigger className="rounded-[10px] h-[42px]">
                  <SelectValue
                    placeholder={
                      !branchId
                        ? "Selecciona una sucursal primero"
                        : loadingCashiers
                        ? "Cargando cajeros..."
                        : "Todos los cajeros"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los cajeros</SelectItem>
                  {cashiers.map((cashier) => (
                    <SelectItem key={cashier._id} value={cashier._id}>
                      {cashier.profile?.fullName || `${cashier.profile?.name} ${cashier.profile?.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadcnSelect>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label className="font-semibold text-muted-foreground text-sm">
              Cliente
            </Label>
            <Select
              isMulti
              options={clientOptions}
              value={selectedClients}
              onChange={(selected) => setSelectedClients(selected as any[])}
              placeholder="Selecciona cliente(s)"
              styles={customStyles}
              noOptionsMessage={() => "No hay clientes disponibles"}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-muted-foreground text-sm">
              Forma de Pago
            </Label>
            <Select
              isMulti
              options={paymentMethodOptions}
              value={selectedPaymentMethods}
              onChange={(selected) =>
                setSelectedPaymentMethods(selected as any[])
              }
              placeholder="Selecciona método(s)"
              styles={customStyles}
              noOptionsMessage={() => "No hay métodos disponibles"}
            />
          </div>

          <div className="col-span-full flex justify-end mt-3">
            <Button
              onClick={handleSearch}
              className="flex items-center gap-2 px-8 rounded-[10px] h-[48px] font-semibold"
            >
              <Search size={18} />
              Calcular
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinanceFilters;

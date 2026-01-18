"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, PackageSearch, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { expenseConceptsService } from "./services/expenseConcepts";
import { branchesService } from "../branches/services/branches";
import { ExpenseConcept } from "./types";
import ExpenseConceptActions from "./components/ExpenseConceptActions";
import ExpenseConceptModal from "./components/ExpenseConceptModal";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";

const DEPARTMENT_LABELS: Record<string, string> = {
  sales: "Ventas",
  administration: "Administración",
  operations: "Operaciones",
  marketing: "Marketing",
  finance: "Finanzas",
  human_resources: "Recursos Humanos",
  other: "Otro",
};

const ExpenseConceptsPage: React.FC = () => {
  const [concepts, setConcepts] = useState<ExpenseConcept[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [branchId, setBranchId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedConcept, setSelectedConcept] = useState<ExpenseConcept | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });
  const { user } = useUserSessionStore();
  const { activeBranch } = useActiveBranchStore();

  useEffect(() => {
    const determineBranchId = async () => {
      if (!user) return;

      const userRole = user.role?.name;

      if (userRole === "Administrador") {
        if (activeBranch) {
          setBranchId(activeBranch._id);
        }
      } else if (userRole === "Gerente") {
        try {
          const response = await branchesService.getAllBranches({ limit: 1000 });
          const managerBranch = response.data.find(
            (branch) => branch.manager === user._id
          );
          if (managerBranch) {
            setBranchId(managerBranch._id);
          }
        } catch (error: any) {
          console.error("Error fetching manager branch:", error);
          toast.error("Error al obtener la sucursal del gerente");
        }
      }
    };

    determineBranchId();
  }, [user, activeBranch]);

  const loadConcepts = async (isInitial: boolean, page: number = pagination.page) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: any = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (branchId) {
        filters.branch = branchId;
      }

      const response = await expenseConceptsService.getAllExpenseConcepts(filters);

      if (response.data) {
        setConcepts(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los conceptos");
      console.error("Error loading concepts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) {
      loadConcepts(true, 1);
    }
  }, [searchTerm, branchId]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadConcepts(true, page);
  };

  const handleNewConcept = () => {
    setSelectedConcept(null);
    setShowModal(true);
  };

  const handleEditConcept = (concept: ExpenseConcept) => {
    setSelectedConcept(concept);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedConcept(null);
  };

  const handleConceptUpdated = () => {
    loadConcepts(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Conceptos de Gastos"
        description="Gestiona los conceptos de gastos del sistema"
        action={{
          label: "Nuevo Concepto",
          icon: <Plus className="h-4 w-4" />,
          onClick: handleNewConcept,
        }}
      />

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground mt-3">Cargando conceptos...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {concepts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <PackageSearch className="h-12 w-12 opacity-50" />
                          <p>No se encontraron conceptos de gastos</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    concepts.map((concept, index) => (
                      <TableRow key={concept._id}>
                        <TableCell>
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">{concept.name}</TableCell>
                        <TableCell>
                          {concept.description || (
                            <span className="text-muted-foreground italic">Sin descripción</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-info text-info-foreground">
                            {DEPARTMENT_LABELS[concept.department] || concept.department}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{concept.branch.branchName}</div>
                            {concept.branch.branchCode && (
                              <p className="text-sm text-muted-foreground">
                                {concept.branch.branchCode}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={concept.isActive ? "default" : "destructive"}>
                            {concept.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ExpenseConceptActions
                            concept={concept}
                            onEdit={handleEditConcept}
                            onConceptUpdated={handleConceptUpdated}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {concepts.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                    {pagination.total} conceptos
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

      {/* Concept Modal */}
      <ExpenseConceptModal
        show={showModal}
        onHide={handleCloseModal}
        onSuccess={handleConceptUpdated}
        concept={selectedConcept}
      />
    </div>
  );
};

export default ExpenseConceptsPage;

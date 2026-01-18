"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { companiesService } from "./services/companies";
import { Company } from "./types";
import CompanyActions from "./components/CompanyActions";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";

const CompaniesPage: React.FC = () => {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadCompanies = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
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

      if (statusFilter) {
        filters.isActive = statusFilter === "true";
      }

      const response = await companiesService.getAllCompanies(filters);

      if (response.data) {
        setCompanies(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las empresas");
      console.error("Error loading companies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies(true, 1);
  }, [searchTerm, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value === "all" ? "" : value);
  };

  const handlePageChange = (page: number) => {
    loadCompanies(true, page);
  };

  const handleNewCompany = () => {
    router.push("/gestion/empresas/nueva");
  };

  const handleCompanyUpdated = () => {
    loadCompanies(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Empresas"
        description="Gestiona las empresas del sistema"
        action={{
          label: "Nueva Empresa",
          icon: <Plus className="h-4 w-4" />,
          onClick: handleNewCompany,
        }}
      />

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-0">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 p-4 border-b">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por razón social, RFC o nombre comercial..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter || "all"}
              onValueChange={handleStatusFilterChange}
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

          {/* Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground mt-3">Cargando empresas...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Razón Social</TableHead>
                    <TableHead>RFC</TableHead>
                    <TableHead>Nombre Comercial</TableHead>
                    <TableHead>Administrador</TableHead>
                    <TableHead>Usuarios Redes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <div>No se encontraron empresas</div>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((company, index) => (
                      <TableRow key={company._id}>
                        <TableCell>
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {company.legalName}
                        </TableCell>
                        <TableCell>{company.rfc}</TableCell>
                        <TableCell>{company.tradeName || "-"}</TableCell>
                        <TableCell>
                          {company.administrator ? (
                            <div>
                              <div className="font-semibold">
                                {company.administrator.profile.fullName}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {company.administrator.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Sin administrador
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {company.redes && company.redes.length > 0 ? (
                            <div className="space-y-1">
                              {company.redes.map((redesUser) => (
                                <div key={redesUser._id}>
                                  <div className="text-sm font-semibold">
                                    {redesUser.profile.fullName}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Sin usuarios redes
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={company.isActive ? "default" : "destructive"}>
                            {company.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <CompanyActions
                            company={company}
                            onCompanyUpdated={handleCompanyUpdated}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {companies.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                    de {pagination.total} empresas
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
    </div>
  );
};

export default CompaniesPage;

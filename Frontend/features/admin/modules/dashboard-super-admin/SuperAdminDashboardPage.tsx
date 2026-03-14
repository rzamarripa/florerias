"use client";

import React, { useEffect, useState } from "react";
import { Building2, Clock, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { superAdminDashboardService } from "./services/superAdminDashboard";
import { CompanySessionSummary } from "./types";
import CompanySessionDetailPage from "./CompanySessionDetailPage";

const SuperAdminDashboardPage: React.FC = () => {
  const [companies, setCompanies] = useState<CompanySessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] =
    useState<CompanySessionSummary | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await superAdminDashboardService.getCompaniesSummary();
      if (response.success) {
        setCompanies(response.data);
      }
    } catch (error) {
      console.error("Error al obtener empresas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedCompany) {
    return (
      <CompanySessionDetailPage
        companyId={selectedCompany._id}
        companyName={selectedCompany.tradeName || selectedCompany.legalName}
        onBack={() => setSelectedCompany(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Super Admin</h2>
        <p className="text-muted-foreground text-sm">
          Resumen de uso de sesiones por empresa
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No se encontraron empresas registradas
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Nombre Comercial</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock size={14} />
                    Horas de Sesión
                  </div>
                </TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2
                        size={18}
                        className="text-muted-foreground"
                      />
                      <span className="font-medium">{company.legalName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{company.tradeName || "—"}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold">
                      {company.totalSessionHours.toFixed(1)} hrs
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCompany(company)}
                    >
                      <Eye size={14} className="mr-1" />
                      Ver Dashboard
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboardPage;

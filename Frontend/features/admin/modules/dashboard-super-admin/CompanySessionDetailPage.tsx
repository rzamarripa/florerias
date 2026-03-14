"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { superAdminDashboardService } from "./services/superAdminDashboard";
import { BranchSessionStats } from "./types";
import BranchSessionCard from "./components/BranchSessionCard";
import BranchUsersModal from "./components/BranchUsersModal";

interface CompanySessionDetailPageProps {
  companyId: string;
  companyName: string;
  onBack: () => void;
}

const CompanySessionDetailPage: React.FC<CompanySessionDetailPageProps> = ({
  companyId,
  companyName,
  onBack,
}) => {
  const [branches, setBranches] = useState<BranchSessionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverCompanyName, setServerCompanyName] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<BranchSessionStats | null>(null);
  const [showUsersModal, setShowUsersModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response =
          await superAdminDashboardService.getCompanyBranchesStats(companyId);
        if (response.success) {
          setBranches(response.data.branches);
          setServerCompanyName(response.data.companyName);
        }
      } catch (error) {
        console.error("Error al obtener estadísticas de sucursales:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId]);

  const displayName = serverCompanyName || companyName;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{displayName}</h2>
          <p className="text-muted-foreground text-sm">
            Estadísticas de sesiones por sucursal
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No se encontraron sucursales para esta empresa
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <BranchSessionCard
              key={branch._id}
              branch={branch}
              onClick={() => {
                setSelectedBranch(branch);
                setShowUsersModal(true);
              }}
            />
          ))}
        </div>
      )}
      {selectedBranch && (
        <BranchUsersModal
          show={showUsersModal}
          onHide={() => {
            setShowUsersModal(false);
            setSelectedBranch(null);
          }}
          branchId={selectedBranch._id}
          branchName={selectedBranch.branchName}
        />
      )}
    </div>
  );
};

export default CompanySessionDetailPage;

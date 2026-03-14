"use client";

import React, { useEffect, useState } from "react";
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
import { User, Mail, Clock, Loader2, Shield } from "lucide-react";
import { BranchUserSession } from "../types";
import { superAdminDashboardService } from "../services/superAdminDashboard";

interface BranchUsersModalProps {
  show: boolean;
  onHide: () => void;
  branchId: string;
  branchName: string;
}

const BranchUsersModal: React.FC<BranchUsersModalProps> = ({
  show,
  onHide,
  branchId,
  branchName,
}) => {
  const [users, setUsers] = useState<BranchUserSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !branchId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const response =
          await superAdminDashboardService.getBranchUsersStats(branchId);
        if (response.success) {
          setUsers(response.data);
        }
      } catch (error) {
        console.error("Error al obtener usuarios de sucursal:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [show, branchId]);

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

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    return `${hours.toFixed(1)} hrs`;
  };

  return (
    <Dialog open={show} onOpenChange={onHide}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User size={20} />
            Usuarios de {branchName}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <User
                size={48}
                className="text-muted-foreground mb-3 mx-auto"
              />
              <p className="text-muted-foreground">
                No hay usuarios con sesiones en esta sucursal
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow style={{ borderBottom: "2px solid #dee2e6" }}>
                  <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                    Usuario
                  </TableHead>
                  <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                    Email
                  </TableHead>
                  <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                    Rol
                  </TableHead>
                  <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                    Tiempo de Uso
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div
                          className="rounded-full flex items-center justify-center text-white font-bold mr-3"
                          style={{
                            width: "40px",
                            height: "40px",
                            background: getAvatarColor(user.username),
                            fontSize: "14px",
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(user.username)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p
                            className="mb-0 font-semibold"
                            style={{ fontSize: "14px" }}
                          >
                            {user.username}
                          </p>
                          {user.isManager && (
                            <Shield size={14} className="text-blue-600" />
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex items-center">
                        <Mail
                          size={14}
                          className="mr-2 text-muted-foreground"
                        />
                        <span style={{ fontSize: "13px" }}>{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">
                      <Badge
                        variant={user.isManager ? "default" : "secondary"}
                        className="px-3 py-2"
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          borderRadius: "8px",
                        }}
                      >
                        {user.roleName}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex items-center">
                        <Clock
                          size={14}
                          className="mr-2 text-muted-foreground"
                        />
                        <span
                          className="font-semibold"
                          style={{ fontSize: "13px" }}
                        >
                          {formatHours(user.totalUsageHours)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <p
            className="text-muted-foreground mb-0 mr-auto"
            style={{ fontSize: "13px" }}
          >
            Total: {users.length} usuario{users.length !== 1 ? "s" : ""}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BranchUsersModal;

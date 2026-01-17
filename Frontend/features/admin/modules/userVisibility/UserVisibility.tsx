"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { usersService } from "../users/services/users";
import { User } from "../users/types";
import UserVisibilityTree from "./components/UserVisibilityTree";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserVisibilityProps {
  onUserChange?: (userId: string | null) => void;
}

const UserVisibility: React.FC<UserVisibilityProps> = ({ onUserChange }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersService.getAllUsers();

      if (!response.success) {
        toast.error(response.message || "Error desconocido");
        return;
      }

      setUsers(response.data || []);
    } catch (error: any) {
      toast.error(
        "Error al cargar los usuarios: " +
          (error.message || "Error desconocido")
      );
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (value: string) => {
    const userId = value === "none" ? "" : value;
    setSelectedUserId(userId);
    setKey((prev) => prev + 1);
    onUserChange?.(userId || null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Usuario</CardTitle>
          <CardDescription>
            Selecciona un usuario para configurar su visibilidad de acceso a
            razones sociales, marcas y sucursales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <div className="space-y-2">
              <Label htmlFor="user-select">Usuario</Label>
              <Select
                value={selectedUserId || "none"}
                onValueChange={handleUserChange}
                disabled={loading}
              >
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Selecciona un usuario..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecciona un usuario...</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.profile.fullName} ({user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedUserId && (
        <UserVisibilityTree
          key={`${selectedUserId}-${key}`}
          userId={selectedUserId}
        />
      )}
    </div>
  );
};

export default UserVisibility;

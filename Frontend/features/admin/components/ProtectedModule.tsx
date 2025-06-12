import { useUserModulesStore } from "@/stores";
import React from "react";

interface ProtectedModuleProps {
  module: string;
  page: string;
  children: React.ReactNode;
}

function ProtectedModule({ module, page, children }: ProtectedModuleProps) {
  const { hasModuleAccess } = useUserModulesStore();
  const hasPermission = hasModuleAccess(page, module);

  return hasPermission ? children : null;
}

export default ProtectedModule;

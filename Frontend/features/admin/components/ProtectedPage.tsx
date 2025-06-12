import { useUserModulesStore } from "@/stores";
import React from "react";

interface ProtectedPageProps {
  name: string;
  children: React.ReactNode;
}

function ProtectedPage({ name, children }: ProtectedPageProps) {
  const { hasPageAccess } = useUserModulesStore();
  const hasPermission = hasPageAccess(name);

  return (
    <div style={{ padding: "10px" }}>
      {hasPermission ? children : <h1>Not allowed</h1>}
    </div>
  );
}

export default ProtectedPage;

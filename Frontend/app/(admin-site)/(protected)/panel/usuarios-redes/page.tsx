import NetworksUsersPage from "@/features/admin/modules/networksUsers/NetworksUsersPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Usuarios de Redes | Corazón Violeta",
  description: "Gestión de usuarios del área de redes y marketing",
};

export default function Page() {
  return <NetworksUsersPage />;
}
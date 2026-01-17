import Image from "next/image";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { User } from "../types";

interface UserViewModalProps {
  user: User;
}

const UserViewModal: React.FC<UserViewModalProps> = ({ user }) => {
  const [show, setShow] = useState<boolean>(false);

  const handleShow = (): void => {
    setShow(true);
  };

  const handleClose = (): void => {
    setShow(false);
  };

  return (
    <>
      <button
        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-muted/80 transition-colors"
        title="Ver usuario"
        onClick={(e) => {
          e.preventDefault();
          handleShow();
        }}
        tabIndex={0}
      >
        <Eye className="w-4 h-4" />
      </button>

      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader className="border-b-0 pb-1">
            <DialogTitle className="text-lg font-semibold">
              Informacion del Usuario
            </DialogTitle>
          </DialogHeader>

          <div className="pt-1 pb-2">
            <div className="text-center mb-3">
              <div className="flex justify-center mb-2">
                {typeof user?.profile?.image === "string" ? (
                  <Image
                    src={user.profile.image}
                    alt={user.username}
                    className="rounded-full shadow-sm"
                    width={70}
                    height={70}
                    style={{
                      objectFit: "cover",
                      border: "3px solid #e5e7eb",
                    }}
                  />
                ) : (
                  <div
                    className="bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-sm"
                    style={{
                      width: "70px",
                      height: "70px",
                      fontSize: "1.8rem",
                      fontWeight: "bold",
                      border: "3px solid #e5e7eb",
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <h5 className="text-foreground mb-1 font-bold">{user.username}</h5>
              <p className="text-muted-foreground mb-2 text-sm">
                {user.profile.fullName ||
                  user.profile.name ||
                  "Sin nombre completo"}
              </p>

              <Badge
                className="px-2 py-1 text-xs mb-3 rounded-full"
              >
                {typeof user.role === 'object' ? user.role.name : user.role || "Sin rol"}
              </Badge>
            </div>

            <div className="space-y-2">
              <Card className="border-0 bg-muted/50">
                <CardContent className="py-2 px-3">
                  <div className="flex items-center">
                    <div className="mr-2">
                      <div
                        className={`${
                          user.profile.estatus ? "bg-green-500/10" : "bg-red-500/10"
                        } rounded-full flex items-center justify-center`}
                        style={{ width: "30px", height: "30px" }}
                      >
                        <span style={{ fontSize: "0.9rem" }}>
                          {user.profile.estatus ? "✓" : "✕"}
                        </span>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <p
                        className="text-muted-foreground mb-0"
                        style={{ fontSize: "0.7rem", fontWeight: "500" }}
                      >
                        ESTATUS
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded ${
                          user.profile.estatus
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                        style={{ fontSize: "0.7rem" }}
                      >
                        {user.profile.estatus ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-muted/50">
                <CardContent className="py-2 px-3">
                  <div className="flex items-center">
                    <div className="mr-2">
                      <div
                        className="bg-blue-500/10 rounded-full flex items-center justify-center"
                        style={{ width: "30px", height: "30px" }}
                      >
                        <span style={{ fontSize: "0.8rem" }}>📅</span>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <p
                        className="text-muted-foreground mb-0"
                        style={{ fontSize: "0.7rem", fontWeight: "500" }}
                      >
                        FECHA DE CREACION
                      </p>
                      <p
                        className="text-foreground mb-0 font-medium"
                        style={{ fontSize: "0.8rem" }}
                      >
                        {new Date(user.createdAt).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-muted/50">
                <CardContent className="py-2 px-3">
                  <div className="flex items-center">
                    <div className="mr-2">
                      <div
                        className="bg-gray-500/10 rounded-full flex items-center justify-center"
                        style={{ width: "30px", height: "30px" }}
                      >
                        <span style={{ fontSize: "0.8rem" }}>#</span>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <p
                        className="text-muted-foreground mb-0"
                        style={{ fontSize: "0.7rem", fontWeight: "500" }}
                      >
                        ID DE USUARIO
                      </p>
                      <code
                        className="bg-background text-muted-foreground px-2 py-1 rounded border text-xs"
                      >
                        {user._id}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter className="border-t-0 pt-1 pb-2">
            <Button
              type="button"
              variant="secondary"
              className="font-medium px-4"
              onClick={handleClose}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserViewModal;

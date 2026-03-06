"use client";

import { useMemo } from "react";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserModulesStore } from "@/stores/userModulesStore";
import {
  MENU_METADATA,
  CATEGORY_ORDER,
  getMenuMetadata,
} from "@/config/menuMapping";
import type { MenuMetadata } from "@/config/menuMapping";
import type { PageModules } from "@/types/auth";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Shield, User, Mail, Phone, Calendar, FileText } from "lucide-react";

interface GroupedPages {
  category: string;
  pages: (PageModules & { metadata: MenuMetadata | null })[];
}

export default function MiCuentaPage() {
  const { user } = useUserSessionStore();
  const { role, getIsSuperAdmin } = useUserRoleStore();
  const { allowedModules } = useUserModulesStore();

  const isSuperAdmin = getIsSuperAdmin();

  const groupedModules = useMemo(() => {
    if (!allowedModules.length) return [];

    const enriched = allowedModules.map((pm) => ({
      ...pm,
      metadata: getMenuMetadata(pm.path),
    }));

    const groups: Record<string, GroupedPages> = {};

    for (const item of enriched) {
      const category = item.metadata?.category || "Otros";
      if (!groups[category]) {
        groups[category] = { category, pages: [] };
      }
      groups[category].pages.push(item);
    }

    // Sort by category order, then pages by order within category
    const sorted = Object.values(groups).sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category);
      const bi = CATEGORY_ORDER.indexOf(b.category);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    for (const group of sorted) {
      group.pages.sort(
        (a, b) => (a.metadata?.order ?? 999) - (b.metadata?.order ?? 999)
      );
    }

    return sorted;
  }, [allowedModules]);

  const formattedDate = useMemo(() => {
    if (!user?.createdAt) return null;
    try {
      return new Date(user.createdAt).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return user.createdAt;
    }
  }, [user?.createdAt]);

  const initial = user?.profile?.fullName?.charAt(0)?.toUpperCase() ||
    user?.username?.charAt(0)?.toUpperCase() ||
    "?";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">Mi Cuenta</h1>

      {/* User info + Role */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Datos del usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                {user?.profile?.image && (
                  <AvatarImage src={user.profile.image} alt={user.profile.fullName} />
                )}
                <AvatarFallback className="text-lg">{initial}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">
                  {user?.profile?.fullName || user?.profile?.nombreCompleto || "-"}
                </p>
                <p className="text-muted-foreground text-sm">@{user?.username}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {user?.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4" />
                  <span>{user.email}</span>
                </div>
              )}
              {user?.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4" />
                  <span>{user.phone}</span>
                </div>
              )}
              {formattedDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>Registrado el {formattedDate}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5" />
              Rol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {user?.role?.name || role || "-"}
              </span>
              {isSuperAdmin && (
                <Badge variant="default">Acceso total</Badge>
              )}
            </div>
            {user?.role?.description && (
              <p className="text-muted-foreground text-sm">
                {user.role.description}
              </p>
            )}
            {isSuperAdmin && (
              <p className="text-muted-foreground text-sm">
                Como Super Admin tienes acceso a todas las páginas y módulos del sistema.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pages and permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Páginas y Permisos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isSuperAdmin && (
            <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <strong>Super Admin:</strong> Tienes acceso total a todas las páginas y
              módulos del sistema, independientemente de la configuración mostrada abajo.
            </div>
          )}

          {groupedModules.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No hay módulos asignados.
            </p>
          ) : (
            <Tabs defaultValue={groupedModules[0]?.category}>
              <TabsList className="flex-wrap h-auto gap-1">
                {groupedModules.map((group) => (
                  <TabsTrigger key={group.category} value={group.category} className="gap-1.5">
                    {group.category}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {group.pages.length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
              {groupedModules.map((group) => (
                <TabsContent key={group.category} value={group.category}>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.pages.map((page) => {
                      const Icon = page.metadata?.icon;
                      const label = page.metadata?.label || page.page;
                      return (
                        <div
                          key={page.pageId}
                          className="rounded-lg border p-3 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            {Icon && (
                              <Icon className="size-4 text-muted-foreground" />
                            )}
                            <span className="font-medium text-sm">{label}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {page.path}
                          </Badge>
                          <div className="flex flex-wrap gap-1">
                            {page.modules.map((mod) => (
                              <Badge
                                key={mod._id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {mod.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

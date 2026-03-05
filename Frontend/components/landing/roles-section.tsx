import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Eye } from "lucide-react"

const roles = [
  { name: "Super Admin", level: "N1", pages: 46, modules: 184, color: "bg-red-500" },
  { name: "Administrador", level: "N2", pages: 11, modules: 44, color: "bg-teal-500" },
  { name: "Gerente", level: "N3", pages: 35, modules: 132, color: "bg-indigo-500" },
  { name: "Redes", level: "N4", pages: 9, modules: 36, color: "bg-sky-500" },
  { name: "Distribuidor", level: "N4", pages: 8, modules: 32, color: "bg-cyan-500" },
  { name: "Cajero", level: "N5", pages: 6, modules: 24, color: "bg-emerald-500" },
  { name: "Repartidor", level: "N6", pages: 4, modules: 16, color: "bg-blue-500" },
  { name: "Produccion", level: "N6", pages: 4, modules: 16, color: "bg-fuchsia-500" },
  { name: "Usuario", level: "N7", pages: 5, modules: 5, color: "bg-gray-400" },
]

export function RolesSection() {
  return (
    <section id="roles" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col lg:flex-row items-start gap-16">
          {/* Left content */}
          <div className="flex-1 max-w-lg lg:sticky lg:top-32">
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 text-xs font-medium border-primary/20 text-primary bg-primary/5"
            >
              Roles y Permisos
            </Badge>
            <h2
              className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground text-balance"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Control total con permisos por rol
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              9 niveles jerarquicos con acceso configurable. Cada rol tiene paginas y modulos especificos asignados automaticamente.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <Shield className="size-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Jerarquia inteligente</p>
                  <p className="text-xs text-muted-foreground">Del Super Admin al Usuario, cada nivel hereda permisos del superior de forma controlada.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <Lock className="size-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Acceso granular</p>
                  <p className="text-xs text-muted-foreground">Configura exactamente que puede ver y hacer cada miembro de tu equipo.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <Eye className="size-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Visibilidad controlada</p>
                  <p className="text-xs text-muted-foreground">Usuarios con rol de solo lectura para acceso de consulta sin riesgos.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Roles table + screenshot */}
          <div className="flex-1 w-full">
            <div className="relative">
              <div className="absolute -inset-2 bg-primary/5 rounded-2xl blur-xl" />
              <div className="relative rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/50">
                  <div className="size-2.5 rounded-full bg-destructive/40" />
                  <div className="size-2.5 rounded-full bg-chart-4/60" />
                  <div className="size-2.5 rounded-full bg-accent/60" />
                  <span className="ml-2 text-xs text-muted-foreground">Tabla de Accesos por Rol</span>
                </div>
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-PfWQN1sUsYlCH4sxF9HXlnof0clkSJ.png"
                  alt="Tabla de accesos por rol mostrando paginas y modulos por nivel jerarquico"
                  className="w-full"
                />
              </div>
            </div>

            {/* Staff card */}
            <div className="mt-6 relative">
              <div className="relative rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/50">
                  <div className="size-2.5 rounded-full bg-destructive/40" />
                  <div className="size-2.5 rounded-full bg-chart-4/60" />
                  <div className="size-2.5 rounded-full bg-accent/60" />
                  <span className="ml-2 text-xs text-muted-foreground">Personal de Sucursal</span>
                </div>
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-NBKwdxswvGvNuovQ6cq2TWCweZj6CP.png"
                  alt="Vista del personal de sucursal con gerente y empleados"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

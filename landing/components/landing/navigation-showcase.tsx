import { Badge } from "@/components/ui/badge"

export function NavigationShowcase() {
  return (
    <section className="py-24 lg:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 max-w-lg">
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 text-xs font-medium border-primary/20 text-primary bg-primary/5"
            >
              Interfaz Intuitiva
            </Badge>
            <h3
              className="text-2xl lg:text-4xl font-bold tracking-tight text-foreground text-balance"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Navegacion clara y organizada por modulos
            </h3>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Accede facilmente a cada area de tu negocio: operaciones, produccion, finanzas, clientes, personal, catalogos y e-commerce. Con cambio de tema claro y oscuro.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { label: "Operaciones", desc: "Ventas y ordenes" },
                { label: "Produccion", desc: "Flujo kanban" },
                { label: "Finanzas", desc: "Reportes y metricas" },
                { label: "Catalogos", desc: "Productos y precios" },
                { label: "Personal", desc: "Equipo y roles" },
                { label: "E-commerce", desc: "Tienda online" },
              ].map((mod) => (
                <div
                  key={mod.label}
                  className="flex flex-col p-3 rounded-lg bg-card border border-border"
                >
                  <span className="text-sm font-semibold text-foreground">
                    {mod.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {mod.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 rounded-2xl blur-xl" />
              <div className="relative rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-lKxNmmOPuiMGZLNXPjFWRFPaUZSSKB.png"
                  alt="Menu de navegacion lateral de Zolt mostrando los modulos principales del sistema"
                  className="w-full max-w-[280px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

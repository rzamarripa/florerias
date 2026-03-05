import { Badge } from "@/components/ui/badge"

const showcases = [
  {
    badge: "Ventas",
    title: "Controla cada orden de principio a fin",
    description:
      "Visualiza todas tus ventas con folios, clientes, canales, metodos de pago y estados en tiempo real. Metricas de rendimiento al instante.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-MG89VEupwdvgQXcGaLTCwNXvUzjCov.png",
    alt: "Vista de ventas de sucursal con metricas y tabla de ordenes",
    reverse: false,
  },
  {
    badge: "Produccion",
    title: "Pizarron Kanban para gestionar la produccion",
    description:
      "Organiza tus ordenes en etapas visuales: inicial, en proceso y finalizado. Arrastra y gestiona cada orden con detalle completo del cliente, productos y montos.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Gxz08JlKCeOncgkh8EuIdL4BSETTJR.png",
    alt: "Pizarron de produccion con columnas kanban mostrando ordenes en diferentes etapas",
    reverse: true,
  },
  {
    badge: "Inventario",
    title: "Stock en tiempo real por sucursal",
    description:
      "Gestiona productos y materiales con cantidades exactas, unidades y fechas de ultimo movimiento. Control total del almacen de cada sucursal.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-WfF8u8YkNA1GLfkwDBns4OCoUJ0OA1.png",
    alt: "Vista de inventario de sucursal con productos y materiales",
    reverse: false,
  },
]

export function FeatureShowcase() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-24 lg:gap-32">
          {showcases.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col gap-12 lg:gap-16 items-center ${
                item.reverse ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              <div className="flex-1 max-w-lg">
                <Badge
                  variant="outline"
                  className="mb-4 px-3 py-1 text-xs font-medium border-primary/20 text-primary bg-primary/5"
                >
                  {item.badge}
                </Badge>
                <h3
                  className="text-2xl lg:text-4xl font-bold tracking-tight text-foreground text-balance"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.title}
                </h3>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="flex-1 w-full">
                <div className="relative">
                  <div className="absolute -inset-2 bg-primary/5 rounded-2xl blur-xl" />
                  <div className="relative rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/50">
                      <div className="size-2.5 rounded-full bg-destructive/40" />
                      <div className="size-2.5 rounded-full bg-chart-4/60" />
                      <div className="size-2.5 rounded-full bg-accent/60" />
                    </div>
                    <img
                      src={item.image}
                      alt={item.alt}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  BarChart3,
  Package,
  Users,
  Store,
  Layers,
} from "lucide-react"

const features = [
  {
    icon: ShoppingCart,
    title: "Gestion de Ventas",
    description:
      "Registra y gestiona ordenes en todas sus etapas: creacion, produccion, envio, entrega y pagos. Control total del flujo de venta.",
  },
  {
    icon: BarChart3,
    title: "Finanzas y Reportes",
    description:
      "Dashboards con metricas en tiempo real: ventas totales, ticket promedio, utilidad, gastos y desglose por metodo de pago.",
  },
  {
    icon: Package,
    title: "Inventario Inteligente",
    description:
      "Gestiona productos, materia prima y stock en almacenes por sucursal. Control de unidades, ingresos y egresos automaticos.",
  },
  {
    icon: Users,
    title: "Gestion de Personal",
    description:
      "Administra gerentes, cajeros, repartidores y produccion con roles y permisos configurables por nivel jerarquico.",
  },
  {
    icon: Store,
    title: "E-commerce Integrado",
    description:
      "Crea tiendas online conectadas directamente con tu sucursal. Inventario sincronizado y completamente personalizable.",
  },
  {
    icon: Layers,
    title: "Multi-Sucursal",
    description:
      "Opera multiples sucursales desde una sola cuenta. Cada una con su propio equipo, inventario y configuracion independiente.",
  },
]

export function FeaturesGrid() {
  return (
    <section id="funciones" className="py-24 lg:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge
            variant="outline"
            className="mb-4 px-3 py-1 text-xs font-medium border-primary/20 text-primary bg-primary/5"
          >
            Funciones
          </Badge>
          <h2
            className="text-3xl lg:text-5xl font-bold tracking-tight text-foreground text-balance"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Todo lo que necesitas para operar tu negocio
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Desde la primera venta hasta la expansion a multiples sucursales, Zolt cubre cada aspecto de la operacion de tu empresa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-xl bg-card border border-border hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="size-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

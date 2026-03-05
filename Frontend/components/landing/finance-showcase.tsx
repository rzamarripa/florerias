import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, CreditCard, BarChart3 } from "lucide-react"

const financeFeatures = [
  {
    icon: DollarSign,
    title: "Totales por categoria",
    description: "Visualiza ingresos desglosados por floreria, eventos, gastos y compras en tiempo real.",
  },
  {
    icon: TrendingUp,
    title: "Utilidad total",
    description: "Calculo automatico de utilidad neta: ingresos menos gastos y compras al instante.",
  },
  {
    icon: CreditCard,
    title: "Metodos de pago",
    description: "Desglose de ingresos por tarjeta, efectivo y transferencia en un solo panel.",
  },
  {
    icon: BarChart3,
    title: "Reportes detallados",
    description: "Pagos realizados, ventas con descuento, compras y gastos organizados por pestanas.",
  },
]

export function FinanceShowcase() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text content */}
          <div className="flex-1 max-w-xl">
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 text-xs font-medium border-primary/20 text-primary bg-primary/5"
            >
              Finanzas y Reportes
            </Badge>
            <h2
              className="text-2xl lg:text-4xl font-bold tracking-tight text-foreground text-balance"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              El pulso financiero de tu negocio en una sola vista
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Monitorea la salud financiera de cada sucursal con dashboards en tiempo real.
              Desde ingresos y gastos hasta la utilidad neta, todo desglosado por metodo de
              pago y categorias para que tomes decisiones informadas al instante.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {financeFeatures.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="size-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard image - smaller */}
          <div className="flex-1 w-full max-w-lg">
            <div className="relative">
              <div className="absolute -inset-2 bg-primary/5 rounded-2xl blur-xl" />
              <div className="relative rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/50">
                  <div className="size-2.5 rounded-full bg-destructive/40" />
                  <div className="size-2.5 rounded-full bg-chart-4/60" />
                  <div className="size-2.5 rounded-full bg-accent/60" />
                  <span className="ml-2 text-xs text-muted-foreground">Dashboard Financiero - Zolt</span>
                </div>
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-bVxpOExjKnazJ0PWgtqMbEnEpCBQDO.png"
                  alt="Dashboard financiero de Zolt mostrando totales de ventas, gastos, utilidad e ingresos por metodo de pago"
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

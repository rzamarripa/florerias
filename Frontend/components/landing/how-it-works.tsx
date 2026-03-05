import { Badge } from "@/components/ui/badge"

const steps = [
  {
    step: "01",
    title: "Crea tu Empresa",
    description:
      "Registra tu empresa y automaticamente se crea tu usuario Administrador con control total del sistema.",
  },
  {
    step: "02",
    title: "Configura Sucursales",
    description:
      "Agrega sucursales con su propio gerente. Cada una opera de forma independiente con su inventario y equipo.",
  },
  {
    step: "03",
    title: "Registra tu Equipo",
    description:
      "El gerente registra cajeros, repartidores, produccion y demas roles con permisos automaticos por nivel.",
  },
  {
    step: "04",
    title: "Opera y Crece",
    description:
      "Gestiona ventas, inventario, produccion y hasta lanza tu e-commerce. Todo conectado y en tiempo real.",
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 lg:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge
            variant="outline"
            className="mb-4 px-3 py-1 text-xs font-medium border-primary/20 text-primary bg-primary/5"
          >
            Como Funciona
          </Badge>
          <h2
            className="text-3xl lg:text-5xl font-bold tracking-tight text-foreground text-balance"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            De cero a operar en 4 pasos
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Configura la estructura completa de tu negocio de forma rapida y organizada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => (
            <div key={index} className="relative group">
              <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full">
                <div
                  className="text-4xl font-bold text-primary/15 mb-4"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import { Badge } from "@/components/ui/badge"

const stats = [
  { value: "46+", label: "Paginas del sistema" },
  { value: "184+", label: "Modulos configurables" },
  { value: "9", label: "Roles de usuario" },
  { value: "7", label: "Niveles jerarquicos" },
]

export function StatsSection() {
  return (
    <section className="py-20 border-y border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-4xl lg:text-5xl font-bold text-primary"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {stat.value}
              </div>
              <p className="mt-2 text-sm text-muted-foreground font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

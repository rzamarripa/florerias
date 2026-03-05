import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Play } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <Badge
            variant="outline"
            className="mb-6 px-4 py-1.5 text-sm font-medium border-primary/20 text-primary bg-primary/5"
          >
            by Masoft - Desde 2014
          </Badge>

          <h1
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-balance leading-[1.1] text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Gestiona tu negocio{" "}
            <span className="text-primary">completo</span> desde una sola plataforma
          </h1>

          <p className="mt-6 text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed text-pretty">
            Ventas, inventario, produccion, e-commerce, lealtad y control total de
            sucursales. Todo lo que necesitas para hacer crecer tu empresa, en un solo lugar.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base font-semibold"
            >
              Comenzar Gratis
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base font-medium border-border text-foreground hover:bg-secondary"
            >
              <Play className="mr-2 size-4" />
              Ver Demo
            </Button>
          </div>

          <div className="mt-12 flex items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircleIcon />
              <span>Sin tarjeta de credito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon />
              <span>Configuracion en minutos</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <CheckCircleIcon />
              <span>Soporte 24/7</span>
            </div>
          </div>
        </div>


      </div>
    </section>
  )
}

function CheckCircleIcon() {
  return (
    <svg className="size-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

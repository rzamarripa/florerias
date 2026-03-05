import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section id="contacto" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-2xl bg-foreground text-background">
          <div className="absolute inset-0 -z-0">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-8 py-16 lg:py-24">
            <h2
              className="text-3xl lg:text-5xl font-bold tracking-tight text-balance"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Lleva tu negocio al siguiente nivel
            </h2>
            <p className="mt-4 text-lg text-background/70 max-w-2xl leading-relaxed">
              Unete a los negocios que ya gestionan sus operaciones con Zolt. Comienza gratis y escala al ritmo de tu empresa.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base font-semibold"
              >
                Comenzar Ahora
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base font-medium border-background/20 text-background bg-transparent hover:bg-background/10 hover:text-background"
              >
                Contactar Ventas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

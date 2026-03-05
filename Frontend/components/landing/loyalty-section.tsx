import { Badge } from "@/components/ui/badge"
import { Gift, CreditCard, Star, Smartphone } from "lucide-react"

export function LoyaltySection() {
  return (
    <section id="lealtad" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
          {/* Content */}
          <div className="flex-1 max-w-lg">
            <Badge
              variant="outline"
              className="mb-4 px-3 py-1 text-xs font-medium border-primary/20 text-primary bg-primary/5"
            >
              Lealtad y Recompensas
            </Badge>
            <h2
              className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground text-balance"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Fideliza a tus clientes con puntos y recompensas
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Sistema de puntos completamente configurable. Define acciones que acumulan puntos, crea recompensas canjeables y gestiona tarjetas de lealtad compatibles con Google y Apple Wallet.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <Star className="size-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Acumulacion</p>
                  <p className="text-xs text-muted-foreground">Por compra, primera visita, registro y mas</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <Gift className="size-5 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Recompensas</p>
                  <p className="text-xs text-muted-foreground">Descuentos y productos como premio</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <CreditCard className="size-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Tarjeta Digital</p>
                  <p className="text-xs text-muted-foreground">Compatible con wallets digitales</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <Smartphone className="size-5 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Apple & Google</p>
                  <p className="text-xs text-muted-foreground">Guarda en wallet del telefono</p>
                </div>
              </div>
            </div>
          </div>

          {/* Screenshot */}
          <div className="flex-1 w-full">
            <div className="relative">
              <div className="absolute -inset-2 bg-primary/5 rounded-2xl blur-xl" />
              <div className="relative rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/50">
                  <div className="size-2.5 rounded-full bg-destructive/40" />
                  <div className="size-2.5 rounded-full bg-chart-4/60" />
                  <div className="size-2.5 rounded-full bg-accent/60" />
                  <span className="ml-2 text-xs text-muted-foreground">Configuracion de Puntos</span>
                </div>
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-oUXbUO5JpcoH1x2YyZBcgcan51Mz4u.png"
                  alt="Panel de configuracion de puntos y recompensas mostrando reglas de acumulacion y recompensas canjeables"
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

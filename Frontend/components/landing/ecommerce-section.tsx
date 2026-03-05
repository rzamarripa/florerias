import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Globe, Palette, ShoppingBag, ArrowRight } from "lucide-react"

export function EcommerceSection() {
  return (
    <section id="ecommerce" className="py-24 lg:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge
            variant="outline"
            className="mb-4 px-3 py-1 text-xs font-medium border-primary/20 text-primary bg-primary/5"
          >
            E-commerce
          </Badge>
          <h2
            className="text-3xl lg:text-5xl font-bold tracking-tight text-foreground text-balance"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Tu tienda online, conectada con tu negocio
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Crea e-commerce personalizados para cada sucursal. Inventario sincronizado, diseno configurable y experiencia de compra profesional para tus clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="flex flex-col items-center text-center p-8 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-center size-14 rounded-xl bg-primary/10 text-primary mb-4">
              <Palette className="size-7" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Totalmente Personalizable</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              El gerente decide la estructura, secciones y diseno del e-commerce. Adaptalo a la identidad de tu marca.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-8 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-center size-14 rounded-xl bg-accent/10 text-accent mb-4">
              <ShoppingBag className="size-7" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Inventario Sincronizado</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Stock conectado directamente con el almacen de la sucursal. Ventas online y fisicas comparten inventario.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-8 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-center size-14 rounded-xl bg-primary/10 text-primary mb-4">
              <Globe className="size-7" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Compra Autonoma</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tus clientes pueden realizar compras por si solos, conectadas directamente con la logica de negocio.
            </p>
          </div>
        </div>

        {/* Login preview */}
        <div className="relative max-w-4xl mx-auto">
          <div className="absolute -inset-4 bg-primary/5 rounded-2xl blur-2xl" />
          <div className="relative rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/50">
              <div className="size-2.5 rounded-full bg-destructive/40" />
              <div className="size-2.5 rounded-full bg-chart-4/60" />
              <div className="size-2.5 rounded-full bg-accent/60" />
              <span className="ml-2 text-xs text-muted-foreground">Portal de Acceso - Zolt</span>
            </div>
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JWpSBcPrvn4iT8flIaUfgfdw3btWLu.png"
              alt="Pagina de inicio de sesion de Zolt con formulario de login y foto de floreria"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

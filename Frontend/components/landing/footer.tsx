import { Separator } from "@/components/ui/separator"

const footerLinks: Record<string, { label: string; href: string }[]> = {
  Producto: [
    { label: "Funciones", href: "#" },
    { label: "E-commerce", href: "#" },
    { label: "Lealtad", href: "#" },
    { label: "Precios", href: "#" },
    { label: "Integraciones", href: "#" },
  ],
  Empresa: [
    { label: "Sobre Nosotros", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Carreras", href: "#" },
    { label: "Contacto", href: "#" },
  ],
  Soporte: [
    { label: "Centro de Ayuda", href: "#" },
    { label: "Documentacion", href: "#" },
    { label: "Estado del Servicio", href: "#" },
    { label: "API", href: "#" },
  ],
  Legal: [
    { label: "Privacidad", href: "/politicas-privacidad" },
    { label: "Terminos", href: "/terminos-condiciones" },
    { label: "Eliminacion de datos", href: "/eliminacion-datos" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <ZoltLogoSmall />
              <span
                className="text-lg font-bold text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Zolt
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sistema integral de gestion empresarial por Masoft.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{category}</h4>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; 2014 - 2026 Zolt &mdash; by Masoft. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Twitter
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              LinkedIn
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function ZoltLogoSmall() {
  return (
    <svg width="24" height="24" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8C32 8 26 20 26 32C26 44 32 56 32 56" stroke="oklch(0.55 0.16 45)" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 8C32 8 38 20 38 32C38 44 32 56 32 56" stroke="oklch(0.65 0.13 145)" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 16C24 16 28 12 32 8C36 12 40 16 40 16" stroke="oklch(0.55 0.16 45)" strokeWidth="3" strokeLinecap="round" fill="oklch(0.55 0.16 45 / 0.15)" />
      <path d="M20 24C20 24 26 18 32 12C38 18 44 24 44 24" stroke="oklch(0.65 0.13 145)" strokeWidth="2.5" strokeLinecap="round" fill="oklch(0.65 0.13 145 / 0.1)" />
    </svg>
  )
}

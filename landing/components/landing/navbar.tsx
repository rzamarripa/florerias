"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

const navLinks = [
  { label: "Funciones", href: "#funciones" },
  { label: "Roles", href: "#roles" },
  { label: "E-commerce", href: "#ecommerce" },
  { label: "Lealtad", href: "#lealtad" },
  { label: "Contacto", href: "#contacto" },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <nav className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2">
          <ZoltLogo />
          <span className="text-xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Zolt
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Iniciar Sesion
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Comenzar Gratis
          </Button>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full justify-center text-muted-foreground">
                Iniciar Sesion
              </Button>
              <Button size="sm" className="w-full bg-primary text-primary-foreground">
                Comenzar Gratis
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function ZoltLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8C32 8 26 20 26 32C26 44 32 56 32 56" stroke="oklch(0.55 0.16 45)" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 8C32 8 38 20 38 32C38 44 32 56 32 56" stroke="oklch(0.65 0.13 145)" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 16C24 16 28 12 32 8C36 12 40 16 40 16" stroke="oklch(0.55 0.16 45)" strokeWidth="3" strokeLinecap="round" fill="oklch(0.55 0.16 45 / 0.15)" />
      <path d="M20 24C20 24 26 18 32 12C38 18 44 24 44 24" stroke="oklch(0.65 0.13 145)" strokeWidth="2.5" strokeLinecap="round" fill="oklch(0.65 0.13 145 / 0.1)" />
    </svg>
  )
}

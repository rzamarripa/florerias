import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { StatsSection } from "@/components/landing/stats-section"
import { FinanceShowcase } from "@/components/landing/finance-showcase"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { FeatureShowcase } from "@/components/landing/feature-showcase"
import { NavigationShowcase } from "@/components/landing/navigation-showcase"
import { RolesSection } from "@/components/landing/roles-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { EcommerceSection } from "@/components/landing/ecommerce-section"
import { LoyaltySection } from "@/components/landing/loyalty-section"
import { CtaSection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FinanceShowcase />
      <FeaturesGrid />
      <FeatureShowcase />
      <NavigationShowcase />
      <RolesSection />
      <HowItWorks />
      <EcommerceSection />
      <LoyaltySection />
      <CtaSection />
      <Footer />
    </main>
  )
}

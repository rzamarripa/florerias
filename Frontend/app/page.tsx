"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserSessionStore } from "@/stores";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserModulesStore } from "@/stores/userModulesStore";
import { getFirstAvailableRoute } from "@/utils/menuBuilder";

import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsSection } from "@/components/landing/stats-section";
import { FinanceShowcase } from "@/components/landing/finance-showcase";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { FeatureShowcase } from "@/components/landing/feature-showcase";
import { NavigationShowcase } from "@/components/landing/navigation-showcase";
import { RolesSection } from "@/components/landing/roles-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { EcommerceSection } from "@/components/landing/ecommerce-section";
import { LoyaltySection } from "@/components/landing/loyalty-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Page() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUserSessionStore();
  const { getIsSuperAdmin, role } = useUserRoleStore();
  const { allowedModules } = useUserModulesStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const isSuperAdmin = getIsSuperAdmin();
      const roleLower = role?.toLowerCase();

      let redirectRoute: string;

      if (isSuperAdmin || roleLower === "super admin" || roleLower === "superadmin") {
        redirectRoute = "/gestion/roles";
      } else if (roleLower === "distribuidor") {
        redirectRoute = "/gestion/empresas";
      } else if (roleLower === "gerente") {
        const hasVentasAccess = allowedModules.some(
          (module) =>
            module.path === "/sucursal/ventas" &&
            module.modules.some((m) => m.name.toLowerCase() === "ver")
        );
        redirectRoute = hasVentasAccess
          ? "/sucursal/ventas"
          : getFirstAvailableRoute(allowedModules, false, role);
      } else if (roleLower === "cajero" || roleLower === "redes") {
        const hasVentasAccess = allowedModules.some(
          (module) =>
            module.path === "/sucursal/ventas" &&
            module.modules.some((m) => m.name.toLowerCase() === "ver")
        );
        redirectRoute = hasVentasAccess
          ? "/sucursal/ventas"
          : getFirstAvailableRoute(allowedModules, false, role);
      } else {
        redirectRoute = getFirstAvailableRoute(allowedModules, false, role);
      }

      router.push(redirectRoute);
    }
  }, [isAuthenticated, isLoading, router, getIsSuperAdmin, allowedModules, role]);

  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <div className="landing-scope">
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
    </div>
  );
}

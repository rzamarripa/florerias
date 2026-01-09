"use client";

import { ReactNode, Fragment } from "react";
import Topbar from "@/components/layout/topbar";
import EcommerceSidenav from "./components/EcommerceSidenav";
import { LayoutProvider } from "@/context/useLayoutContext";

interface EcommerceLayoutProps {
  children: ReactNode;
}

export default function EcommerceLayout({ children }: EcommerceLayoutProps) {
  return (
    <LayoutProvider>
      <Fragment>
        <div className="wrapper">
          <Topbar />
          <EcommerceSidenav />
          <div className="content-page">
            {children}
          </div>
        </div>
      </Fragment>
    </LayoutProvider>
  );
}
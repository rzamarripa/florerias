import type { Metadata } from "next";
import { Open_Sans, Roboto } from "next/font/google";
import AppWrapper from "@/components/layout/AppWrapper";
import "bootstrap/dist/css/bootstrap.min.css";
import "jstree/dist/themes/default/style.min.css";
import "@/assets/scss/app.scss";
import "flatpickr/dist/flatpickr.css";
import "jsvectormap/dist/css/jsvectormap.min.css";
import "simplebar-react/dist/simplebar.min.css";

import favicon from "@/assets/images/favicon.ico";
import { appDescription, appTitle } from "@/helpers";
import { ChildrenType } from "@/types";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-opensans",
});

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Caprepa",
  description: "Sistema de Control de Egresos",
  icons: [favicon.src],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-skin="modern"
      data-bs-theme="light"
      data-menu-color="dark"
      data-topbar-color="light"
      data-layout-position="fixed"
      data-sidenav-size="default"
      data-sidenav-user="true"
    >
      <head></head>
      <body>
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}

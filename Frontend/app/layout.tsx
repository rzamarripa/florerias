import type { Metadata } from "next";
import AppWrapper from "@/components/layout/AppWrapper";
import "bootstrap/dist/css/bootstrap.min.css";
import "jstree/dist/themes/default/style.min.css";
import "@/assets/scss/app.scss";
import "flatpickr/dist/flatpickr.css";
import "jsvectormap/dist/css/jsvectormap.min.css";
import "simplebar-react/dist/simplebar.min.css";

export const metadata: Metadata = {
  title: "FloriSoft",
  description: "Sistema para Florerías",
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
      data-menu-color="light"
      data-topbar-color="light"
      data-layout-position="fixed"
      data-sidenav-size="default"
      data-sidenav-user="true"
    >
      <head>
        <link rel="stylesheet" href="/custom-sidebar.css" />
      </head>
      <body>
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}

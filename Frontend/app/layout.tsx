import type { Metadata } from "next";
import AppWrapper from "@/components/layout/AppWrapper";
import "bootstrap/dist/css/bootstrap.min.css";
import "jstree/dist/themes/default/style.min.css";
import "@/assets/scss/app.scss";
import "flatpickr/dist/flatpickr.css";
import "jsvectormap/dist/css/jsvectormap.min.css";
import "simplebar-react/dist/simplebar.min.css";
import "@/assets/scss/custom-sidebar.scss";

export const metadata: Metadata = {
  title: "FloriSoft",
  description: "Sistema para Florerías",
  icons: {
    icon: "/favicon-simple.svg",
    shortcut: "/favicon-simple.svg",
    apple: "/favicon-simple.svg",
  },
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
      data-menu-color="blue-dark"
      data-topbar-color="light"
      data-layout-position="fixed"
      data-sidenav-size="default"
      data-sidenav-user="true"
    >
      <head>
        <link rel="icon" href="/favicon-simple.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon-simple.svg" />
      </head>
      <body>
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}

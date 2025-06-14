import type { Metadata } from "next";

import AppWrapper from "@/components/layout/AppWrapper";

import favicon from "@/assets/images/favicon.ico";
import { appDescription, appTitle } from "@/helpers";
import { ChildrenType } from "@/types";

import "@/assets/scss/app.scss";
import "flatpickr/dist/flatpickr.css";
import "jsvectormap/dist/css/jsvectormap.min.css";
import "simplebar-react/dist/simplebar.min.css";

import { Open_Sans, Roboto } from "next/font/google";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-open-sans",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: appTitle,
  description: appDescription,
  icons: [favicon.src],
};

const RootLayout = ({ children }: ChildrenType) => {
  return (
    <html lang="es" className={`${roboto.variable} ${openSans.variable}`}>
      <body>
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
};

export default RootLayout;

"use client";

import { ChildrenType } from "@/types";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { PermissionProvider } from "@/components/providers/PermissionProvider";
import { LayoutProvider } from "@/context/useLayoutContext";
import { CommandPalette } from "@/components/CommandPalette";

const AppWrapper = ({ children }: ChildrenType) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <LayoutProvider>
        <PermissionProvider>
          <div>
            {children}
            <Toaster position="top-right" richColors />
            <CommandPalette />
          </div>
        </PermissionProvider>
      </LayoutProvider>
    </ThemeProvider>
  );
};

export default AppWrapper;

"use client";

import { ChildrenType } from "@/types";
import { Toaster } from "@/components/ui/sonner";
import { PermissionProvider } from "@/components/providers/PermissionProvider";
import { LayoutProvider } from "@/context/useLayoutContext";

const AppWrapper = ({ children }: ChildrenType) => {
  return (
    <LayoutProvider>
      <PermissionProvider>
        <div>
          {children}
          <Toaster position="top-right" richColors />
        </div>
      </PermissionProvider>
    </LayoutProvider>
  );
};

export default AppWrapper;

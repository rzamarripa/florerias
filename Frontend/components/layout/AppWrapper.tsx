"use client";

import { ChildrenType } from "@/types";
import { ToastContainer } from "react-toastify";
import { PermissionProvider } from "@/components/providers/PermissionProvider";

const AppWrapper = ({ children }: ChildrenType) => {
  return (
    <PermissionProvider>
      <div>
        {children}
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar
          closeOnClick
          pauseOnFocusLoss
          pauseOnHover
        />
      </div>
    </PermissionProvider>
  );
};

export default AppWrapper;

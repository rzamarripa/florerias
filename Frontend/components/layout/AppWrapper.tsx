"use client";
import { LayoutProvider } from "@/context/useLayoutContext";
import { ChildrenType } from "@/types";
import { ToastContainer } from "react-toastify";

const AppWrapper = ({ children }: ChildrenType) => {
  return (
    <LayoutProvider>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar
        closeOnClick
        pauseOnFocusLoss
        pauseOnHover
      />
    </LayoutProvider>
  );
};

export default AppWrapper;

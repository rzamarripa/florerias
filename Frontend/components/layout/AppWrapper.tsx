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
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </LayoutProvider>
  );
};

export default AppWrapper;

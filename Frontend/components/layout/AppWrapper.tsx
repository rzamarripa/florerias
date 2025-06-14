"use client";

import { ChildrenType } from "@/types";
import { ToastContainer } from "react-toastify";

const AppWrapper = ({ children }: ChildrenType) => {
  return (
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
  );
};

export default AppWrapper;

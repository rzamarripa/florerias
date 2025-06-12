"use client";

import React, { Fragment } from "react";
import { useLayoutContext } from "../context/useLayoutContext";
import HorizontalLayout from "./HorizontalLayout";
import VerticalLayout from "./VerticalLayout";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { orientation } = useLayoutContext();

  return (
    <Fragment>
      {orientation === "vertical" && (
        <VerticalLayout>{children}</VerticalLayout>
      )}
      {orientation === "horizontal" && (
        <HorizontalLayout>{children}</HorizontalLayout>
      )}
    </Fragment>
  );
};

export default MainLayout;

"use client";

import React, { Fragment } from "react";
import Sidenav from "../../layouts/components/sidenav";
import Topbar from "../../layouts/components/topbar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Fragment>
      <div className="wrapper">
        <Topbar />
        <Sidenav />
        <div className="content-page">{children}</div>
      </div>
    </Fragment>
  );
};

export default MainLayout;

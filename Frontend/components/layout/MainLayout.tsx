"use client";

import React, { Fragment } from "react";
import Sidenav from "./sidenav";
import Topbar from "./topbar";
import { ChatFloatingButton } from "@/components/common/chat";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Fragment>
      <div className="wrapper">
        <Topbar />
        <Sidenav />
        <div className="content-page">{children}</div>
        <ChatFloatingButton />
      </div>
    </Fragment>
  );
};

export default MainLayout;

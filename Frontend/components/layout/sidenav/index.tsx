"use client";

import { useLayoutContext } from "@/context/useLayoutContext";
import Image from "next/image";
import Link from "next/link";
import { TbMenu4, TbX } from "react-icons/tb";
import SimpleBar from "simplebar-react";
import AppMenu from "./components/AppMenu";
import UserProfile from "./components/UserProfile";
import logoFile from "@/assets/images/logo.png";

const Sidenav = () => {
  const { sidenav, hideBackdrop, changeSideNavSize } = useLayoutContext();

  const toggleSidebar = () => {
    changeSideNavSize(
      sidenav.size === "on-hover-active" ? "on-hover" : "on-hover-active"
    );
  };

  const closeSidebar = () => {
    const html = document.documentElement;
    html.classList.toggle("sidebar-enable");
    hideBackdrop();
  };

  return (
    <div
      className="sidenav-menu"
      style={{
        background:
          "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        borderRightColor: "#2d3748",
        boxShadow: "2px 0 10px rgba(0, 0, 0, 0.3)",
      }}
    >
      <Link href="/" className="logo">
        <span
          className="logo logo-light"
          style={{ height: "60px", padding: "20px" }}
        >
          <span className="logo-lg">
            <Image
              src={logoFile}
              alt="logo"
              width={240}
              height={120}
              className="d-block mx-auto"
              style={{
                width: "50%",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </span>
          <span className="logo-sm">
            <Image
              src={logoFile}
              alt="small logo"
              width={120}
              height={120}
              className="d-block mx-auto"
              style={{ width: "50%", height: "auto", objectFit: "contain" }}
            />
          </span>
        </span>

        <span className="logo logo-dark">
          <span className="logo-lg">
            <Image
              src={logoFile}
              alt="dark logo"
              width={240}
              height={120}
              className="d-block mx-auto"
              style={{ width: "50%", height: "auto", objectFit: "contain" }}
            />
          </span>
          <span className="logo-sm">
            <Image
              src={logoFile}
              alt="small logo"
              width={120}
              height={120}
              className="d-block mx-auto"
              style={{ width: "50%", height: "auto", objectFit: "contain" }}
            />
          </span>
        </span>
      </Link>

      <button className="button-on-hover">
        <TbMenu4
          onClick={toggleSidebar}
          className="ti ti-menu-4 fs-22 align-middle"
        />
      </button>

      <button className="button-close-offcanvas">
        <TbX onClick={closeSidebar} className="align-middle" />
      </button>

      <SimpleBar id="sidenav" className="scrollbar">
        {sidenav.user && <UserProfile />}
        <AppMenu />
      </SimpleBar>
    </div>
  );
};

export default Sidenav;

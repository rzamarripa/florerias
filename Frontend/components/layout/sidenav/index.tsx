"use client";

import { useLayoutContext } from "@/context/useLayoutContext";
import Image from "next/image";
import Link from "next/link";
import { TbMenu4, TbX } from "react-icons/tb";
import SimpleBar from "simplebar-react";
import AppMenu from "./components/AppMenu";
import UserProfile from "./components/UserProfile";
import logoFile from "@/assets/images/corazon.png";

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
    <div className="sidenav-menu">
      <Link href="/" className="logo">
        <span className="logo logo-light">
          <span className="logo-lg">
            <Image
              src={logoFile}
              alt="logo"
              width={240}
              height={72}
              className="d-block mx-auto"
              style={{ width: "50%", height: "auto", objectFit: "contain" }}
            />
          </span>
          <span className="logo-sm">
            <Image
              src={logoFile}
              alt="small logo"
              width={120}
              height={60}
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
              height={72}
              className="d-block mx-auto"
              style={{ width: "50%", height: "auto", objectFit: "contain" }}
            />
          </span>
          <span className="logo-sm">
            <Image
              src={logoFile}
              alt="small logo"
              width={120}
              height={60}
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

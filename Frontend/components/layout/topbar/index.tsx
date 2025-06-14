"use client";

import { useLayoutContext } from "@/context/useLayoutContext";
import { Button, Container } from "react-bootstrap";
import { TbMenu4 } from "react-icons/tb";
import LanguageDropdown from "./components/LanguageDropdown";
import MessageDropdown from "./components/MessageDropdown";
import NotificationDropdown from "./components/NotificationDropdown";
import ThemeToggler from "./components/ThemeToggler";
import UserProfile from "./components/UserProfile";

const Topbar = () => {
  const { sidenav, changeSideNavSize, showBackdrop } = useLayoutContext();

  const toggleSideNav = () => {
    const html = document.documentElement;
    const currentSize = html.getAttribute("data-sidenav-size");

    if (currentSize === "offcanvas") {
      html.classList.toggle("sidebar-enable");
      showBackdrop();
    } else if (sidenav.size === "compact") {
      changeSideNavSize(
        currentSize === "compact" ? "condensed" : "compact",
        false
      );
    } else {
      changeSideNavSize(currentSize === "condensed" ? "default" : "condensed");
    }
  };

  return (
    <header className="app-topbar">
      <Container fluid className="topbar-menu">
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="primary"
            onClick={toggleSideNav}
            className="sidenav-toggle-button btn-icon"
          >
            <TbMenu4 className="fs-22" />
          </Button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <LanguageDropdown />

          <MessageDropdown />

          <NotificationDropdown />

          <ThemeToggler />

          <UserProfile />
        </div>
      </Container>
    </header>
  );
};

export default Topbar;

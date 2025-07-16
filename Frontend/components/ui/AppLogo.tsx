import Image from "next/image";
import Link from "next/link";

import logoDark from "@/assets/images/logo-black.png";
import logo from "@/assets/images/logo.png";

const AppLogo = () => {
  return (
    <>
      <Link href="" className="logo-light">
        <Image src={logo} alt="logo" height="100" />
      </Link>
    </>
  );
};

export default AppLogo;

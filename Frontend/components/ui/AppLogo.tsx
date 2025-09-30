import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/images/logo-white.png";

const AppLogo = () => {
  return (
    <>
      <Link href="" className="logo-light">
        <Image src={logo} alt="Corazon de Violeta" height={100} />
      </Link>
    </>
  );
};

export default AppLogo;

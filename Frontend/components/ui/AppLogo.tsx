import Image from "next/image";
import Link from "next/link";
import corazon from "@/assets/images/corazon.png";

const AppLogo = () => {
  return (
    <>
      <Link href="" className="logo-light">
        <Image src={corazon} alt="FloriSoft" height={100} />
      </Link>
    </>
  );
};

export default AppLogo;

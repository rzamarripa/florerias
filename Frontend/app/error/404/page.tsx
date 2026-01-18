import AppLogo from "@/components/ui/AppLogo";
import { author, currentYear } from "@/helpers";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import error404 from "@/assets/images/svg/404.svg";

export const metadata: Metadata = { title: "Error 404" };

const Error404 = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <AppLogo />
        </div>

        <div className="p-4 text-center">
          <Image src={error404} alt="404" className="w-full max-w-xs mx-auto mb-4" />
          <h3 className="font-bold text-xl uppercase mb-2">Page Not Found</h3>
          <p className="text-muted-foreground mb-6">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <Button asChild className="rounded-full">
            <Link href="/">Go Home</Link>
          </Button>
        </div>

        <p className="text-center text-muted-foreground mt-8">
          © 2014 - {currentYear} Zolt — by{" "}
          <span className="font-bold">{author}</span>
        </p>
      </div>
    </div>
  );
};

export default Error404;

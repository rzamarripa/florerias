import AppLogo from "@/components/ui/AppLogo";
import { author, currentYear } from "@/helpers";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Error 400" };

const Error400 = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <AppLogo />
        </div>

        <div className="p-4 text-center">
          <div className="text-8xl font-bold text-primary mb-4">400</div>
          <h3 className="font-bold text-xl uppercase mb-2">Bad Request</h3>
          <p className="text-muted-foreground mb-6">
            Something&apos;s not right in the request you made.
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

export default Error400;

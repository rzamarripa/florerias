import { author, currentYear } from "@/helpers";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import error500 from "@/assets/images/svg/500.svg";

export const metadata: Metadata = { title: "Error 500" };

const Error500 = () => {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block flex-1 bg-gradient-to-br from-destructive/20 to-destructive/5" />

      <Card className="w-full lg:w-[500px] border-0 rounded-none">
        <CardContent className="min-h-screen flex flex-col justify-center p-8">
          <div className="p-4 text-center flex-1 flex flex-col justify-center">
            <Image src={error500} alt="500" className="w-full max-w-xs mx-auto mb-4" />
            <h3 className="font-bold text-xl uppercase mb-2">
              Internal Server Error
            </h3>
            <p className="text-muted-foreground mb-6">
              Something went wrong on our end. Please try again later.
            </p>

            <Button asChild className="rounded-full mx-auto">
              <Link href="/">Go Home</Link>
            </Button>
          </div>

          <p className="text-center text-muted-foreground mt-8">
            © 2014 - {currentYear} Zolt — by{" "}
            <span className="font-bold">{author}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Error500;

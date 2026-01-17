import AppLogo from "@/components/ui/AppLogo";
import { author, currentYear } from "@/helpers";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Error 403" };

const Error403 = () => {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block flex-1 bg-gradient-to-br from-primary/20 to-primary/5" />

      <Card className="w-full lg:w-[500px] border-0 rounded-none">
        <CardContent className="min-h-screen flex flex-col justify-center p-8">
          <div className="text-center mb-6">
            <AppLogo />
          </div>

          <div className="p-4 text-center flex-1 flex flex-col justify-center">
            <div className="text-8xl font-bold text-primary mb-4">403</div>
            <h3 className="font-bold text-xl uppercase mb-2">Forbidden</h3>
            <p className="text-muted-foreground mb-6">
              You don&apos;t have permission to access this resource.
            </p>

            <Button asChild className="rounded-full mx-auto">
              <Link href="/">Go Home</Link>
            </Button>
          </div>

          <p className="text-center text-muted-foreground mt-8">
            © 2014 - {currentYear} MaFlores — by{" "}
            <span className="font-bold">{author}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Error403;

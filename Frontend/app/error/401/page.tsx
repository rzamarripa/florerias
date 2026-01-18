import AppLogo from "@/components/ui/AppLogo";
import { author, currentYear } from "@/helpers";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Error 401" };

const Error401 = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-2">
              <div className="p-8">
                <div className="text-center mb-6">
                  <AppLogo />
                </div>

                <div className="p-4 text-center">
                  <div className="flex justify-center gap-2 text-7xl font-bold text-primary mb-4">
                    <span>4</span>
                    <span>0</span>
                    <span>1</span>
                  </div>

                  <h3 className="font-bold text-xl mb-2">Unauthorized Access</h3>
                  <p className="text-muted-foreground mb-6">
                    You don&apos;t have permission to view this page.
                  </p>

                  <Button asChild className="rounded-full">
                    <Link href="/">Back to Safety</Link>
                  </Button>
                </div>

                <p className="text-center text-muted-foreground mt-8">
                  © 2014 - {currentYear} Zolt — by{" "}
                  <span className="font-bold">{author}</span>
                </p>
              </div>

              <div className="hidden lg:block bg-gradient-to-br from-primary/20 to-primary/5 min-h-[400px]" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Error401;

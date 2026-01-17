import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PropsType = {
  height?: string;
  width?: string;
  overlay?: boolean;
  className?: string;
};

const Loader = ({
  height = "100%",
  width = "100%",
  overlay = false,
  className,
}: PropsType) => {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        className
      )}
      style={{ height, width }}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary absolute z-10" />
      {overlay && (
        <div className="absolute inset-0 bg-background/80 z-[1]" />
      )}
    </div>
  );
};

export default Loader;
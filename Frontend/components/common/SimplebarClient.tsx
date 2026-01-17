"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChildrenType } from "@/types";
import type { ComponentProps } from "react";

type SimplebarClientProps = ChildrenType & ComponentProps<typeof ScrollArea>;

const SimplebarClient = ({ children, ...restProps }: SimplebarClientProps) => {
  return <ScrollArea {...restProps}>{children}</ScrollArea>;
};

export default SimplebarClient;

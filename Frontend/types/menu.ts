import type { IconType } from "react-icons";

export interface MenuItemType {
  key: string;
  label?: string;
  url?: string;
  icon?: IconType;
  children?: MenuItemType[];
  parentKey?: string;
  isTitle?: boolean;
  isDisabled?: boolean;
  isSpecial?: boolean;
  badge?: {
    variant: string;
    text: string;
  };
}

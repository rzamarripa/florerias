"use client";
import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import flagUS from "@/assets/images/flags/us.svg";
import flagDE from "@/assets/images/flags/de.svg";
import flagIT from "@/assets/images/flags/it.svg";
import flagES from "@/assets/images/flags/es.svg";
import flagRU from "@/assets/images/flags/ru.svg";
import flagIN from "@/assets/images/flags/in.svg";

export type LanguageOptionType = {
  code: string;
  name: string;
  nativeName: string;
  flag: StaticImageData;
};

const availableLanguages: LanguageOptionType[] = [
  { code: "en", name: "English", nativeName: "English", flag: flagUS },
  { code: "de", name: "German", nativeName: "Deutsch", flag: flagDE },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: flagIT },
  { code: "es", name: "Spanish", nativeName: "Español", flag: flagES },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: flagRU },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: flagIN },
];

const LanguageDropdown = () => {
  const [language, setLanguage] = useState<LanguageOptionType>(
    availableLanguages[0]
  );

  return (
    <div className="topbar-item">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="topbar-link font-bold flex items-center gap-1">
            <Image
              src={language.flag.src}
              alt="user-image"
              className="rounded"
              width={18}
              height={18}
            />
            <span>{language.code.toUpperCase()}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {availableLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Image
                src={lang.flag.src}
                alt={lang.name}
                className="rounded"
                width={18}
                height={18}
              />
              <span>{lang.nativeName}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LanguageDropdown;

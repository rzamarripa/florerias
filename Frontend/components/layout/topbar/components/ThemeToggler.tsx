'use client'
import { useEffect, useState } from "react";
import { LuMoon, LuSun } from "react-icons/lu";
import { useLayoutContext } from "@/context/useLayoutContext";

const ThemeToggler = () => {
    const { theme, changeTheme } = useLayoutContext();

    const toggleTheme = () => {
        if (theme === "dark") {
            changeTheme('light');
            return;
        }
        changeTheme('dark');
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="topbar-item hidden sm:flex">
            <button onClick={toggleTheme} className="topbar-link" type="button">
                {theme === "dark" ? (
                    <LuSun className="text-xl" />
                ) : (
                    <LuMoon className="text-xl" />
                )}
            </button>
        </div>
    );
};

export default ThemeToggler;

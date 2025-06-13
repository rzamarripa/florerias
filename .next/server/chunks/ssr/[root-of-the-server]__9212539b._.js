module.exports = {

"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[project]/helpers/layout.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "easeInOutQuad": (()=>easeInOutQuad),
    "scrollToElement": (()=>scrollToElement),
    "toggleAttribute": (()=>toggleAttribute)
});
'use client';
const toggleAttribute = (attribute, value, remove, tag = 'html')=>{
    if (document.body) {
        const element = document.getElementsByTagName(tag.toString())[0];
        const hasAttribute = element.getAttribute(attribute);
        if (remove && hasAttribute) element.removeAttribute(attribute);
        else element.setAttribute(attribute, value);
    }
};
const easeInOutQuad = (t, b, c, d)=>{
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
};
const scrollToElement = (element, to, duration)=>{
    const start = element.scrollTop, change = to - start, increment = 20;
    let currentTime = 0;
    const animateScroll = function() {
        currentTime += increment;
        element.scrollTop = easeInOutQuad(currentTime, start, change, duration);
        if (currentTime < duration) {
            setTimeout(animateScroll, increment);
        }
    };
    animateScroll();
};
}}),
"[project]/context/useLayoutContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "LayoutProvider": (()=>LayoutProvider),
    "useLayoutContext": (()=>useLayoutContext)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/helpers/layout.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$usehooks$2d$ts$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/usehooks-ts/dist/index.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const INIT_STATE = {
    skin: "classic",
    theme: "light",
    orientation: "vertical",
    sidenav: {
        size: "default",
        color: "dark",
        user: true,
        isMobileMenuOpen: false
    },
    topBar: {
        color: "light"
    },
    position: "fixed",
    width: "fluid"
};
const LayoutContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const useLayoutContext = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["use"])(LayoutContext);
    if (!context) {
        throw new Error("useLayoutContext can only be used within LayoutProvider");
    }
    return context;
};
const LayoutProvider = ({ children })=>{
    const [settings, setSettings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$usehooks$2d$ts$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLocalStorage"])("__INSPINIA_NEXT_CONFIG__", INIT_STATE);
    const [offcanvasStates, setOffcanvasStates] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        showCustomizer: false
    });
    const updateSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((_newSettings)=>{
        setSettings((prevSettings)=>({
                ...prevSettings,
                ..._newSettings,
                sidenav: {
                    ...prevSettings.sidenav,
                    ..._newSettings.sidenav || {}
                },
                topBar: {
                    ...prevSettings.topBar,
                    ..._newSettings.topBar || {}
                }
            }));
    }, [
        setSettings
    ]);
    const changeSkin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((nSkin, persist = true)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-skin", nSkin);
        if (persist) updateSettings({
            skin: nSkin
        });
    }, [
        updateSettings
    ]);
    const changeTheme = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((nTheme, persist = true)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-bs-theme", nTheme);
        if (persist) updateSettings({
            theme: nTheme
        });
    }, [
        updateSettings
    ]);
    const changeOrientation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((nOrientation, persist = true)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-layout", nOrientation === "horizontal" ? "topnav" : "");
        if (persist) updateSettings({
            orientation: nOrientation
        });
    }, [
        updateSettings
    ]);
    const changeTopBarColor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((nColor, persist = true)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-topbar-color", nColor);
        if (persist) updateSettings({
            topBar: {
                color: nColor
            }
        });
    }, [
        updateSettings
    ]);
    const changeSideNavSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((nSize, persist = true)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-sidenav-size", nSize);
        if (persist) updateSettings({
            sidenav: {
                ...settings.sidenav,
                size: nSize
            }
        });
    }, [
        settings.sidenav,
        updateSettings
    ]);
    const changeSideNavColor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((nColor, persist = true)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-menu-color", nColor);
        if (persist) updateSettings({
            sidenav: {
                ...settings.sidenav,
                color: nColor
            }
        });
    }, [
        settings.sidenav,
        updateSettings
    ]);
    const toggleSideNavUser = ()=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-sidenav-user", (!settings.sidenav.user).toString());
        updateSettings({
            sidenav: {
                ...settings.sidenav,
                user: !settings.sidenav.user
            }
        });
    };
    const toggleMobileMenu = ()=>{
        updateSettings({
            sidenav: {
                ...settings.sidenav,
                isMobileMenuOpen: !settings.sidenav.isMobileMenuOpen
            }
        });
    };
    const changeLayoutPosition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((nPosition, persist = true)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-layout-position", nPosition);
        if (persist) updateSettings({
            position: nPosition
        });
    }, [
        updateSettings
    ]);
    const changeLayoutWidth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((nWidth, persist = true)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-layout-width", nWidth);
        if (persist) updateSettings({
            width: nWidth
        });
    }, [
        updateSettings
    ]);
    const toggleCustomizer = ()=>{
        setOffcanvasStates({
            ...offcanvasStates,
            showCustomizer: !offcanvasStates.showCustomizer
        });
    };
    const customizer = {
        isOpen: offcanvasStates.showCustomizer,
        toggle: toggleCustomizer
    };
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setSettings(INIT_STATE);
    }, [
        setSettings
    ]);
    const showBackdrop = ()=>{
        const backdrop = document.createElement("div");
        backdrop.id = "custom-backdrop";
        backdrop.className = "offcanvas-backdrop fade show";
        document.body.appendChild(backdrop);
        document.body.style.overflow = "hidden";
        if (window.innerWidth > 767) {
            document.body.style.paddingRight = "15px";
        }
        backdrop.addEventListener("click", ()=>{
            const html = document.documentElement;
            html.classList.remove("sidebar-enable");
            hideBackdrop();
        });
    };
    const hideBackdrop = ()=>{
        const backdrop = document.getElementById("custom-backdrop");
        if (backdrop) {
            document.body.removeChild(backdrop);
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const getSystemTheme = ()=>{
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        };
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-skin", settings.skin);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-bs-theme", settings.theme === "system" ? getSystemTheme() : settings.theme);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-topbar-color", settings.topBar.color);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-menu-color", settings.sidenav.color);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-sidenav-size", settings.sidenav.size);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-sidenav-user", settings.sidenav.user.toString());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-layout-position", settings.position);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-layout-width", settings.width);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$helpers$2f$layout$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toggleAttribute"])("data-layout", settings.orientation === "horizontal" ? "topnav" : "");
    }, [
        settings
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (settings.orientation === "vertical") {
            window.addEventListener("resize", ()=>{
                const width = window.innerWidth;
                if (width <= 767.98) {
                    changeSideNavSize("offcanvas", false);
                } else if (width <= 1140 && settings.sidenav.size !== "offcanvas") {
                    changeSideNavSize(settings.sidenav.size === "on-hover" ? "condensed" : "condensed", false);
                } else {
                    changeSideNavSize(settings.sidenav.size);
                }
            });
        }
        if (settings.orientation === "horizontal") {
            window.addEventListener("resize", ()=>{
                const width = window.innerWidth;
                if (width < 992) {
                    changeSideNavSize("offcanvas");
                } else {
                    changeSideNavSize("default");
                }
            });
        }
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LayoutContext.Provider, {
        value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
                ...settings,
                changeSkin,
                changeTheme,
                changeOrientation,
                changeTopBarColor,
                changeSideNavSize,
                changeSideNavColor,
                toggleSideNavUser,
                toggleMobileMenu,
                changeLayoutPosition,
                changeLayoutWidth,
                customizer,
                reset,
                showBackdrop,
                hideBackdrop
            }), [
            settings,
            changeSkin,
            changeTheme,
            changeOrientation,
            changeTopBarColor,
            changeSideNavSize,
            changeSideNavColor,
            changeLayoutPosition,
            changeLayoutWidth,
            customizer
        ]),
        children: children
    }, void 0, false, {
        fileName: "[project]/context/useLayoutContext.tsx",
        lineNumber: 265,
        columnNumber: 5
    }, this);
};
;
}}),
"[project]/components/layout/AppWrapper.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$context$2f$useLayoutContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/context/useLayoutContext.tsx [app-ssr] (ecmascript)");
"use client";
;
;
const AppWrapper = ({ children })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$context$2f$useLayoutContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LayoutProvider"], {
        children: children
    }, void 0, false, {
        fileName: "[project]/components/layout/AppWrapper.tsx",
        lineNumber: 6,
        columnNumber: 10
    }, this);
};
const __TURBOPACK__default__export__ = AppWrapper;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__9212539b._.js.map
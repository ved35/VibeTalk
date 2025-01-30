import { create } from "zustand";

export const useThemeStore = create((set)=>({
    theme: localStorage.getItem("VibeTalk-theme") || "dark",
    setTheme : (theme) => {
        localStorage.setItem("VibeTalk-theme", theme);
        set({theme: theme})
    }
}))
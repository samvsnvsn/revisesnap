"use client";
import { useEffect } from "react";

export default function ThemeSync(){
  useEffect(()=>{
    function apply(){
      try{
        const p = JSON.parse(localStorage.getItem("rs_profile")||"{}");
        const root = document.documentElement;
        const body = document.body;

        // Remove all theme classes
        body.classList.remove("warm", "dark");

        // Apply theme
        if (p.theme === "warm") body.classList.add("warm");
        if (p.theme === "dark") body.classList.add("dark");

        // Custom colors
        if (p.customBg) root.style.setProperty("--bg", p.customBg);
        else root.style.removeProperty("--bg");

        if (p.cardColor) root.style.setProperty("--surface", p.cardColor);
        else root.style.removeProperty("--surface");
      }catch{}
    }
    apply();
    const h = ()=>apply();
    window.addEventListener("storage", h);
    window.addEventListener("rs_profile_changed", h as any);
    return ()=>{
      window.removeEventListener("storage", h);
      window.removeEventListener("rs_profile_changed", h as any);
    };
  },[]);
  return null;
}

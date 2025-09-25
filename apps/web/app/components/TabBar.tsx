"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/scan", label: "Scan", icon: "📷" },
  { href: "/notes", label: "Notes", icon: "📄" },
  { href: "/review", label: "Review", icon: "✅" },
  { href: "/me", label: "Me", icon: "🙂" },
];

export default function TabBar(){
  const path = usePathname();
  return (
    <nav className="tabbar" role="navigation" aria-label="Bottom">
      {items.map(i=>{
        const current = path === i.href;
        return (
          <Link key={i.href} href={i.href} aria-current={current? "page": undefined}>
            <span aria-hidden>{i.icon}</span><span>{i.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

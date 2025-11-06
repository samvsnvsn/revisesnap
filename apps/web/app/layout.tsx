import "./styles.css";
import Link from "next/link";
import dynamic from "next/dynamic";
import SWRegister from "./sw-register";
import TabBar from "./components/TabBar";
import InstallPrompt from "./components/InstallPrompt";
import ThemeSync from "./components/ThemeSync";

const PomodoroTimer = dynamic(() => import("./components/PomodoroTimer"), { ssr: false });

export const metadata = {
  title: "ReviseSnap",
  description: "Scan → Notes → Review",
  manifest: "/manifest.webmanifest",
  themeColor: "#F8FAFC",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ReviseSnap" },
  icons: {
    icon: [ { url: "/icons/icon-192.png" }, { url: "/icons/icon-512.png" } ],
    apple: [ { url: "/icons/apple-touch-icon.png" } ]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="with-tabbar">
        <header className="topbar">
          <div className="brand">ReviseSnap</div>
          <nav style={{marginLeft:"auto",display:"flex",gap:12}}>
            <Link href="/scan" className="btn btn-ghost">Scan</Link>
            <Link href="/review" className="btn btn-primary">5‑min Review</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
        <ThemeSync/>
        <PomodoroTimer/>
        <footer className="foot">Powered by <a href="https://arteloux.com" target="_blank" rel="noreferrer">Arteloux Ltd</a></footer>
        <TabBar/>
        <SWRegister/>
        <InstallPrompt/>
      </body>
    </html>
  );
}

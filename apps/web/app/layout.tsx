import "./styles.css";
import Link from "next/link";
import SWRegister from "./sw-register";
import TabBar from "./components/TabBar";
import InstallPrompt from "./components/InstallPrompt";
import ThemeSync from "./components/ThemeSync";

export const metadata = {
  title: "ReviseSnap",
  description: "Scan → Notes → Review",
  manifest: "/manifest.webmanifest",
  themeColor: "#FBFDFE",
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
        <footer className="foot">Powered by <a href="https://arteloux.com" target="_blank" rel="noreferrer">Arteloux Ltd</a></footer>
        <TabBar/>
        <SWRegister/>
        <InstallPrompt/>
      </body>
    </html>
  );
}

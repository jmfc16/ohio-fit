export const metadata = { title: 'Ohio FIT', description: 'Explore Ohio local finance' };
import "./globals.css";
import Search from "../components/Search";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app">
          <aside className="sidebar" aria-label="Primary">
            <div className="logo"><span className="mark"/> <strong>FIT</strong></div>
            <nav className="nav">
              <a href="/">Explore</a>
              <a href="/governments/CIN">Individual Governments</a>
              <a href="/types">Government Types</a>
              <a href="#">Navigate By Dollars</a>
              <a href="#">Financial Health</a>
              <a href="#">Data Extracts</a>
              <a href="#">About</a>
              <a href="#">Help</a>
            </nav>
            <div className="footer">Office of the Ohio Auditor</div>
          </aside>
          <div className="content">
            <div className="topbar">
              <div className="searchbar" role="search" aria-label="Search FIT">
                <Search />
              </div>
            </div>
            <div className="container">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

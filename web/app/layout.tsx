export const metadata = { title: 'Ohio FIT', description: 'Explore Ohio local finance' };
import Search from "../components/Search";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
          <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <a href="/">Home</a>
            <a href="/governments/CIN">Government Profile</a>
            <div style={{ marginLeft: 'auto' }}>
              <Search />
            </div>
          </nav>
        </header>
        <main style={{ padding: '1rem' }}>{children}</main>
      </body>
    </html>
  );
}

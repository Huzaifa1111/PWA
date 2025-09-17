import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'POS System',
  description: 'PWA POS App',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
<body className="bg-gray-100" suppressHydrationWarning={true}>        <Navbar />
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}
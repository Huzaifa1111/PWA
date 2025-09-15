import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-blue-600 p-4 text-white flex justify-around">
      <Link href="/" className="hover:underline">Home (Sales)</Link>
      <Link href="/history" className="hover:underline">History</Link>
      <Link href="/settings" className="hover:underline">Settings (Prices)</Link>
    </nav>
  );
}
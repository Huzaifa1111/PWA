"use client";
import Link from 'next/link';
import { Store } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-gray-700 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
           {/* Logo / Icon */}
          <div className="flex items-center space-x-2 text-white">
            <Link href="/"><Store className="w-7 h-7 text-lime-400" /> </Link>
            <span className="text-xl font-bold tracking-wide">POS</span>
          </div>

          {/* Links */}
          <div className="flex space-x-6">
            <Link
              href="/"
              className="px-3 py-2 rounded-md text-gray-200 hover:bg-gray-600 hover:text-white transform hover:scale-105 transition duration-200"
            >
              Home 
            </Link>
            <Link
              href="/history"
              className="px-3 py-2 rounded-md text-gray-200 hover:bg-gray-600 hover:text-white transform hover:scale-105 transition duration-200"
            >
              History
            </Link>
            <Link
              href="/settings"
              className="px-3 py-2 rounded-md text-gray-200 hover:bg-gray-600 hover:text-white transform hover:scale-105 transition duration-200"
            >
              Settings 
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

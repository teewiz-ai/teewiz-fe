"use client";

import Link from "next/link"
import { User } from "lucide-react"
// import {login} from "@/lib/auth";
// import { useAuth, type Session } from "@/components/useAuth"

export default function Navigation() {
  // const session: Session = useAuth()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          AI TeeLab
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="py-2 border-b-2 border-blue-500 font-medium">
            Home
          </Link>
          <Link href="/my-designs" className="py-2 border-b-2 border-transparent hover:border-blue-500 font-medium">
            My Designs
          </Link>
          <Link href="/orders" className="py-2 border-b-2 border-transparent hover:border-blue-500 font-medium">
            Orders
          </Link>
        </nav>

        <div className="flex items-center">
          {/*{session.authenticated ? (*/}
          {/*    <img*/}
          {/*        src={session.picture}*/}
          {/*        alt={session.name}*/}
          {/*        className="w-10 h-10 rounded-full object-cover"*/}
          {/*    />*/}
          {/*) : (*/}
              <button
                  // onClick={() => login("/")}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center space-x-2"
              >
                <User className="h-5 w-5" />
                <span>Sign in</span>
              </button>
          {/*)}*/}
        </div>

      </div>
    </header>
  )
}

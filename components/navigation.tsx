import Link from "next/link"
import { User } from "lucide-react"

export default function Navigation() {
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
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white">
            <User className="h-6 w-6" />
          </div>
        </div>
      </div>
    </header>
  )
}

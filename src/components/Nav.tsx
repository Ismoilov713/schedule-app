'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Schedule' },
  { href: '/teachers', label: 'Teachers' },
  { href: '/resources', label: 'Resources' },
  { href: '/admin', label: 'Admin' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 h-14">
        <span className="font-semibold text-gray-800 mr-4">UniSchedule</span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              pathname === l.href
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

import Link from 'next/link'
import { Calendar, Users, BookOpen, Shield } from 'lucide-react'

const cards = [
  {
    href: '/schedule',
    icon: Calendar,
    title: 'Schedule',
    desc: 'Browse classes filtered by group, day, and time.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    href: '/teachers',
    icon: Users,
    title: 'Teachers',
    desc: 'Directory of all faculty members and their subjects.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    href: '/resources',
    icon: BookOpen,
    title: 'Resources',
    desc: 'Books, slides, and materials organized by subject.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    href: '/admin',
    icon: Shield,
    title: 'Admin',
    desc: 'Upload PDFs and manage learning resources.',
    color: 'bg-rose-50 text-rose-600',
  },
]

export default function HomePage() {
  return (
    <div className="space-y-10">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">University Schedule</h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          Your central hub for class schedules, teacher info, and study resources.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(({ href, icon: Icon, title, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="card hover:shadow-md transition-shadow group flex flex-col gap-4"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {title}
              </h2>
              <p className="text-sm text-slate-500 mt-1">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

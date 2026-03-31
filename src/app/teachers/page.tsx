'use client'
import { useEffect, useState } from 'react'

interface Teacher {
  id: string
  full_name: string
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/teachers')
      .then((r) => r.json())
      .then((d) => setTeachers(d.teachers ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = teachers.filter((t) =>
    t.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Teachers Directory</h1>
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading teachers…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {search ? 'No teachers match your search.' : 'No teachers found. Upload a schedule PDF first.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {t.full_name
                  .split(' ')
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <span className="text-gray-800 text-sm font-medium leading-snug">
                {t.full_name}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-gray-400">
        {filtered.length} teacher{filtered.length !== 1 ? 's' : ''} shown
      </p>
    </div>
  )
}

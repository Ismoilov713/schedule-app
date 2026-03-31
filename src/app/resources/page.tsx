'use client'
import { useEffect, useState } from 'react'

interface Subject {
  id: string
  name: string
}

interface Resource {
  id: string
  title: string
  file_url: string | null
  subjects: { name: string }
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/subjects')
      .then((r) => r.json())
      .then((d) => setSubjects(d.subjects ?? []))
  }, [])

  useEffect(() => {
    setLoading(true)
    const url = selectedSubject
      ? `/api/resources?subject_id=${encodeURIComponent(selectedSubject)}`
      : '/api/resources'
    fetch(url)
      .then((r) => r.json())
      .then((d) => setResources(d.resources ?? []))
      .finally(() => setLoading(false))
  }, [selectedSubject])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Resources</h1>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading resources…</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No resources found. Add some from the Admin panel.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {resources.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {r.subjects?.name}
                </span>
              </div>
              <p className="text-gray-800 font-medium text-sm leading-snug">{r.title}</p>
              {r.file_url ? (
                <a
                  href={r.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto text-sm text-blue-600 hover:underline"
                >
                  Open resource →
                </a>
              ) : (
                <span className="mt-auto text-sm text-gray-400">No link</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'

interface ScheduleRow {
  id: string
  time: string
  room: string
  lecture_teacher: string
  seminar_teacher: string
  groups: { name: string }
  subjects: { name: string }
  teachers: { full_name: string } | null
}

interface Group {
  id: string
  name: string
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleRow[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/groups')
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
  }, [])

  useEffect(() => {
    setLoading(true)
    const url = selectedGroup
      ? `/api/schedule?group=${encodeURIComponent(selectedGroup)}`
      : '/api/schedule'
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setSchedule(d.schedule ?? [])
        setError(d.error ?? '')
      })
      .finally(() => setLoading(false))
  }, [selectedGroup])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Schedule</h1>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading schedule…</div>
      ) : schedule.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No schedule entries found.{' '}
          {!selectedGroup && 'Upload a PDF from the Admin panel to get started.'}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Group</th>
                <th className="px-4 py-3 font-medium text-gray-600">Time</th>
                <th className="px-4 py-3 font-medium text-gray-600">Subject</th>
                <th className="px-4 py-3 font-medium text-gray-600">Teacher</th>
                <th className="px-4 py-3 font-medium text-gray-600">Lecture</th>
                <th className="px-4 py-3 font-medium text-gray-600">Seminar</th>
                <th className="px-4 py-3 font-medium text-gray-600">Room</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-4 py-3 font-medium text-blue-700">
                    {row.groups?.name}
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {row.time}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{row.subjects?.name}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.teachers?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.lecture_teacher || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{row.seminar_teacher || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{row.room || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

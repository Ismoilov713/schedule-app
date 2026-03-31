'use client'
import { useState, useEffect, FormEvent } from 'react'

interface Subject {
  id: string
  name: string
}

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [pdfMessage, setPdfMessage] = useState('')
  const [parsedRows, setParsedRows] = useState<unknown[]>([])

  // Resource state
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [resTitle, setResTitle] = useState('')
  const [resSubjectId, setResSubjectId] = useState('')
  const [resLinkUrl, setResLinkUrl] = useState('')
  const [resFile, setResFile] = useState<File | null>(null)
  const [resStatus, setResStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [resMessage, setResMessage] = useState('')

  useEffect(() => {
    if (authed) {
      fetch('/api/subjects')
        .then((r) => r.json())
        .then((d) => setSubjects(d.subjects ?? []))
    }
  }, [authed])

  function handleLogin(e: FormEvent) {
    e.preventDefault()
    if (!secret.trim()) {
      setAuthError('Enter your admin secret.')
      return
    }
    // Store locally — validated server-side on each request
    setAuthed(true)
    setAuthError('')
  }

  async function handlePdfUpload(e: FormEvent) {
    e.preventDefault()
    if (!pdfFile) return

    setPdfStatus('loading')
    setPdfMessage('')
    setParsedRows([])

    const fd = new FormData()
    fd.append('file', pdfFile)

    try {
      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        headers: { 'x-admin-secret': secret },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setPdfStatus('error')
        setPdfMessage(data.error ?? 'Upload failed')
      } else {
        setPdfStatus('success')
        setPdfMessage(`Successfully imported ${data.inserted} schedule rows.`)
        setParsedRows(data.rows ?? [])
        setPdfFile(null)
      }
    } catch {
      setPdfStatus('error')
      setPdfMessage('Network error. Check console.')
    }
  }

  async function handleAddResource(e: FormEvent) {
    e.preventDefault()
    if (!resTitle || !resSubjectId) return

    setResStatus('loading')
    setResMessage('')

    const fd = new FormData()
    fd.append('title', resTitle)
    fd.append('subject_id', resSubjectId)
    if (resLinkUrl) fd.append('link_url', resLinkUrl)
    if (resFile) fd.append('file', resFile)

    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'x-admin-secret': secret },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setResStatus('error')
        setResMessage(data.error ?? 'Failed to add resource')
      } else {
        setResStatus('success')
        setResMessage(`Resource "${data.resource.title}" added.`)
        setResTitle('')
        setResSubjectId('')
        setResLinkUrl('')
        setResFile(null)
      }
    } catch {
      setResStatus('error')
      setResMessage('Network error.')
    }
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-16">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Admin Login</h1>
        <form onSubmit={handleLogin} className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4">
          <label className="text-sm text-gray-600">
            Admin Secret
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter ADMIN_SECRET from .env"
            />
          </label>
          {authError && <p className="text-red-600 text-sm">{authError}</p>}
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={() => setAuthed(false)}
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-3 py-1"
        >
          Logout
        </button>
      </div>

      {/* PDF Upload Section */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Upload Schedule PDF</h2>
        <form onSubmit={handlePdfUpload} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">PDF File</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50"
            />
            <p className="mt-1 text-xs text-gray-400">
              PDF should contain schedule data in a table or structured block format.
            </p>
          </div>

          <button
            type="submit"
            disabled={!pdfFile || pdfStatus === 'loading'}
            className="self-start bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pdfStatus === 'loading' ? 'Parsing & uploading…' : 'Upload & Parse'}
          </button>

          {pdfMessage && (
            <div
              className={`text-sm px-3 py-2 rounded border ${
                pdfStatus === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {pdfMessage}
            </div>
          )}
        </form>

        {parsedRows.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Preview ({parsedRows.length} rows parsed):
            </p>
            <div className="overflow-auto max-h-48 border border-gray-200 rounded text-xs">
              <pre className="p-3 text-gray-600">
                {JSON.stringify(parsedRows.slice(0, 5), null, 2)}
                {parsedRows.length > 5 && `\n… and ${parsedRows.length - 5} more`}
              </pre>
            </div>
          </div>
        )}
      </section>

      {/* Add Resource Section */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Add Resource</h2>
        <form onSubmit={handleAddResource} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Title *</label>
            <input
              type="text"
              value={resTitle}
              onChange={(e) => setResTitle(e.target.value)}
              required
              placeholder="e.g. Introduction to Algorithms (3rd Ed)"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Subject *</label>
            <select
              value={resSubjectId}
              onChange={(e) => setResSubjectId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a subject…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {subjects.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                No subjects yet. Upload a schedule PDF first to populate subjects.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Link URL</label>
            <input
              type="url"
              value={resLinkUrl}
              onChange={(e) => setResLinkUrl(e.target.value)}
              placeholder="https://example.com/book.pdf"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Or upload a file</label>
            <input
              type="file"
              onChange={(e) => setResFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50"
            />
          </div>

          <button
            type="submit"
            disabled={!resTitle || !resSubjectId || resStatus === 'loading'}
            className="self-start bg-green-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {resStatus === 'loading' ? 'Saving…' : 'Add Resource'}
          </button>

          {resMessage && (
            <div
              className={`text-sm px-3 py-2 rounded border ${
                resStatus === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {resMessage}
            </div>
          )}
        </form>
      </section>
    </div>
  )
}

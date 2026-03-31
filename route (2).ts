import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, supabase } from '@/lib/supabase'
import { isAdmin, unauthorized } from '@/lib/auth'

// GET – list all resources (grouped by subject)
export async function GET() {
  const { data, error } = await supabase
    .from('resources')
    .select('id, title, file_url, created_at, subjects ( id, name )')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST – add a resource (admin only)
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()

  const formData = await req.formData()
  const title = formData.get('title') as string
  const subjectId = formData.get('subject_id') as string
  const link = formData.get('link') as string | null
  const file = formData.get('file') as File | null

  if (!title || !subjectId) {
    return NextResponse.json({ error: 'title and subject_id are required' }, { status: 400 })
  }

  const db = getAdminClient()
  let fileUrl = link ?? null

  // Upload file to Supabase Storage if provided
  if (file) {
    const fileName = `${Date.now()}-${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await db.storage
      .from('resources')
      .upload(fileName, arrayBuffer, { contentType: file.type })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = db.storage.from('resources').getPublicUrl(fileName)
    fileUrl = urlData.publicUrl
  }

  const { data, error } = await db
    .from('resources')
    .insert({ title, subject_id: parseInt(subjectId), file_url: fileUrl })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

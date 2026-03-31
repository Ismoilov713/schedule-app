import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const db = createAdminClient()
  const { searchParams } = new URL(req.url)
  const subjectId = searchParams.get('subject_id')

  let query = db
    .from('resources')
    .select('id, title, file_url, subjects(name)')
    .order('created_at', { ascending: false })

  if (subjectId) {
    query = query.eq('subject_id', subjectId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ resources: data })
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = createAdminClient()
    const formData = await req.formData()

    const title = formData.get('title') as string
    const subjectId = formData.get('subject_id') as string
    const linkUrl = formData.get('link_url') as string | null
    const file = formData.get('file') as File | null

    if (!title || !subjectId) {
      return NextResponse.json({ error: 'title and subject_id required' }, { status: 400 })
    }

    let fileUrl = linkUrl ?? null

    // Upload file to Supabase Storage if provided
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${subjectId}/${Date.now()}.${ext}`
      const arrayBuffer = await file.arrayBuffer()
      const { error: uploadError } = await db.storage
        .from('resources')
        .upload(path, Buffer.from(arrayBuffer), { contentType: file.type })

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
      }

      const { data: urlData } = db.storage.from('resources').getPublicUrl(path)
      fileUrl = urlData.publicUrl
    }

    const { data, error } = await db
      .from('resources')
      .insert({ title, subject_id: subjectId, file_url: fileUrl })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ resource: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

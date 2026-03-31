import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { parsePdfText } from '@/lib/parsePdf'
import { isAdmin, unauthorized } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Dynamically import pdf-parse (CommonJS module)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require('pdf-parse')
  const pdfData = await pdfParse(buffer)
  const rawText: string = pdfData.text

  const rows = parsePdfText(rawText)

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'Could not extract schedule rows from PDF. Check the parser or PDF format.' },
      { status: 422 }
    )
  }

  const db = getAdminClient()

  let inserted = 0
  const errors: string[] = []

  for (const row of rows) {
    try {
      // Upsert group
      const { data: groupData } = await db
        .from('groups')
        .upsert({ name: row.group }, { onConflict: 'name' })
        .select('id')
        .single()

      // Upsert subject
      const { data: subjectData } = await db
        .from('subjects')
        .upsert({ name: row.subject }, { onConflict: 'name' })
        .select('id')
        .single()

      // Upsert teacher
      let teacherId: number | null = null
      if (row.teacher_full_name) {
        const { data: teacherData } = await db
          .from('teachers')
          .upsert({ full_name: row.teacher_full_name }, { onConflict: 'full_name' })
          .select('id')
          .single()
        teacherId = teacherData?.id ?? null
      }

      if (!groupData?.id || !subjectData?.id) continue

      await db.from('schedule').insert({
        group_id: groupData.id,
        subject_id: subjectData.id,
        teacher_id: teacherId,
        lecture_teacher: row.lecture_teacher,
        seminar_teacher: row.seminar_teacher,
        room: row.room,
        time: row.time,
        day_of_week: row.day_of_week,
      })

      inserted++
    } catch (err: unknown) {
      errors.push(String(err))
    }
  }

  return NextResponse.json({
    success: true,
    total_parsed: rows.length,
    inserted,
    errors: errors.slice(0, 10),
  })
}

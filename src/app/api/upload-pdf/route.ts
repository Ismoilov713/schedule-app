import { NextRequest, NextResponse } from 'next/server'
import { parsePdfSchedule } from '@/lib/pdfParser'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  // Simple admin auth via secret header
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF file required' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const rows = await parsePdfSchedule(buffer)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Could not parse any schedule rows from PDF' },
        { status: 422 }
      )
    }

    const db = createAdminClient()

    // Upsert groups, subjects, teachers and collect IDs
    const groupMap = new Map<string, string>()
    const subjectMap = new Map<string, string>()
    const teacherMap = new Map<string, string>()

    // Collect unique values
    const uniqueGroups = [...new Set(rows.map((r) => r.group).filter(Boolean))]
    const uniqueSubjects = [...new Set(rows.map((r) => r.subject).filter(Boolean))]
    const uniqueTeachers = [
      ...new Set(rows.map((r) => r.teacher_full_name).filter(Boolean)),
    ]

    // Upsert groups
    if (uniqueGroups.length > 0) {
      const { data: gData } = await db
        .from('groups')
        .upsert(uniqueGroups.map((name) => ({ name })), { onConflict: 'name' })
        .select()
      gData?.forEach((g) => groupMap.set(g.name, g.id))
    }

    // Upsert subjects
    if (uniqueSubjects.length > 0) {
      const { data: sData } = await db
        .from('subjects')
        .upsert(uniqueSubjects.map((name) => ({ name })), { onConflict: 'name' })
        .select()
      sData?.forEach((s) => subjectMap.set(s.name, s.id))
    }

    // Upsert teachers
    if (uniqueTeachers.length > 0) {
      const { data: tData } = await db
        .from('teachers')
        .upsert(uniqueTeachers.map((full_name) => ({ full_name })), {
          onConflict: 'full_name',
        })
        .select()
      tData?.forEach((t) => teacherMap.set(t.full_name, t.id))
    }

    // Build schedule insert payload
    const scheduleRows = rows.map((r) => ({
      group_id: groupMap.get(r.group),
      subject_id: subjectMap.get(r.subject),
      teacher_id: teacherMap.get(r.teacher_full_name) ?? null,
      lecture_teacher: r.lecture_teacher,
      seminar_teacher: r.seminar_teacher,
      room: r.room,
      time: r.time,
    }))

    const { error: scheduleError } = await db.from('schedule').insert(scheduleRows)
    if (scheduleError) {
      console.error(scheduleError)
      return NextResponse.json({ error: scheduleError.message }, { status: 500 })
    }

    return NextResponse.json({ inserted: rows.length, rows })
  } catch (err: unknown) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

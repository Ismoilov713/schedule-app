import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: teachers, error } = await supabase
    .from('teachers')
    .select('id, full_name')
    .order('full_name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // For each teacher, find their subjects via schedule
  const teachersWithSubjects = await Promise.all(
    (teachers ?? []).map(async (teacher) => {
      const { data: scheduleRows } = await supabase
        .from('schedule')
        .select('subjects ( name )')
        .eq('teacher_id', teacher.id)

      const subjects = [
        ...new Set(
          (scheduleRows ?? [])
            .map((r: any) => r.subjects?.name)
            .filter(Boolean)
        ),
      ]

      return { ...teacher, subjects }
    })
  )

  return NextResponse.json({ data: teachersWithSubjects })
}

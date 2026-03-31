import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const db = createAdminClient()
  const { searchParams } = new URL(req.url)
  const groupName = searchParams.get('group')

  let query = db
    .from('schedule')
    .select(
      `id, time, room, lecture_teacher, seminar_teacher,
       groups(name),
       subjects(name),
       teachers(full_name)`
    )
    .order('time', { ascending: true })

  if (groupName) {
    // Filter via join
    const { data: groupData } = await db
      .from('groups')
      .select('id')
      .eq('name', groupName)
      .single()

    if (groupData) {
      query = query.eq('group_id', groupData.id)
    }
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ schedule: data })
}

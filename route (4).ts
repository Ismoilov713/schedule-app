import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const groupName = searchParams.get('group')

  let query = supabase
    .from('schedule')
    .select(`
      id,
      time,
      day_of_week,
      room,
      lecture_teacher,
      seminar_teacher,
      groups ( id, name ),
      subjects ( id, name ),
      teachers ( id, full_name )
    `)
    .order('day_of_week')
    .order('time')

  if (groupName) {
    // Join filter via groups table
    const { data: group } = await supabase
      .from('groups')
      .select('id')
      .eq('name', groupName)
      .single()
    if (group) query = query.eq('group_id', group.id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

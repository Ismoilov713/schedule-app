// lib/parsePdf.ts
// Parses a university-schedule PDF and returns structured rows.
// The parser uses heuristic line-by-line analysis; adjust the regex
// patterns to match your institution's specific PDF layout.

export interface ScheduleRow {
  group: string
  subject: string
  teacher_full_name: string
  lecture_teacher: string
  seminar_teacher: string
  room: string
  time: string
  day_of_week: string
}

/**
 * Attempt to extract schedule rows from raw PDF text.
 *
 * Expected loose format per line / block:
 *   <DAY>  <TIME>  <GROUP>  <SUBJECT>  <TEACHER>  <ROOM>
 *
 * The function tries several strategies:
 *  1. Tab-separated columns
 *  2. Pipe-separated columns
 *  3. Multi-space heuristic splitting
 */
export function parsePdfText(rawText: string): ScheduleRow[] {
  const rows: ScheduleRow[] = []
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday',
                 'понедельник','вторник','среда','четверг','пятница','суббота','воскресенье']
  const timeRegex = /\d{1,2}[:.]\d{2}\s*[-–—]\s*\d{1,2}[:.]\d{2}/i
  const roomRegex = /(?:room|аудитория|ауд\.?|кабинет|каб\.?|hall)\s*[#№]?\s*[\w\d-]+/i

  let currentDay = ''
  let currentGroup = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect day header
    const dayMatch = DAYS.find((d) => line.toLowerCase().startsWith(d))
    if (dayMatch) { currentDay = line; continue }

    // Detect group header  (e.g. "Group 101-A" or "Группа ИТ-21")
    if (/^(group|группа)\s+\S+/i.test(line)) {
      currentGroup = line.replace(/^(group|группа)\s+/i, '').trim()
      continue
    }

    // Try tab-separated
    if (line.includes('\t')) {
      const cols = line.split('\t').map((c) => c.trim())
      if (cols.length >= 4) {
        rows.push(buildRow(cols, currentDay, currentGroup))
        continue
      }
    }

    // Try pipe-separated
    if (line.includes('|')) {
      const cols = line.split('|').map((c) => c.trim()).filter(Boolean)
      if (cols.length >= 4) {
        rows.push(buildRow(cols, currentDay, currentGroup))
        continue
      }
    }

    // Heuristic: line contains a time expression → treat as schedule row
    if (timeRegex.test(line)) {
      // Merge with the next line if it looks like a subject continuation
      let fullLine = line
      if (i + 1 < lines.length && !timeRegex.test(lines[i + 1])) {
        fullLine = line + ' ' + lines[i + 1]
        i++
      }
      const parts = fullLine.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean)
      rows.push(buildRow(parts, currentDay, currentGroup))
    }
  }

  return rows.filter((r) => r.subject || r.time) // drop empty rows
}

function buildRow(cols: string[], day: string, group: string): ScheduleRow {
  // Columns heuristic: [time?, group?, subject, teacher, room?, ...]
  const timeRegex = /\d{1,2}[:.]\d{2}/
  const roomRegex = /(?:room|ауд|каб|hall|#)\s*[\w\d-]+/i

  let time = cols.find((c) => timeRegex.test(c)) ?? ''
  let room = cols.find((c) => roomRegex.test(c)) ?? ''

  // Remove identified columns, what remains is [group?, subject, teacher]
  const rest = cols.filter((c) => c !== time && c !== room)

  const subject = rest[0] ?? ''
  const teacherRaw = rest[1] ?? ''
  const groupName = rest[2] ? rest[0] : group  // if 3 items, first may be group

  // Simple heuristic: lecture teacher vs seminar teacher split by "/"
  const [lectureTeacher, seminarTeacher] = teacherRaw.includes('/')
    ? teacherRaw.split('/').map((t) => t.trim())
    : [teacherRaw, '']

  return {
    group: groupName || group,
    subject: rest.length >= 3 ? rest[1] : subject,
    teacher_full_name: teacherRaw,
    lecture_teacher: lectureTeacher,
    seminar_teacher: seminarTeacher,
    room,
    time,
    day_of_week: day,
  }
}

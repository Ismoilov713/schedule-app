import pdfParse from 'pdf-parse'

export interface ScheduleRow {
  group: string
  subject: string
  teacher_full_name: string
  lecture_teacher: string
  seminar_teacher: string
  room: string
  time: string
}

/**
 * Parses a university schedule PDF buffer into structured rows.
 *
 * Strategy:
 * 1. Extract raw text from PDF.
 * 2. Split into lines, skip blanks.
 * 3. Detect header line that contains known column keywords.
 * 4. Map each subsequent line by column positions or tab-separation.
 *
 * If your PDF uses a different layout, adjust the column indices in COLUMN_MAP.
 */
export async function parsePdfSchedule(buffer: Buffer): Promise<ScheduleRow[]> {
  const data = await pdfParse(buffer)
  const text = data.text

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const rows: ScheduleRow[] = []

  // Try tab-separated or multi-space separated format first
  // Look for a header row
  const headerIndex = lines.findIndex((l) =>
    /group|группа/i.test(l) && /subject|предмет/i.test(l)
  )

  if (headerIndex !== -1) {
    // Parse table-like format
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const cols = lines[i].split(/\t|  {2,}/).map((c) => c.trim())
      if (cols.length >= 4) {
        rows.push(mapColumns(cols))
      }
    }
  } else {
    // Fallback: parse block format where each record is N consecutive lines
    // Pattern: group / time / subject / teacher / room
    rows.push(...parseBlockFormat(lines))
  }

  return rows.filter((r) => r.subject && r.group)
}

function mapColumns(cols: string[]): ScheduleRow {
  // Default column order assumption:
  // 0: group, 1: time, 2: subject, 3: teacher, 4: lecture_teacher, 5: seminar_teacher, 6: room
  return {
    group: cols[0] ?? '',
    time: cols[1] ?? '',
    subject: cols[2] ?? '',
    teacher_full_name: cols[3] ?? '',
    lecture_teacher: cols[4] ?? cols[3] ?? '',
    seminar_teacher: cols[5] ?? cols[3] ?? '',
    room: cols[6] ?? cols[4] ?? '',
  }
}

function parseBlockFormat(lines: string[]): ScheduleRow[] {
  const rows: ScheduleRow[] = []

  // Heuristic: group names often look like "CS-101" or "Группа 1"
  const groupPattern = /^([A-ZА-Я]{1,4}[-–]?\d{1,3}[A-ZА-Я]?|Группа\s+\S+)/i
  // Time pattern: 08:00 - 09:30 or Mon 10:00
  const timePattern = /\d{1,2}:\d{2}/

  let current: Partial<ScheduleRow> = {}
  let fieldCount = 0

  for (const line of lines) {
    if (groupPattern.test(line)) {
      if (current.group && current.subject) {
        rows.push(finalizeRow(current))
      }
      current = { group: line }
      fieldCount = 1
    } else if (timePattern.test(line) && fieldCount === 1) {
      current.time = line
      fieldCount++
    } else if (!current.subject && fieldCount >= 1) {
      current.subject = line
      fieldCount++
    } else if (!current.teacher_full_name && fieldCount >= 2) {
      current.teacher_full_name = line
      current.lecture_teacher = line
      current.seminar_teacher = line
      fieldCount++
    } else if (!current.room && /\d/.test(line) && fieldCount >= 3) {
      current.room = line
      fieldCount++
    }
  }

  if (current.group && current.subject) {
    rows.push(finalizeRow(current))
  }

  return rows
}

function finalizeRow(partial: Partial<ScheduleRow>): ScheduleRow {
  return {
    group: partial.group ?? '',
    subject: partial.subject ?? '',
    teacher_full_name: partial.teacher_full_name ?? '',
    lecture_teacher: partial.lecture_teacher ?? partial.teacher_full_name ?? '',
    seminar_teacher: partial.seminar_teacher ?? partial.teacher_full_name ?? '',
    room: partial.room ?? '',
    time: partial.time ?? '',
  }
}

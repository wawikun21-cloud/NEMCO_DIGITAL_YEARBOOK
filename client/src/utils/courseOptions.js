export const COURSE_OPTIONS = [
  { value: "CIT", label: "CIT", subs: ["BSIT", "ACT"] },
  { value: "CCJE", label: "CCJE", subs: ["BSCRIM"] },
  { value: "CIT", label: "CIT", subs: ["BSIT", "ACT"] },
  { value: "CCJE", label: "CCJE", subs: ["BSCRIM"] },
  { value: "CBE", label: "CBE", subs: ["BSBA", "MARMA", "FINMA"] },
  { value: "CEAS", label: "CEAS", subs: ["BSED", "BEED", "AB"] },
]

export function getCourseOptions() {
  return COURSE_OPTIONS
}

export function getSubOptions(courseValue) {
  const course = COURSE_OPTIONS.find((c) => c.value === courseValue)
  return course ? course.subs : []
}

export function isValidCourse(value) {
  return COURSE_OPTIONS.some((c) => c.value === value)
}

export function isValidSubCourse(courseValue, subValue) {
  if (!subValue) return true
  const subs = getSubOptions(courseValue)
  return subs.length === 0 || subs.includes(subValue)
}

export function getAllCourseValues() {
  const values = []
  for (const c of COURSE_OPTIONS) {
    values.push(c.value)
    for (const s of c.subs) {
      values.push(s)
    }
  }
  return values
}

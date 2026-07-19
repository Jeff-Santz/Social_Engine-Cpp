// Idêntico ao helper `formatJoinDate` do index.html original.
export function formatJoinDate(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  } catch (e) {
    return dateStr
  }
}

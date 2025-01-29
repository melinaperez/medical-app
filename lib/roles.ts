export const ADMIN_EMAILS = ["meli.y.perez92@gmail.com", "daniel.l.piskorz@gmail.com", "gonzalopiskorz@gmail.com"]

export function isAdminEmail(email: string | null | undefined) {
  return email ? ADMIN_EMAILS.includes(email) : false
}

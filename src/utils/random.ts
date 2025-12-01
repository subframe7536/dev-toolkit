/**
 * Generate a unique ID for columns and rows
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

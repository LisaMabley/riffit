// Counts characters the way Postgres's char_length() does, which the text limit checks use: one
// per Unicode code point. JavaScript's `length` counts UTF-16 units instead, so it would count an
// emoji like 👗 as two.
export function characterCount(text: string): number {
  return Array.from(text).length;
}

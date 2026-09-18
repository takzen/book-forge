/**
 * Turns a book or chapter title into a safe ASCII filename stem.
 *
 * Polish titles lose their diacritics rather than every letter carrying one:
 * a plain `[^a-z0-9]` filter reduced "Książka" to "ksi-ka".
 */
const DIACRITICS: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
};

export function toFilenameStem(title: string, fallback = "book"): string {
  const stem = title
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (char) => DIACRITICS[char] ?? char)
    // Strip the combining marks left by decomposition (é → e, ü → u, …).
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return stem || fallback;
}

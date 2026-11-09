export function getWordHint(word: string): string {
  return word
    .split("")
    .map(() => "_")
    .join(" ");
}
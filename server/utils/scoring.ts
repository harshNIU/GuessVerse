/**
 * Scoring and Answer Normalization utilities
 */

export const SPEED_SCORE_TIERS = [1000, 800, 600, 400, 300, 200];

export function calculateScore(
  rank: number, // 1-indexed (1st, 2nd, etc.)
  currentStreak: number
): { points: number; streakBonus: number; total: number } {
  const index = Math.max(0, rank - 1);
  const basePoints = SPEED_SCORE_TIERS[index] ?? 200;

  let streakBonus = 0;
  if (currentStreak === 2) streakBonus = 50;
  else if (currentStreak === 3) streakBonus = 100;
  else if (currentStreak >= 4) streakBonus = 150;

  return {
    points: basePoints,
    streakBonus,
    total: basePoints + streakBonus,
  };
}

/**
 * Normalizes input text for resilient trivia matching.
 * Converts to lowercase, strips diacritics, bullets, punctuation,
 * collapses repeated whitespace, and trims leading/trailing space.
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[•·\-–—]/g, ' ') // remove bullets and hyphens
    .replace(/[.,\/#!$%\^&\*;:{}=\_`~()'"?]/g, ' ') // remove punctuation
    .replace(/\bthe\b/g, ' ') // remove common filler 'the'
    .replace(/\s+/g, ' ') // collapse multiple spaces into single space
    .trim();
}

/**
 * Levenshtein distance for typo forgiveness
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Check if a player's answer matches the target answer or any of its aliases
 */
export function checkAnswerCorrectness(
  userAnswer: string,
  primaryAnswer: string,
  aliases: string[] = []
): boolean {
  const cleanInput = normalizeString(userAnswer);
  if (!cleanInput) return false;

  const validTargets = [primaryAnswer, ...aliases].map(normalizeString);

  for (const target of validTargets) {
    if (!target) continue;

    // Exact match after normalization
    if (cleanInput === target) return true;

    // Direct subset matching for single word famous names (e.g. "Deepika" for "Deepika Padukone")
    const targetWords = target.split(' ');
    if (targetWords.length > 1 && cleanInput === targetWords[0] && targetWords[0].length >= 4) {
      return true;
    }

    // Number conversions (e.g., "3 idiots" vs "three idiots")
    const replacedNumTarget = target
      .replace(/\b1\b/g, 'one')
      .replace(/\b2\b/g, 'two')
      .replace(/\b3\b/g, 'three')
      .replace(/\b4\b/g, 'four');
    const replacedNumInput = cleanInput
      .replace(/\b1\b/g, 'one')
      .replace(/\b2\b/g, 'two')
      .replace(/\b3\b/g, 'three')
      .replace(/\b4\b/g, 'four');
    if (replacedNumInput === replacedNumTarget) return true;

    // Typo forgiveness (Levenshtein)
    // Only apply if the strings are long enough to avoid false positives
    if (target.length >= 6) {
      const distance = levenshteinDistance(cleanInput, target);
      if (distance <= 2) return true;
    }
  }

  return false;
}

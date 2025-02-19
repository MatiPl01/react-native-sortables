import type { Range } from '@/types';

const CATEGORIES = [
  'sports',
  'history',
  'science',
  'economics',
  'politics',
  'art',
  'music',
  'literature',
  'geography',
  'philosophy',
  'psychology',
  'biology',
  'chemistry',
  'physics',
  'mathematics',
  'computer science',
  'engineering',
  'medicine',
  'law',
  'business',
  'education',
  'sociology',
  'anthropology',
  'archaeology',
  'linguistics',
  'religion',
  'mythology',
  'technology',
  'environment',
  'health'
];

export function getCategories(count: Range<1, 30>): Array<string> {
  return CATEGORIES.slice(0, count);
}

export function getItems(count: number, prefix = 'Item'): Array<string> {
  return Array.from(
    { length: count },
    (_, i) => (prefix ? `${prefix} ` : '') + (i + 1)
  );
}

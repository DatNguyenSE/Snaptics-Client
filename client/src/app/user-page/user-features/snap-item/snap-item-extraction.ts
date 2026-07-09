import { CategoryDto } from '../../../models/category.dto';
import { SnapItemExtractionDto } from '../../../models/transaction-entry.dto';
import { matchCategoryName } from '../shared/transaction-entry/transaction-entry.utils';

interface SnapKeywordPattern {
  keywords: string[];
  itemName: string;
  category: string;
  baseAmount: number;
  note: string;
}

const SNAP_PATTERNS: SnapKeywordPattern[] = [
  {
    keywords: ['coffee', 'latte', 'tea', 'drink'],
    itemName: 'Coffee drink',
    category: 'Drinks',
    baseAmount: 42000,
    note: 'Suggested from the uploaded drink photo.',
  },
  {
    keywords: ['rice', 'noodle', 'meal', 'food', 'lunch', 'dinner'],
    itemName: 'Meal item',
    category: 'Food',
    baseAmount: 68000,
    note: 'Suggested from the uploaded meal photo.',
  },
  {
    keywords: ['headphone', 'keyboard', 'mouse', 'tech', 'cable', 'device'],
    itemName: 'Electronics item',
    category: 'Electronics',
    baseAmount: 185000,
    note: 'Suggested from the uploaded device photo.',
  },
  {
    keywords: ['soap', 'clean', 'detergent', 'bottle', 'house'],
    itemName: 'Household item',
    category: 'Household',
    baseAmount: 52000,
    note: 'Suggested from the uploaded household photo.',
  },
];

export function parseSnapItemAnalysis(
  response: unknown,
  categories: CategoryDto[],
): SnapItemExtractionDto | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const payload = response as Record<string, unknown>;
  const nestedItem =
    payload['item'] && typeof payload['item'] === 'object'
      ? (payload['item'] as Record<string, unknown>)
      : null;

  const itemName = getFirstString([
    payload['itemName'],
    payload['name'],
    payload['title'],
    payload['productName'],
    nestedItem?.['name'],
  ]);
  const estimatedAmount = getFirstNumber([
    payload['estimatedPriceVND'],
    payload['estimatedPriceVnd'],
    payload['EstimatedPriceVND'],
    payload['estimatedPrice'],
    payload['amount'],
    payload['price'],
    payload['totalAmount'],
    nestedItem?.['price'],
  ]);

  if (!itemName || estimatedAmount <= 0) {
    return null;
  }

  const category = matchCategoryName(
    getFirstString([payload['category'], payload['detectedCategory'], nestedItem?.['category']]),
    categories,
  );

  return {
    itemName,
    estimatedAmount,
    category,
    date:
      getFirstString([
        payload['transactionDate'],
        payload['date'],
        payload['capturedAt'],
        nestedItem?.['capturedAt'],
      ]) ?? new Date().toISOString(),
    note:
      getFirstString([payload['note'], payload['summary'], payload['description']]) ??
      'AI suggested this item from the uploaded image.',
  };
}

export function buildMockSnapItemExtraction(
  file: File,
  categories: CategoryDto[],
): SnapItemExtractionDto {
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const normalizedName = baseName.trim().toLowerCase();
  const matchedPattern = SNAP_PATTERNS.find((pattern) =>
    pattern.keywords.some((keyword) => normalizedName.includes(keyword)),
  );

  const readableName = humanizeName(baseName);
  const inferredItemName =
    matchedPattern?.itemName || (readableName.length > 0 ? readableName : 'Captured item');
  const estimatedAmount = estimateAmount(file.size, matchedPattern?.baseAmount ?? 36000);
  const category = matchCategoryName(matchedPattern?.category ?? inferCategory(normalizedName), categories);

  return {
    itemName: inferredItemName,
    estimatedAmount,
    category,
    date: new Date().toISOString(),
    note:
      matchedPattern?.note ??
      `Mock extraction prepared a draft from ${file.name}. Update anything before saving.`,
  };
}

function estimateAmount(fileSize: number, baseAmount: number): number {
  const variation = (Math.max(fileSize, 1) % 9) * 3500;
  return Math.max(12000, Math.round((baseAmount + variation) / 1000) * 1000);
}

function inferCategory(normalizedName: string): string {
  if (normalizedName.includes('ticket') || normalizedName.includes('ride')) {
    return 'Travel';
  }

  if (normalizedName.includes('snack') || normalizedName.includes('cake')) {
    return 'Food';
  }

  return 'Other';
}

function humanizeName(name: string): string {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getFirstString(values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function getFirstNumber(values: Array<unknown>): number {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsedValue = Number(value);
      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  return 0;
}

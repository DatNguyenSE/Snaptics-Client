import { CategoryDto } from '../../../models/category.dto';
import { SnapItemExtractionDto } from '../../../models/transaction-entry.dto';
import { matchCategoryName } from '../shared/transaction-entry/transaction-entry.utils';

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
      getFirstString([payload['note'], payload['summary'], payload['description']]) ?? '',
  };
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

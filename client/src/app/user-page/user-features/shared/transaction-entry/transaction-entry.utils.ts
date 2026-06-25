import { CategoryDto } from '../../../../models/category.dto';

export const FALLBACK_CATEGORIES: CategoryDto[] = [
  { id: 1, name: 'Food' },
  { id: 2, name: 'Drinks' },
  { id: 3, name: 'Travel' },
  { id: 4, name: 'Electronics' },
  { id: 5, name: 'Household' },
  { id: 6, name: 'Other' },
];

export const PAYMENT_METHOD_OPTIONS = [
  'Cash',
  'Debit Card',
  'Credit Card',
  'Bank Transfer',
  'E-Wallet',
] as const;

export function resolveCategories(categories: CategoryDto[] | null | undefined): CategoryDto[] {
  const cleanCategories = (categories ?? [])
    .filter((category) => category.name && category.name.toLowerCase() !== 'string')
    .map((category, index) => ({
      id: category.id ?? index + 1,
      name: category.name.trim(),
    }))
    .filter((category, index, items) =>
      items.findIndex((candidate) => candidate.name.toLowerCase() === category.name.toLowerCase()) ===
      index,
    );

  return cleanCategories.length > 0 ? cleanCategories : FALLBACK_CATEGORIES;
}

export function matchCategoryName(
  categoryName: string | null | undefined,
  categories: CategoryDto[],
): string {
  if (!categoryName) {
    return 'Other';
  }

  const normalizedName = categoryName.trim().toLowerCase();

  const matchedCategory = categories.find(
    (category) => category.name.trim().toLowerCase() === normalizedName,
  );

  return matchedCategory?.name ?? categoryName.trim();
}

export function getTodayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

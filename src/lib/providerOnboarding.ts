export const PROVIDER_ID_TYPES = [
  'cpf',
  'cnpj',
  'ssn',
  'drivers_license',
  'passport',
] as const;

export type ProviderIdType = (typeof PROVIDER_ID_TYPES)[number];

type ServiceCategoryName = {
  id: string;
  name_en: string;
  name_pt: string;
  name_es?: string;
};

const normalizeServiceName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const isBrazilTaxIdType = (idType: ProviderIdType) =>
  idType === 'cpf' || idType === 'cnpj';

export const isValidProviderIdNumber = (
  idType: ProviderIdType,
  rawValue: string | null | undefined,
) => {
  const value = rawValue?.trim() ?? '';
  const digits = value.replace(/\D/g, '');

  if (idType === 'cpf') return digits.length === 11;
  if (idType === 'cnpj') return digits.length === 14;
  if (idType === 'ssn') return digits.length === 9;

  return value.length >= 5 && value.length <= 32;
};

export const filterProviderServiceCategories = <
  DatabaseCategory extends ServiceCategoryName,
  CatalogCategory extends Omit<ServiceCategoryName, 'id'>,
>(
  databaseCategories: DatabaseCategory[],
  appCatalog: readonly CatalogCategory[],
) => {
  const allowedNames = new Set(
    appCatalog.flatMap((category) =>
      [category.name_en, category.name_pt, category.name_es]
        .filter((name): name is string => Boolean(name))
        .map(normalizeServiceName),
    ),
  );

  return databaseCategories.filter((category) =>
    [category.name_en, category.name_pt, category.name_es]
      .filter((name): name is string => Boolean(name))
      .some((name) => allowedNames.has(normalizeServiceName(name))),
  );
};

export const filterAllowedServiceIds = (
  selectedIds: string[],
  allowedCategories: readonly Pick<ServiceCategoryName, 'id'>[],
) => {
  const allowedIds = new Set(allowedCategories.map(({ id }) => id));
  return selectedIds.filter((id) => allowedIds.has(id));
};

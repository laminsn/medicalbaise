import assert from 'assert';
import { SERVICE_CATEGORIES } from './constants.ts';
import {
  PROVIDER_ID_TYPES,
  filterAllowedServiceIds,
  filterProviderServiceCategories,
  isValidProviderIdNumber,
} from './providerOnboarding.ts';

assert.deepEqual(PROVIDER_ID_TYPES, [
  'cpf',
  'cnpj',
  'ssn',
  'drivers_license',
  'passport',
]);
assert.equal(isValidProviderIdNumber('cpf', '123.456.789-01'), true);
assert.equal(isValidProviderIdNumber('cnpj', '12.345.678/0001-90'), true);
assert.equal(isValidProviderIdNumber('ssn', '123-45-6789'), true);

const sharedCatalog = [
  { id: 'home', name_en: 'Plumbing', name_pt: 'Encanamento' },
  { id: 'legal', name_en: 'Family Law', name_pt: 'Direito de Família' },
  { id: 'medical', name_en: 'Urology', name_pt: 'Urologia' },
  {
    id: 'medical-testimony',
    name_en: 'Medical Testimony & Expert Witness',
    name_pt: 'Perícia Médica e Testemunho Especializado',
  },
];

const allowed = filterProviderServiceCategories(sharedCatalog, SERVICE_CATEGORIES);

assert.deepEqual(
  allowed.map(({ id }) => id),
  ['medical', 'medical-testimony'],
);
assert.deepEqual(
  filterAllowedServiceIds(
    ['home', 'legal', 'medical', 'medical-testimony'],
    allowed,
  ),
  ['medical', 'medical-testimony'],
);

console.log('Medical provider onboarding taxonomy checks passed');

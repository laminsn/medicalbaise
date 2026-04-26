/**
 * PHI (Protected Health Information) detector for HIPAA compliance.
 * Scans text for patterns that may contain sensitive health information.
 */

const SSN_PATTERN = /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/;
const DOB_PATTERN = /\b(?:born|dob|birth|nascimento|nascido)[\s:]*\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4}\b/i;
const MEDICAL_RECORD_PATTERN = /\b(?:MRN|medical record|prontuário|registro médico)[\s:#]*[\w\d-]+\b/i;
const INSURANCE_PATTERN = /\b(?:insurance|seguro|policy|apólice)[\s:#]*[\w\d-]{6,}\b/i;
const PHONE_PATTERN = /\b(?:\+?1[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}\b/;

const SENSITIVE_CONDITIONS = [
  'hiv', 'aids', 'hepatitis', 'herpes', 'std', 'sti',
  'cancer', 'tumor', 'chemotherapy', 'radiation therapy',
  'diabetes', 'epilepsy', 'schizophrenia', 'bipolar',
  'depression', 'anxiety disorder', 'ptsd', 'adhd',
  'alzheimer', 'dementia', 'parkinson',
  'substance abuse', 'addiction', 'overdose',
  'pregnancy', 'abortion', 'miscarriage',
  'genetic test', 'dna test',
];

const SENSITIVE_CONDITIONS_PT = [
  'hiv', 'aids', 'hepatite', 'herpes', 'dst', 'ist',
  'câncer', 'tumor', 'quimioterapia', 'radioterapia',
  'diabetes', 'epilepsia', 'esquizofrenia', 'bipolar',
  'depressão', 'transtorno de ansiedade', 'tept', 'tdah',
  'alzheimer', 'demência', 'parkinson',
  'abuso de substâncias', 'dependência', 'overdose',
  'gravidez', 'aborto',
  'teste genético', 'teste de dna',
];

export interface PHIDetectionResult {
  hasPHI: boolean;
  detectedTypes: string[];
  message: string;
}

export function detectPHI(text: string): PHIDetectionResult {
  const detectedTypes: string[] = [];
  const lowerText = text.toLowerCase();

  if (SSN_PATTERN.test(text)) {
    detectedTypes.push('Social Security Number');
  }

  if (DOB_PATTERN.test(text)) {
    detectedTypes.push('Date of Birth');
  }

  if (MEDICAL_RECORD_PATTERN.test(text)) {
    detectedTypes.push('Medical Record Number');
  }

  if (INSURANCE_PATTERN.test(text)) {
    detectedTypes.push('Insurance Information');
  }

  if (PHONE_PATTERN.test(text)) {
    detectedTypes.push('Phone Number');
  }

  const allConditions = [...SENSITIVE_CONDITIONS, ...SENSITIVE_CONDITIONS_PT];
  const foundConditions = allConditions.filter(condition =>
    lowerText.includes(condition.toLowerCase())
  );
  if (foundConditions.length > 0) {
    detectedTypes.push('Medical Condition/Diagnosis');
  }

  const hasPHI = detectedTypes.length > 0;

  return {
    hasPHI,
    detectedTypes,
    message: hasPHI
      ? `Potential PHI detected: ${detectedTypes.join(', ')}. Please review before sending.`
      : '',
  };
}

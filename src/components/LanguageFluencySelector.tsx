import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const AVAILABLE_LANGUAGES = [
  { code: 'portuguese', labelEn: 'Portuguese', labelPt: 'Português', labelEs: 'Portugués' },
  { code: 'english', labelEn: 'English', labelPt: 'Inglês', labelEs: 'Inglés' },
  { code: 'spanish', labelEn: 'Spanish', labelPt: 'Espanhol', labelEs: 'Español' },
  { code: 'french', labelEn: 'French', labelPt: 'Francês', labelEs: 'Francés' },
  { code: 'german', labelEn: 'German', labelPt: 'Alemão', labelEs: 'Alemán' },
  { code: 'italian', labelEn: 'Italian', labelPt: 'Italiano', labelEs: 'Italiano' },
  { code: 'japanese', labelEn: 'Japanese', labelPt: 'Japonês', labelEs: 'Japonés' },
  { code: 'chinese', labelEn: 'Chinese', labelPt: 'Chinês', labelEs: 'Chino' },
];

interface LanguageFluencySelectorProps {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
  label?: string;
  description?: string;
}

export function LanguageFluencySelector({
  selectedLanguages,
  onLanguagesChange,
  label,
  description,
}: LanguageFluencySelectorProps) {
  const { t, i18n } = useTranslation();

  const toggleLanguage = (code: string) => {
    if (selectedLanguages.includes(code)) {
      onLanguagesChange(selectedLanguages.filter((l) => l !== code));
    } else {
      onLanguagesChange([...selectedLanguages, code]);
    }
  };

  const getLanguageLabel = (lang: typeof AVAILABLE_LANGUAGES[0]) => {
    const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
    const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
    if (isPt) return lang.labelPt;
    if (isEs) return lang.labelEs;
    return lang.labelEn;
  };

  return (
    <div className="space-y-3">
      {label && (
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {AVAILABLE_LANGUAGES.map((lang) => {
          const isSelected = selectedLanguages.includes(lang.code);
          return (
            <label
              key={lang.code}
              htmlFor={`lang-${lang.code}`}
              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Checkbox
                id={`lang-${lang.code}`}
                checked={isSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onLanguagesChange([...selectedLanguages, lang.code]);
                  } else {
                    onLanguagesChange(selectedLanguages.filter((l) => l !== lang.code));
                  }
                }}
              />
              <span className="text-sm">{getLanguageLabel(lang)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

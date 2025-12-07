import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const AVAILABLE_LANGUAGES = [
  { code: 'portuguese', labelEn: 'Portuguese', labelPt: 'Português' },
  { code: 'english', labelEn: 'English', labelPt: 'Inglês' },
  { code: 'spanish', labelEn: 'Spanish', labelPt: 'Espanhol' },
  { code: 'french', labelEn: 'French', labelPt: 'Francês' },
  { code: 'german', labelEn: 'German', labelPt: 'Alemão' },
  { code: 'italian', labelEn: 'Italian', labelPt: 'Italiano' },
  { code: 'japanese', labelEn: 'Japanese', labelPt: 'Japonês' },
  { code: 'chinese', labelEn: 'Chinese', labelPt: 'Chinês' },
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
    return i18n.language === 'pt' ? lang.labelPt : lang.labelEn;
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
        {AVAILABLE_LANGUAGES.map((lang) => (
          <div
            key={lang.code}
            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
              selectedLanguages.includes(lang.code)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => toggleLanguage(lang.code)}
          >
            <Checkbox
              checked={selectedLanguages.includes(lang.code)}
              onCheckedChange={() => toggleLanguage(lang.code)}
            />
            <span className="text-sm">{getLanguageLabel(lang)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

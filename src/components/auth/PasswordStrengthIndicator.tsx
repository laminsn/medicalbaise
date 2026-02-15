import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { validatePasswordStrength } from '@/lib/security';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { t } = useTranslation();
  const { score, checks } = validatePasswordStrength(password);

  if (!password) return null;

  const strengthLabel =
    score <= 1 ? t('security.weak') :
    score <= 2 ? t('security.fair') :
    score <= 3 ? t('security.good') :
    score <= 4 ? t('security.strong') :
    t('security.veryStrong');

  const strengthColor =
    score <= 1 ? 'bg-red-500' :
    score <= 2 ? 'bg-orange-500' :
    score <= 3 ? 'bg-yellow-500' :
    score <= 4 ? 'bg-blue-500' :
    'bg-green-500';

  const requirements = [
    { key: 'minLength', met: checks.minLength, label: t('security.minLength') },
    { key: 'hasUppercase', met: checks.hasUppercase, label: t('security.hasUppercase') },
    { key: 'hasLowercase', met: checks.hasLowercase, label: t('security.hasLowercase') },
    { key: 'hasDigit', met: checks.hasDigit, label: t('security.hasDigit') },
    { key: 'hasSpecial', met: checks.hasSpecial, label: t('security.hasSpecial') },
  ];

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{strengthLabel}</span>
      </div>

      {/* Requirement checklist */}
      <div className="grid grid-cols-1 gap-1">
        {requirements.map((req) => (
          <div key={req.key} className="flex items-center gap-1.5 text-xs">
            {req.met ? (
              <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
            ) : (
              <X className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
            <span className={req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { ShieldAlert, X } from 'lucide-react';
import { useState } from 'react';

export function PHINotificationBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            HIPAA Compliance Notice
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            A patient may have shared sensitive health information (PHI) in a recent message. Please ensure all PHI is handled in accordance with HIPAA guidelines. Do not share, forward, or store PHI outside of secure, authorized systems.
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

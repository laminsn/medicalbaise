import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PHIWarningModalProps {
  detectedTypes: string[];
  onEdit: () => void;
  onSendAnyway: () => void;
  onClose: () => void;
}

export function PHIWarningModal({ detectedTypes, onEdit, onSendAnyway, onClose }: PHIWarningModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl p-6 max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Sensitive Information Detected
          </h3>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Your message may contain Protected Health Information (PHI). Sharing PHI in public or unsecured channels may violate HIPAA regulations.
        </p>

        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 mb-4">
          <p className="text-xs font-medium text-destructive mb-1">Detected:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {detectedTypes.map((type) => (
              <li key={type}>• {type}</li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Please remove or redact sensitive information before sending, or confirm you understand the risks.
        </p>

        <div className="flex gap-3">
          <Button onClick={onEdit} className="flex-1">
            Edit Message
          </Button>
          <Button variant="outline" onClick={onSendAnyway} className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/5">
            Send Anyway
          </Button>
        </div>
      </div>
    </div>
  );
}

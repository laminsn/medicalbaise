import { ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';

export function HIPAADisclaimer() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('hipaa_disclaimer_accepted');
    if (!dismissed) setShow(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('hipaa_disclaimer_accepted', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-lg shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
          <h2 className="text-lg font-bold text-foreground">Healthcare Privacy Notice</h2>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground mb-6">
          <p>
            <strong className="text-foreground">Medical Baise is a healthcare professional marketplace.</strong> We connect patients with verified healthcare providers.
          </p>
          <p>
            For your protection, please be aware:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>This platform is <strong>not</strong> an Electronic Health Records (EHR) system</li>
            <li>Do not share sensitive health information (PHI) in public posts or social feed</li>
            <li>Private messages include PHI detection warnings for your safety</li>
            <li>Healthcare providers should maintain their own HIPAA-compliant record systems</li>
            <li>Appointment records on this platform are for scheduling purposes only</li>
          </ul>
          <p>
            Medical Baise complies with LGPD (Lei Geral de Proteção de Dados) and follows HIPAA best practices for data security. For questions about data handling, see our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </div>

        <button
          onClick={handleAccept}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}

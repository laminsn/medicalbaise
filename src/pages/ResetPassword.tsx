import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AlertTriangle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type RecoveryState = "checking" | "ready" | "invalid" | "saving" | "complete";

const APP_KEY = String(import.meta.env.VITE_BAISE_APP || "medical").toLowerCase();
const BRANDS = {
  casa: { name: "Casa Baise", securityEmail: "support@casabaise.com" },
  medical: { name: "Medical Baise", securityEmail: "support@mdbaise.com" },
  legal: { name: "Legal Baise", securityEmail: "support@legalbaise.com" },
} as const;
const brand = BRANDS[APP_KEY as keyof typeof BRANDS] || BRANDS.medical;

// Nobody should ever be stranded on the "checking" spinner.
const RECOVERY_TIMEOUT_MS = 12_000;

const getRecoveryIntent = () => {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return query.has("code") || query.has("token_hash") || query.get("type") === "recovery" || hash.get("type") === "recovery" || hash.has("access_token");
};

const hasProviderError = () => {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return query.has("error") || hash.has("error");
};

const ResetPassword = () => {
  const recoveryIntent = useRef(getRecoveryIntent());
  const [state, setState] = useState<RecoveryState>("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  const passwordChecks = useMemo(() => ({
    length: password.length >= 8,
    letter: /[a-z]/i.test(password),
    number: /\d/.test(password),
    match: password.length > 0 && password === confirmation,
  }), [confirmation, password]);
  const passwordIsValid = Object.values(passwordChecks).every(Boolean);

  useEffect(() => {
    let active = true;
    let settled = false;
    let recoveryEventReceived = false;
    const providerError = hasProviderError();
    if (providerError) {
      setError("This secure reset link is invalid or has expired.");
      setState("invalid");
      return undefined;
    }

    // getSession() can go to the network on a PKCE recovery link. If it never
    // settles the page sits on the spinner forever with no way out, so fail to
    // a state the user can act on instead.
    const timer = setTimeout(() => {
      if (!active || settled) return;
      settled = true;
      setError("We could not verify this reset link in time. Request a fresh one to continue.");
      setState("invalid");
    }, RECOVERY_TIMEOUT_MS);

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event !== "PASSWORD_RECOVERY" || !session) return;
      recoveryEventReceived = true;
      recoveryIntent.current = true;
      settled = true;
      clearTimeout(timer);
      setEmail(session.user.email || "");
      setState("ready");
    });

    const resolveRecoverySession = async () => {
      if (!recoveryIntent.current) {
        settled = true;
        clearTimeout(timer);
        setState("invalid");
        return;
      }
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active || settled || recoveryEventReceived) return;
      settled = true;
      clearTimeout(timer);
      if (sessionError || !data.session) {
        setError("This secure reset link is invalid or has expired.");
        setState("invalid");
        return;
      }
      setEmail(data.session.user.email || "");
      setState("ready");
    };
    void resolveRecoverySession();
    return () => {
      active = false;
      settled = true;
      clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!passwordIsValid) {
      setError("Please complete every password requirement.");
      return;
    }
    setState("saving");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("We could not update the password. Request a fresh link and try again.");
      setState("ready");
      return;
    }
    await supabase.auth.signOut({ scope: "global" });
    setPassword("");
    setConfirmation("");
    setState("complete");
  };

  return (
    <>
      <Helmet>
        <title>Reset password | {brand.name}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent" />
        <div className="pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-lg items-center">
          <section className="w-full rounded-3xl border border-border/70 bg-card/95 p-6 shadow-2xl shadow-black/10 backdrop-blur sm:p-9">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <LockKeyhole className="h-8 w-8" aria-hidden="true" />
              </div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">{brand.name}</p>
              <h1 className="text-3xl font-bold tracking-tight">{t('authFlow.createANewPassword', "Create a new password")}</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{t('authFlow.protectYourAccountWith', "Protect your account with a strong password you have not used before.")}</p>
            </div>

            {state === "checking" && <div className="flex flex-col items-center gap-3 py-10 text-center" role="status"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><p className="font-medium">{t('authFlow.verifyingYourSecureReset', "Verifying your secure reset link…")}</p></div>}

            {state === "invalid" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-center">
                  <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" aria-hidden="true" />
                  <h2 className="font-semibold">{t('authFlow.thisResetLinkIs', "This reset link is invalid or has expired")}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('authFlow.resetLinksAreSingle', "Reset links are single-use and time-limited. Request a fresh one to continue safely.")}</p>
                  {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
                </div>
                <Button asChild size="lg" className="h-12 w-full rounded-xl"><Link to="/auth">{t('authFlow.requestANewReset', "Request a new reset link")}</Link></Button>
              </div>
            )}

            {(state === "ready" || state === "saving") && (
              <form className="space-y-5" onSubmit={handleSubmit}>
                {email && <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">{t('authFlow.resettingThePasswordFor', "Resetting the password for")}<span className="font-semibold">{email}</span></div>}
                <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} disabled={state === "saving"} />
                <PasswordField id="confirm-password" label="Confirm new password" value={confirmation} onChange={setConfirmation} visible={showConfirmation} onToggle={() => setShowConfirmation((value) => !value)} disabled={state === "saving"} />
                <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <PasswordCheck valid={passwordChecks.length}>{t('authFlow.atLeastCharacters', "At least 8 characters")}</PasswordCheck>
                  <PasswordCheck valid={passwordChecks.letter}>{t('authFlow.containsALetter', "Contains a letter")}</PasswordCheck>
                  <PasswordCheck valid={passwordChecks.number}>{t('authFlow.containsANumber', "Contains a number")}</PasswordCheck>
                  <PasswordCheck valid={passwordChecks.match}>{t('authFlow.passwordsMatch', "Passwords match")}</PasswordCheck>
                </ul>
                {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{error}</p>}
                <Button type="submit" size="lg" className="h-12 w-full rounded-xl text-base" disabled={!passwordIsValid || state === "saving"}>
                  {state === "saving" ? <><Loader2 className="animate-spin" aria-hidden="true" />{t('authFlow.securingYourAccount', "Securing your account…")}</> : <><ShieldCheck aria-hidden="true" />{t('authFlow.saveNewPassword', "Save new password")}</>}
                </Button>
              </form>
            )}

            {state === "complete" && (
              <div className="space-y-6 text-center">
                <div className="rounded-2xl border border-primary/30 bg-primary/10 p-6">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" aria-hidden="true" />
                  <h2 className="text-xl font-bold">{t('authFlow.yourPasswordIsSecure', "Your password is secure and updated")}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('authFlow.forYourProtectionOther', "For your protection, other sessions were signed out. You can now sign in with your new password.")}</p>
                </div>
                <Button asChild size="lg" className="h-12 w-full rounded-xl"><Link to="/auth">{t('authFlow.continueToSignIn', "Continue to sign in")}</Link></Button>
              </div>
            )}

            <div className="mt-7 border-t border-border pt-5">
              <div className="flex gap-3 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <p>{t('authFlow.didnTRequestThis', "Didn&apos;t request this? Do not reuse the link. Contact")} <a className="font-semibold text-primary hover:underline" href={`mailto:${brand.securityEmail}`}>{brand.securityEmail}</a> so our team can help protect your account.</p>
              </div>
              <Button asChild variant="ghost" className="mt-4 w-full"><Link to="/auth"><ArrowLeft aria-hidden="true" />{t('authFlow.backToSignIn', "Back to sign in")}</Link></Button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

const PasswordField = ({ id, label, value, onChange, visible, onToggle, disabled }: {
  id: string; label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; disabled: boolean;
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-semibold">{label}</label>
    <div className="relative">
      <Input id={id} type={visible ? "text" : "password"} autoComplete="new-password" value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl pr-12" disabled={disabled} required />
      <button type="button" onClick={onToggle} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={visible ? "Hide password" : "Show password"}>
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </div>
  </div>
);

const PasswordCheck = ({ valid, children }: { valid: boolean; children: React.ReactNode }) => (
  <li className={valid ? "flex items-center gap-2 text-primary" : "flex items-center gap-2"}>
    <span className={`h-2 w-2 rounded-full ${valid ? "bg-primary" : "bg-muted-foreground/40"}`} aria-hidden="true" />
    {children}
  </li>
);

export default ResetPassword;

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type RecoveryState = "checking" | "ready" | "invalid" | "saving" | "complete";

const hasRecoveryIntent = () => {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return query.has("code") || query.has("token_hash") || query.get("type") === "recovery"
    || hash.get("type") === "recovery" || hash.has("access_token");
};

const ResetPassword = () => {
  const recoveryIntent = useRef(hasRecoveryIntent());
  const [state, setState] = useState<RecoveryState>("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [codeEmail, setCodeEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  const checks = useMemo(() => ({
    length: password.length >= 8,
    letter: /[a-z]/i.test(password),
    number: /\d/.test(password),
    match: password.length > 0 && password === confirmation,
  }), [confirmation, password]);
  const passwordIsValid = Object.values(checks).every(Boolean);

  useEffect(() => {
    let active = true;
    let recoverySessionReceived = false;
    let invalidTimer: ReturnType<typeof setTimeout> | undefined;
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    if (query.has("error") || hash.has("error") || !recoveryIntent.current) {
      setState("invalid");
      return undefined;
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || !session) return;
      if (!["PASSWORD_RECOVERY", "SIGNED_IN", "INITIAL_SESSION", "TOKEN_REFRESHED"].includes(event)) return;
      recoverySessionReceived = true;
      if (invalidTimer) clearTimeout(invalidTimer);
      setState("ready");
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active || recoverySessionReceived) return;
      if (!sessionError && data.session) {
        recoverySessionReceived = true;
        setState("ready");
        return;
      }

      invalidTimer = setTimeout(() => {
        void supabase.auth.getSession().then(({ data: retryData, error: retryError }) => {
          if (!active || recoverySessionReceived) return;
          setState(!retryError && retryData.session ? "ready" : "invalid");
        });
      }, 4000);
    });

    return () => {
      active = false;
      if (invalidTimer) clearTimeout(invalidTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  const verifyRecoveryCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const email = codeEmail.trim().toLowerCase();
    const token = recoveryCode.replace(/\s+/g, "");
    if (!email || !token) {
      setError("Enter the account email and one-time code from your security email.");
      return;
    }

    setCodeLoading(true);
    const { data, error: verificationError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });
    setCodeLoading(false);

    if (verificationError || !data.session) {
      setError("That code is invalid or expired. Request a fresh security email and try again.");
      return;
    }
    setState("ready");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
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
        <title>Reset password | MD Baise</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <main className="min-h-screen bg-background px-4 py-10 text-foreground">
        <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg items-center">
          <div className="w-full rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-9">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <LockKeyhole className="h-8 w-8" />
              </div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">MD Baise</p>
              <h1 className="text-3xl font-bold">Create a new password</h1>
              <p className="mt-3 text-sm text-muted-foreground">Choose a strong password you have not used before.</p>
            </div>

            {state === "checking" && (
              <div className="flex flex-col items-center gap-3 py-10" role="status">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Verifying your secure reset link…</p>
              </div>
            )}

            {state === "invalid" && (
              <div className="space-y-6">
                <div className="space-y-3 text-center">
                  <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
                  <h2 className="text-xl font-semibold">This reset link is invalid or opened on another device</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter the one-time code from your MD Baise security email, or request a fresh link.
                  </p>
                </div>
                <form className="space-y-4" onSubmit={verifyRecoveryCode}>
                  <label className="block space-y-2 text-sm font-semibold">
                    <span>Account email</span>
                    <Input type="email" autoComplete="email" value={codeEmail} onChange={(event) => setCodeEmail(event.target.value)} placeholder="you@example.com" required />
                  </label>
                  <label className="block space-y-2 text-sm font-semibold">
                    <span>One-time code</span>
                    <Input inputMode="numeric" autoComplete="one-time-code" value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} placeholder="Enter the code from your email" required />
                  </label>
                  {error && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
                  <Button type="submit" className="w-full" disabled={codeLoading}>
                    {codeLoading ? <><Loader2 className="animate-spin" />Verifying code…</> : "Verify security code"}
                  </Button>
                </form>
                <Button asChild className="w-full" variant="outline"><Link to="/auth">Request a new reset link</Link></Button>
              </div>
            )}

            {(state === "ready" || state === "saving") && (
              <form className="space-y-5" onSubmit={submit}>
                <PasswordField label="New password" value={password} setValue={setPassword} visible={showPassword} toggle={() => setShowPassword((value) => !value)} />
                <PasswordField label="Confirm new password" value={confirmation} setValue={setConfirmation} visible={showConfirmation} toggle={() => setShowConfirmation((value) => !value)} />
                <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <Check valid={checks.length}>At least 8 characters</Check>
                  <Check valid={checks.letter}>Contains a letter</Check>
                  <Check valid={checks.number}>Contains a number</Check>
                  <Check valid={checks.match}>Passwords match</Check>
                </ul>
                {error && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
                <Button type="submit" className="h-12 w-full" disabled={!passwordIsValid || state === "saving"}>
                  {state === "saving" ? <><Loader2 className="animate-spin" />Securing your account…</> : <><ShieldCheck />Save new password</>}
                </Button>
              </form>
            )}

            {state === "complete" && (
              <div className="space-y-5 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
                <h2 className="text-xl font-semibold">Your password is secure and updated</h2>
                <p className="text-sm text-muted-foreground">Other sessions were signed out. You can now sign in with your new password.</p>
                <Button asChild className="w-full"><Link to="/auth">Continue to sign in</Link></Button>
              </div>
            )}

            <div className="mt-7 border-t border-border pt-5 text-sm text-muted-foreground">
              Didn&apos;t request this? Do not reuse the link. Contact{" "}
              <a className="font-semibold text-primary" href="mailto:support@mdbaise.com">support@mdbaise.com</a>.
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

const PasswordField = ({ label, value, setValue, visible, toggle }: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  visible: boolean;
  toggle: () => void;
}) => (
  <label className="block space-y-2 text-sm font-semibold">
    <span>{label}</span>
    <span className="relative block">
      <Input type={visible ? "text" : "password"} autoComplete="new-password" value={value} onChange={(event) => setValue(event.target.value)} className="h-12 pr-12" required />
      <button type="button" onClick={toggle} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground" aria-label={visible ? "Hide password" : "Show password"}>
        {visible ? <EyeOff /> : <Eye />}
      </button>
    </span>
  </label>
);

const Check = ({ valid, children }: { valid: boolean; children: React.ReactNode }) => (
  <li className={valid ? "text-primary" : ""}>• {children}</li>
);

export default ResetPassword;

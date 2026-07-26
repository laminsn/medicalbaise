import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FileLock2, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type ClaimState = "sign-in" | "error";

const InvoiceAccess = () => {
  const { token = "" } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<ClaimState>("sign-in");
  const [message, setMessage] = useState("");
  const tokenIsValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token);
  const isClaiming = !loading && Boolean(user) && tokenIsValid && state !== "error";
  const returnPath = useMemo(() => `/invoice/${encodeURIComponent(token)}`, [token]);
  const authPath = `/auth?redirect=${encodeURIComponent(returnPath)}`;

  useEffect(() => {
    if (loading || !user) return;
    if (!tokenIsValid) return;

    let active = true;
    void supabase.functions.invoke("claim-invoice-invite", {
      body: { token },
    }).then(({ data, error }) => {
      if (!active) return;
      if (error || !data?.redirectTo) {
        setMessage("We could not open this invoice. Sign in with the invited email or request a fresh invoice link.");
        setState("error");
        return;
      }
      navigate(data.redirectTo, { replace: true });
    });
    return () => {
      active = false;
    };
  }, [loading, navigate, token, tokenIsValid, user]);

  return (
    <>
      <Helmet>
        <title>Secure invoice access | MD Baise</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <main className="min-h-screen bg-background px-4 py-10 text-foreground">
        <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg items-center">
          <div className="w-full rounded-3xl border border-border bg-card p-6 text-center shadow-2xl sm:p-9">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <FileLock2 className="h-8 w-8" />
            </div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">MD Baise</p>
            <h1 className="text-3xl font-bold">Secure invoice access</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Invoice details and payment controls are available only to the invited client after secure account verification.
            </p>

            {(loading || isClaiming) && (
              <div className="mt-8 flex items-center justify-center gap-3" role="status">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>{loading ? "Checking your account…" : "Opening your invoice…"}</span>
              </div>
            )}

            {!loading && !user && (
              <div className="mt-8 space-y-3">
                <Button asChild className="h-12 w-full"><Link to={authPath}>Sign in to open invoice</Link></Button>
                <Button asChild className="h-12 w-full" variant="outline"><Link to={`${authPath}&mode=signup`}>Create account</Link></Button>
              </div>
            )}

            {(!tokenIsValid || state === "error") && (
              <div className="mt-8 space-y-4">
                <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                  {tokenIsValid ? message : "This secure invoice invitation is invalid or has expired."}
                </p>
                <Button asChild className="w-full" variant="outline"><Link to={authPath}>Use a different account</Link></Button>
              </div>
            )}

            <div className="mt-8 flex items-start gap-3 border-t border-border pt-5 text-left text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p>MD Baise never places full invoice details or payment controls in an unauthenticated email or public page.</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default InvoiceAccess;

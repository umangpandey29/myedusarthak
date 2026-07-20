import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { recordLogin } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Login — MyEduSarthak" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await recordLogin();
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        await recordLogin();
      }
      navigate({ to: "/" });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true); setErr(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (!result.redirected) navigate({ to: "/" });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden hero-grad">
      {/* ambient glow orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="glass-strong rounded-3xl p-8 sm:p-10 glow">
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 rounded-2xl primary-grad flex items-center justify-center mb-4 glow">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gradient tracking-tight">MyEduSarthak</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {mode === "signin" ? "Welcome back — sign in to continue" : "Create your teacher account"}
            </p>
          </div>

          <Button
            type="button"
            onClick={google}
            disabled={busy}
            variant="outline"
            className="w-full mb-5 h-11 bg-white/5 border-white/10 text-foreground hover:bg-white/10 hover:text-foreground"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="inline-flex items-center gap-2">
                <GoogleIcon /> Continue with Google
              </span>
            )}
          </Button>

          <div className="flex items-center gap-3 mb-5 text-[11px] uppercase tracking-widest text-muted-foreground">
            <div className="flex-1 h-px bg-white/10" /> or <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="h-11 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/60"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Password</Label>
                {mode === "signin" && (
                  <Link to="/forgot-password" className="text-[11px] text-primary hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/60"
              />
            </div>

            {err && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {err}
              </div>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="w-full h-11 primary-grad text-white font-medium hover:opacity-95 border-0 glow"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {mode === "signin" ? "Sign In" : "Create Account"}
                </span>
              )}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground mt-6">
            {mode === "signin" ? (
              <>New here?{" "}
                <button onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">
                  Create an account
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="text-primary hover:underline font-medium">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-5">
          Premium report card platform for modern educators
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-1.9 13.3-5l-6.2-5.1c-2 1.5-4.5 2.4-7.1 2.4-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.2 5.1c-.4.4 6.6-4.8 6.6-14.5 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

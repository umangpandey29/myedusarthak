import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { deleteOwnAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Account Settings — MyEduSarthak" },
      { name: "description", content: "Manage your MyEduSarthak account and permanent account deletion." },
      { property: "og:title", content: "Account Settings — MyEduSarthak" },
      { property: "og:description", content: "Manage your MyEduSarthak account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SettingsPage() {
  const { user } = useAuth();
  const deleteAccount = useServerFn(deleteOwnAccount);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [warningOpen, setWarningOpen] = useState(false);
  const [finalOpen, setFinalOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const permanentlyDelete = async () => {
    if (confirmation !== "DELETE" || busy) return;
    setBusy(true);
    setError(null);

    try {
      await deleteAccount({ data: { confirmation: "DELETE" } });
      await supabase.auth.signOut({ scope: "local" });
      queryClient.clear();
      setFinalOpen(false);
      await navigate({ to: "/login" });
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Account deletion failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-10 min-w-0 max-w-[1400px] mx-auto w-full">
        <div className="mb-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[11px] uppercase tracking-[0.15em] mb-3">
            <ShieldAlert className="w-3 h-3 text-primary" /> Account
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account.</p>
          {user?.email && <p className="text-xs text-muted-foreground mt-2">Signed in as {user.email}</p>}
        </div>

        <section aria-labelledby="danger-zone-title" className="max-w-3xl border border-destructive/30 bg-destructive/5 rounded-xl p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="danger-zone-title" className="text-lg font-semibold">Permanently delete account</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your account, teacher profile, reports, and analytics history will be permanently removed. This cannot be undone.
              </p>
              {error && <p role="alert" className="text-sm text-destructive mt-3">{error}</p>}
              <Button
                type="button"
                variant="destructive"
                className="mt-5"
                onClick={() => { setError(null); setWarningOpen(true); }}
              >
                <Trash2 className="w-4 h-4" /> Delete account
              </Button>
            </div>
          </div>
        </section>
      </main>

      <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes your sign-in, teacher analytics entry, saved cloud reports, and profile data.
              You will not be able to recover them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                setWarningOpen(false);
                setConfirmation("");
                setFinalOpen(true);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={finalOpen} onOpenChange={(open) => { setFinalOpen(open); if (!open) setConfirmation(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm permanent deletion</DialogTitle>
            <DialogDescription>
              To confirm, type <span className="font-semibold text-foreground">DELETE</span> below. This action cannot be reversed.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoComplete="off"
            autoFocus
            aria-label="Type DELETE to confirm account deletion"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="DELETE"
            disabled={busy}
          />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setFinalOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" disabled={confirmation !== "DELETE" || busy} onClick={permanentlyDelete}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Permanently delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
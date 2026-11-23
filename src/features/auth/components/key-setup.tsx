import { m } from "@/paraglide/messages.js";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createVault, loadVault, MIN_PASSWORD, unlockVault, type Vault } from "@/features/results/crypto";

function Field({ id, label, ...props }: { id: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} dir="ltr" {...props} />
    </div>
  );
}

/** Signing in: the username and password open the admin vault. */
function SignInForm({ vault }: { vault: Vault }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const ok = await unlockVault(vault, username, password, remember);
    setBusy(false);
    if (ok) navigate({ to: "/" });
    else toast.error(m.login_wrong());
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={submit}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">{m.login_title()}</h1>
        <p className="text-sm text-balance text-muted-foreground">{m.login_description()}</p>
      </div>
      <Field
        id="username"
        label={m.login_username()}
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <Field
        id="password"
        label={m.login_password()}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Label className="flex items-center gap-2 font-normal">
        <Checkbox checked={remember} onCheckedChange={(value) => setRemember(value === true)} />
        {m.login_remember()}
      </Label>
      <Button type="submit" disabled={busy}>
        {busy && <LoaderCircle className="animate-spin" />}
        {m.login_submit()}
      </Button>
    </form>
  );
}

/** The first visit, before the site has a vault: pick the username and password, then send the vault to be added. */
function SetupForm() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [vault, setVault] = useState<Vault | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD) {
      toast.error(m.setup_password_short({ count: String(MIN_PASSWORD) }));
      return;
    }
    if (password !== repeat) {
      toast.error(m.setup_password_mismatch());
      return;
    }
    setBusy(true);
    try {
      setVault(await createVault(username, password));
    } finally {
      setBusy(false);
    }
  };

  if (vault) {
    const text = JSON.stringify(vault);
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{m.setup_done_title()}</h1>
        <p className="text-sm text-muted-foreground">{m.setup_done_body()}</p>
        <Textarea dir="ltr" readOnly value={text} className="h-32 font-mono text-xs" />
        <Button
          variant="outline"
          onClick={() => navigator.clipboard.writeText(text).then(() => toast.success(m.key_copied()))}
        >
          <Copy />
          {m.setup_copy()}
        </Button>
        <Button onClick={() => navigate({ to: "/" })}>{m.setup_enter()}</Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={submit}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">{m.setup_title()}</h1>
        <p className="text-sm text-balance text-muted-foreground">{m.setup_description()}</p>
      </div>
      <Field
        id="username"
        label={m.login_username()}
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <Field
        id="password"
        label={m.login_password()}
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Field
        id="repeat"
        label={m.setup_repeat()}
        type="password"
        autoComplete="new-password"
        value={repeat}
        onChange={(e) => setRepeat(e.target.value)}
        required
      />
      <Alert>
        <AlertTitle>{m.setup_warning_title()}</AlertTitle>
        <AlertDescription>{m.setup_warning({ count: String(MIN_PASSWORD) })}</AlertDescription>
      </Alert>
      <Button type="submit" disabled={busy}>
        {busy && <LoaderCircle className="animate-spin" />}
        {m.setup_submit()}
      </Button>
    </form>
  );
}

/** The login page's body: sign in, or set the admin account up the first time. */
export function KeySetup() {
  const vault = useQuery({ queryKey: ["admin-vault"], queryFn: loadVault, staleTime: Infinity });
  if (vault.isPending) return <LoaderCircle className="mx-auto animate-spin text-muted-foreground" />;
  return vault.data ? <SignInForm vault={vault.data} /> : <SetupForm />;
}

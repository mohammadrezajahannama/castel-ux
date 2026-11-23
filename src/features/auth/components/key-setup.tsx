import { m } from "@/paraglide/messages.js";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, Download, FileKey, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialogButton } from "@/components/confirm-dialog-button";
import { createKeyFile, downloadKeyFile, type KeyFile, publicKeyConfig, saveKeyFile } from "@/features/results/crypto";

/** The public key, to copy into the test pages' config. */
export function PublicKeyBox({ file }: { file: KeyFile }) {
  const text = publicKeyConfig(file);
  return (
    <div className="grid gap-2">
      <Label htmlFor="public-key">
        {m.key_public_label()} · {m.key_id()}: <code dir="ltr">{file.kid}</code>
      </Label>
      <Textarea id="public-key" dir="ltr" readOnly value={text} className="h-28 font-mono text-xs" />
      <Button
        variant="outline"
        onClick={() => navigator.clipboard.writeText(text).then(() => toast.success(m.key_copied()))}
      >
        <Copy />
        {m.key_copy()}
      </Button>
    </div>
  );
}

/** The login page's body: load the key from its backup file, or create the key the first time. */
export function KeySetup() {
  const navigate = useNavigate();
  const [created, setCreated] = useState<KeyFile | null>(null);

  const loadFile = async (file?: File) => {
    if (!file) return;
    try {
      saveKeyFile(await file.text());
      navigate({ to: "/" });
    } catch {
      toast.error(m.key_bad_file());
    }
  };

  const create = async () => {
    const file = await createKeyFile();
    downloadKeyFile(file);
    saveKeyFile(JSON.stringify(file));
    setCreated(file);
  };

  if (created) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{m.key_created_title()}</h1>
        <p className="text-sm text-muted-foreground">{m.key_created_body()}</p>
        <PublicKeyBox file={created} />
        <Button variant="ghost" onClick={() => downloadKeyFile(created)}>
          <Download />
          {m.key_download_again()}
        </Button>
        <Button onClick={() => navigate({ to: "/" })}>{m.key_enter()}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">{m.key_title()}</h1>
        <p className="text-sm text-balance text-muted-foreground">{m.key_intro()}</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="key-file">{m.key_load()}</Label>
        <label
          htmlFor="key-file"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          <FileKey className="size-4" />
          {m.key_load()}
        </label>
        <input
          id="key-file"
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={(event) => loadFile(event.target.files?.[0])}
        />
        <p className="text-xs text-muted-foreground">{m.key_load_hint()}</p>
      </div>

      <Alert>
        <KeyRound />
        <AlertTitle>{m.key_create()}</AlertTitle>
        <AlertDescription>{m.key_create_warning()}</AlertDescription>
      </Alert>
      <ConfirmDialogButton
        variant="outline"
        title={m.key_create()}
        titleDialog={m.key_create()}
        descriptionDialog={m.key_create_warning()}
        onOk={create}
      />
    </div>
  );
}

import { m } from "@/paraglide/messages.js";
import { createFileRoute } from "@tanstack/react-router";
import { Download, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialogButton } from "@/components/confirm-dialog-button";
import { PublicKeyBox } from "@/features/auth/components/key-setup";
import { logout } from "@/features/auth/session";
import { downloadKeyFile, getKeyFile } from "@/features/results/crypto";

export const Route = createFileRoute("/_main/key")({
  staticData: { title: m.key_title },
  head: () => ({ meta: [{ title: `${m.key_title()} · ${m.app_name()}` }] }),
  component: KeyPage,
});

function KeyPage() {
  const file = getKeyFile();
  if (!file) return null;
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">{m.key_title()}</h1>
        <p className="text-sm text-muted-foreground">{m.key_intro()}</p>
      </div>
      <PublicKeyBox file={file} />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => downloadKeyFile(file)}>
          <Download />
          {m.key_download_again()}
        </Button>
        <ConfirmDialogButton
          variant="outline"
          className="text-destructive hover:text-destructive"
          icon={LogOut}
          title={m.key_forget()}
          titleDialog={m.key_forget()}
          descriptionDialog={m.key_forget_confirm()}
          okVariant="destructive"
          onOk={logout}
        />
      </div>
    </div>
  );
}

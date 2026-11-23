import { m } from "@/paraglide/messages.js";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useImportCodes } from "@/features/results/services";

/** Adds results that testers sent by hand: their files, or codes pasted from a message. */
export function ImportForm({ onClose }: { onClose: () => void }) {
  const importCodes = useImportCodes();
  const [files, setFiles] = useState<File[]>([]);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const texts = [...(await Promise.all(files.map((file) => file.text()))), pasted];
    if (!files.length && !pasted.trim()) {
      toast.error(m.results_import_empty());
      return;
    }
    setBusy(true);
    try {
      const { added } = await importCodes(texts);
      if (added) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{m.results_import_title()}</DialogTitle>
        <DialogDescription>{m.results_import_hint()}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="import-files">{m.results_import_files()}</Label>
        <input
          id="import-files"
          type="file"
          multiple
          accept=".txt,text/plain"
          className="text-sm file:me-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5"
          onChange={(event) => setFiles([...(event.target.files ?? [])])}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="import-paste">{m.results_import_paste()}</Label>
        <Textarea
          id="import-paste"
          dir="ltr"
          className="h-28 font-mono text-xs"
          value={pasted}
          onChange={(event) => setPasted(event.target.value)}
        />
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>{m.cancel()}</DialogClose>
        <Button onClick={submit} disabled={busy}>
          {m.results_import_submit()}
        </Button>
      </DialogFooter>
    </div>
  );
}

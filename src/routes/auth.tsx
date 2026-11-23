import { m } from "@/paraglide/messages.js";
import { FlaskConical } from "lucide-react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { KeySetup } from "@/features/auth/components/key-setup";
import { isLoggedIn } from "@/features/auth/session";

export const Route = createFileRoute("/auth")({
  // Already holding the key: nothing to do here.
  beforeLoad: () => {
    if (isLoggedIn()) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: `${m.key_title()} · ${m.app_name()}` }] }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col gap-4 p-6 md:p-10">
      <div className="flex items-center gap-2 font-medium">
        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <FlaskConical className="size-4" />
        </div>
        {m.app_name()}
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm">
          <KeySetup />
        </div>
      </div>
    </div>
  );
}

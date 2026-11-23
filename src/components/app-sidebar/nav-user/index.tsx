import { m } from "@/paraglide/messages.js";
import { ChevronsUpDown, KeyRound, LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

import { ThemeSwitcher } from "@/components/app-sidebar/nav-user/theme-switcher";
import { LocaleSelect } from "@/components/app-sidebar/nav-user/locale-select";
import { getSessionKid } from "@/features/results/crypto";
import { logout } from "@/features/auth/session";

function UserSummary() {
  const kid = getSessionKid();
  return (
    <>
      <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-accent">
        <KeyRound className="size-4" />
      </div>
      <div className="grid flex-1 text-start text-sm leading-tight">
        <span className="truncate font-medium">{m.admin_panel()}</span>
        <span className="truncate text-xs" dir="ltr">
          {m.key_id()}: {kid}
        </span>
      </div>
    </>
  );
}

export function NavUser() {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <UserSummary />
            <ChevronsUpDown className="ms-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "inline-end"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2 p-1.5 font-normal">
                <UserSummary />
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <LocaleSelect />

            <DropdownMenuSeparator />

            <ThemeSwitcher />

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={logout}>
                <LogOut />
                {m.logout()}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

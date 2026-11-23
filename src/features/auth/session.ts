import { forgetKey, hasKey } from "@/features/results/crypto";

// There is one admin, and no server: being "logged in" means this browser holds the admin's private key, which is
// what opens the results (see features/results/crypto.ts).

export const isLoggedIn = () => hasKey();

let onLogout = () => {};

/** src/router.tsx sets this: clear the old session's cached data and go to the login page. */
export const setLogoutHandler = (handler: () => void) => {
  onLogout = handler;
};

/** Removes the key from this browser. Coming back in needs the backup file. */
export const logout = () => {
  forgetKey();
  onLogout();
};

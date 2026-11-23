import { forgetKey, hasKey } from "@/features/results/crypto";

// There is one admin, and no server: being "logged in" means the username and password opened the admin vault, and
// this tab holds the private key that opens the results (see features/results/crypto.ts).

export const isLoggedIn = () => hasKey();

let onLogout = () => {};

/** src/router.tsx sets this: clear the old session's cached data and go to the login page. */
export const setLogoutHandler = (handler: () => void) => {
  onLogout = handler;
};

/** Forgets the private key in this tab and browser. */
export const logout = () => {
  forgetKey();
  onLogout();
};

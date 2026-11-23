/* Site settings shared by every test page. */

// The admin's Bale ID that testers send the result file to when automatic sending fails, e.g. "@castel_ux".
// Empty: "the person who sent you the link".
window.UX_CONTACT = "";

// The private repo that receives results as issues (see ux-submit.js).
window.UX_RESULTS_REPO = "mohammadrezajahannama/castel-ux-results";

// The admin's public key (made in the admin panel). Results are encrypted with it. null: automatic sending is off.
window.UX_PUBLIC_KEY = null;

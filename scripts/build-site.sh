#!/usr/bin/env bash
# Builds the whole GitHub Pages site into _site/:
#   /            landing page and test pages (site/)
#   /admin/      the admin panel (the React app in src/)
# SITE_BASE is the path GitHub Pages serves the repo under, e.g. /castel-ux/.
set -euo pipefail
SITE_BASE="${SITE_BASE:-/castel-ux/}"

BASE_PATH="${SITE_BASE}admin/" yarn build

rm -rf _site
mkdir -p _site
cp -r site/. _site/
cp -r dist/client _site/admin
cp _site/admin/_shell.html _site/admin/index.html
# GitHub Pages answers unknown paths with the root 404.html: the admin shell opens deep links such as /admin/results.
cp _site/admin/_shell.html _site/404.html
# The token that lets test pages post results (repo secret UX_SUBMIT_TOKEN). Never committed: written into the
# built site only, reversed and base64-encoded so it is not a plain token string in the page.
if [ -n "${UX_SUBMIT_TOKEN:-}" ]; then
  enc="$(printf '%s' "$UX_SUBMIT_TOKEN" | rev | base64 -w0)"
  printf 'window.UX_SUBMIT_TOKEN = "%s";\n' "$enc" > _site/shared/submit-token.js
else
  echo "UX_SUBMIT_TOKEN is not set: automatic sending is off." >&2
  printf 'window.UX_SUBMIT_TOKEN = "";\n' > _site/shared/submit-token.js
fi
touch _site/.nojekyll
echo "Site built in _site/ for ${SITE_BASE}"

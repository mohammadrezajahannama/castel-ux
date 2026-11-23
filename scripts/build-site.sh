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
touch _site/.nojekyll
echo "Site built in _site/ for ${SITE_BASE}"

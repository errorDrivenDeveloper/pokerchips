#!/usr/bin/env bash
set -euo pipefail

# Publish the existing remote main branch; this script does not commit or push.
repo='errorDrivenDeveloper/pokerchips'
branch='main'
source_path='/docs'

if ! command -v gh >/dev/null 2>&1; then
  printf '%s\n' 'GitHub CLI (gh) is required: https://cli.github.com/' >&2
  exit 1
fi
if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  printf '%s\n' 'Log in first: gh auth login --hostname github.com --git-protocol ssh --web' >&2
  exit 1
fi

printf 'Checking repository %s...\n' "$repo"
if ! has_pages=$(gh api "repos/$repo" --jq '.has_pages'); then
  printf '%s\n' 'Could not access the repository. Check your GitHub account and permissions.' >&2
  exit 1
fi
if ! gh api "repos/$repo/contents/docs/index.html?ref=$branch" --jq '.path' >/dev/null; then
  printf 'The remote %s branch must contain docs/index.html. Commit and push it first.\n' "$branch" >&2
  exit 1
fi

if [[ "$has_pages" == 'true' ]]; then
  printf 'Updating the existing Pages site to publish %s:%s...\n' "$branch" "$source_path"
  method=PUT
elif [[ "$has_pages" == 'false' ]]; then
  printf 'Creating a Pages site from %s:%s...\n' "$branch" "$source_path"
  method=POST
else
  printf 'Unexpected GitHub Pages status: %s\n' "$has_pages" >&2
  exit 1
fi

if ! gh api --method "$method" "repos/$repo/pages" \
  -f build_type=legacy -f "source[branch]=$branch" -f "source[path]=$source_path" >/dev/null; then
  printf '%s\n' 'Could not configure GitHub Pages. Check repository admin/Pages permissions and plan eligibility.' >&2
  exit 1
fi

if site_url=$(gh api "repos/$repo/pages" --jq '.html_url'); then
  printf '\nPages URL: %s\n' "$site_url"
else
  printf '\nPages is configured. Check its URL in https://github.com/%s/settings/pages\n' "$repo"
fi
printf '%s\n' 'Publishing may take several minutes. Future pushes to main update the site automatically.'
printf '%s\n' 'GitHub Pages sites may be publicly accessible, even when the repository is private.'

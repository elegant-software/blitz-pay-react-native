#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ENV_FILE="$REPO_ROOT/mobile/.env"
REPO=""
ENVIRONMENT=""
count_vars=0
count_secrets=0
parsed_key=""
parsed_value=""
declare -a repo_flags=()
declare -a env_flags=()

usage() {
  cat <<'EOF'
Sync key/value pairs from a .env file into GitHub repository Variables/Secrets.

Usage:
  .github/scripts/sync-mobile-env-to-github.sh [--env-file <path>] [--repo <owner/name>] [--environment <name>]

Options:
  --env-file <path>      Path to .env file (default: <repo>/mobile/.env)
  --repo <owner/name>    Target repository (default: inferred via `gh repo view`)
  --environment <name>   Optional GitHub Environment name (for env-scoped vars/secrets)
  -h, --help             Show this help

Behavior:
  - Keys prefixed with EXPO_PUBLIC_ are stored as GitHub Variables.
  - All other keys are stored as GitHub Secrets.
EOF
}

die() {
  echo "$1" >&2
  exit 1
}

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

unquote() {
  local value="$1"
  if [[ "$value" =~ ^\".*\"$ ]] || [[ "$value" =~ ^\'.*\'$ ]]; then
    value="${value:1:${#value}-2}"
  fi
  printf '%s' "$value"
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --env-file)
        [[ $# -lt 2 ]] && die "Missing value for --env-file"
        ENV_FILE="$2"
        shift 2
        ;;
      --repo)
        [[ $# -lt 2 ]] && die "Missing value for --repo"
        REPO="$2"
        shift 2
        ;;
      --environment)
        [[ $# -lt 2 ]] && die "Missing value for --environment"
        ENVIRONMENT="$2"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        die "Unknown argument: $1"
        ;;
    esac
  done
}

validate_prerequisites() {
  if ! command -v gh >/dev/null 2>&1; then
    die "GitHub CLI (gh) is required."
  fi

  if [[ ! -f "$ENV_FILE" ]]; then
    die "Env file not found: $ENV_FILE"
  fi
}

resolve_repo_if_needed() {
  if [[ -z "$REPO" ]]; then
    REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
  fi
}

build_gh_flags() {
  repo_flags=(--repo "$REPO")
  env_flags=()
  if [[ -n "$ENVIRONMENT" ]]; then
    env_flags=(--env "$ENVIRONMENT")
  fi
}

parse_env_line() {
  local raw_line="$1"
  local line key value
  line="${raw_line%$'\r'}"
  line="$(trim "$line")"

  [[ -z "$line" || "${line:0:1}" == "#" ]] && return 1
  [[ "$line" != *"="* ]] && return 1

  key="$(trim "${line%%=*}")"
  value="$(trim "${line#*=}")"

  if [[ "$key" == export\ * ]]; then
    key="$(trim "${key#export }")"
  fi
  [[ -z "$key" ]] && return 1

  parsed_key="$key"
  parsed_value="$(unquote "$value")"
  return 0
}

sync_key() {
  local key="$1"
  local value="$2"

  if [[ "$key" == EXPO_PUBLIC_* ]]; then
    if [[ ${#env_flags[@]} -gt 0 ]]; then
      gh variable set "$key" "${repo_flags[@]}" "${env_flags[@]}" --body "$value" >/dev/null
    else
      gh variable set "$key" "${repo_flags[@]}" --body "$value" >/dev/null
    fi
    printf 'VAR    %s\n' "$key"
    count_vars=$((count_vars + 1))
  else
    if [[ ${#env_flags[@]} -gt 0 ]]; then
      gh secret set "$key" "${repo_flags[@]}" "${env_flags[@]}" --body "$value" >/dev/null
    else
      gh secret set "$key" "${repo_flags[@]}" --body "$value" >/dev/null
    fi
    printf 'SECRET %s\n' "$key"
    count_secrets=$((count_secrets + 1))
  fi
}

sync_env_file() {
  while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
    if parse_env_line "$raw_line"; then
      sync_key "$parsed_key" "$parsed_value"
    fi
  done < "$ENV_FILE"
}

main() {
  parse_args "$@"
  validate_prerequisites
  resolve_repo_if_needed
  build_gh_flags

  echo "Syncing from $ENV_FILE to $REPO${ENVIRONMENT:+ (environment: $ENVIRONMENT)}"
  sync_env_file
  echo "Done. Variables: $count_vars, Secrets: $count_secrets"
}

main "$@"

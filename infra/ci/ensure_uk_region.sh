#!/usr/bin/env bash
set -euo pipefail

LOCATION="${1:-}"

if [[ -z "${LOCATION}" ]]; then
  echo "ERROR: pass the Azure location (e.g. uksouth) as arg1" >&2
  exit 1
fi

case "$(echo "${LOCATION}" | tr '[:upper:]' '[:lower:]')" in
  uksouth|ukwest)
    echo "Location ${LOCATION} allowed."
    ;;
  *)
    echo "ERROR: Region ${LOCATION} is not permitted. Allowed: uksouth, ukwest." >&2
    exit 2
    ;;
esac

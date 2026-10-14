#!/usr/bin/env bash
# Uploads the signed APK and version.json to the public app-releases bucket.
# version.json is uploaded last so a phone never sees a version before its APK exists.
set -euo pipefail

if [ -z "${VITE_SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "Add the Actions secret SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API → service_role)."
  echo "The anon key stays in the app. The service role is only used here to publish the APK."
  exit 1
fi

if ! [[ "${ANDROID_VERSION_CODE:-}" =~ ^[1-9][0-9]*$ ]]; then
  echo "ANDROID_VERSION_CODE must be a positive integer."
  exit 1
fi

if ! [[ "${ANDROID_VERSION_NAME:-}" =~ ^[0-9A-Za-z._+-]+$ ]]; then
  echo "ANDROID_VERSION_NAME must be a plain version label."
  exit 1
fi

if [ ! -f family-records.apk ]; then
  echo "family-records.apk is missing."
  exit 1
fi

base="${VITE_SUPABASE_URL%/}"
auth=(-H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}")

bucket_code=$(curl -sS -o /tmp/app-releases-bucket.txt -w "%{http_code}" -X POST "${base}/storage/v1/bucket" \
  "${auth[@]}" \
  -H "Content-Type: application/json" \
  -d '{"id":"app-releases","name":"app-releases","public":true,"file_size_limit":52428800}')

if [ "$bucket_code" != "200" ] && [ "$bucket_code" != "201" ] && [ "$bucket_code" != "409" ]; then
  if ! grep -qi "already exists\|Duplicate" /tmp/app-releases-bucket.txt; then
    echo "Could not prepare the app-releases bucket (HTTP ${bucket_code})."
    cat /tmp/app-releases-bucket.txt
    exit 1
  fi
fi

upload() {
  local file="$1"
  local object="$2"
  local content_type="$3"
  local code
  code=$(curl -sS -o /tmp/app-releases-upload.txt -w "%{http_code}" -X POST \
    "${base}/storage/v1/object/app-releases/${object}" \
    "${auth[@]}" \
    -H "Content-Type: ${content_type}" \
    -H "x-upsert: true" \
    -H "cache-control: no-cache" \
    --data-binary @"${file}")
  if [ "$code" != "200" ] && [ "$code" != "201" ]; then
    echo "Could not upload ${object} (HTTP ${code})."
    cat /tmp/app-releases-upload.txt
    exit 1
  fi
}

upload family-records.apk family-records.apk application/vnd.android.package-archive

printf '{"versionCode":%s,"versionName":"%s"}\n' "$ANDROID_VERSION_CODE" "$ANDROID_VERSION_NAME" > version.json
upload version.json version.json application/json

echo "Published version ${ANDROID_VERSION_NAME} for the installed app to download."

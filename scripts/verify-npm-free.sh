#!/bin/bash
set -u

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
bundled_node_path="/Users/kim-young-gwang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
bundled_node_bin_path="$(dirname "$bundled_node_path")"
evidence_directory="$project_root/.omo/evidence"
build_evidence_path="$evidence_directory/task-T4-build.txt"
remediation_path="$evidence_directory/task-T4-build-remediation.txt"
server_process_id=""
failure_count=0
failure_summaries=()

append_command_line() {
  printf "COMMAND:" >> "$build_evidence_path"
  for command_argument in "$@"; do
    printf " %q" "$command_argument" >> "$build_evidence_path"
  done
  printf "\n" >> "$build_evidence_path"
}

record_failure() {
  failure_count=$((failure_count + 1))
  failure_summaries+=("$1")
}

run_command() {
  local command_label="$1"
  shift
  printf "\n## %s\n" "$command_label" >> "$build_evidence_path"
  append_command_line "$@"
  "$@" >> "$build_evidence_path" 2>&1
  local exit_status="$?"
  printf "EXIT_STATUS: %s\n" "$exit_status" >> "$build_evidence_path"
  if [[ "$exit_status" -ne 0 ]]; then
    record_failure "$command_label exited with status $exit_status"
  fi
}

cleanup_on_exit() {
  if [[ -n "$server_process_id" ]] && kill -0 "$server_process_id" 2>/dev/null; then
    kill "$server_process_id" 2>/dev/null || true
    wait "$server_process_id" 2>/dev/null || true
  fi
}

stop_server() {
  if [[ -z "$server_process_id" ]]; then
    printf "CLEANUP: server process already exited\n" >> "$build_evidence_path"
    return
  fi
  kill "$server_process_id" 2>/dev/null || true
  wait "$server_process_id" 2>/dev/null
  local cleanup_status="$?"
  printf "CLEANUP: stopped pid %s with wait status %s\n" "$server_process_id" "$cleanup_status" >> "$build_evidence_path"
  server_process_id=""
}

wait_for_server_probe() {
  local server_output_path="$1"
  server_probe_result="timeout"
  server_ready_line=""
  server_exit_status=""
  for _ in $(seq 1 45); do
    server_ready_line="$(grep -E -m 1 "(Ready in|Local:|started server)" "$server_output_path" || true)"
    if [[ -n "$server_ready_line" ]]; then
      server_probe_result="ready"
      return
    fi
    if ! kill -0 "$server_process_id" 2>/dev/null; then
      wait "$server_process_id"
      server_exit_status="$?"
      server_process_id=""
      server_probe_result="exited"
      return
    fi
    sleep 1
  done
}

run_server_probe() {
  local server_output_path
  local dashboard_probe_output_path
  local dashboard_status
  local dashboard_probe_status
  server_output_path="$(mktemp "${TMPDIR:-/tmp}/task-T4-next-dev.XXXXXX")"
  dashboard_probe_output_path="$(mktemp "${TMPDIR:-/tmp}/task-T4-dashboard.XXXXXX")"
  printf "\n## npm-free next dev server\n" >> "$build_evidence_path"
  append_command_line "$bundled_node_path" node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3000
  "$bundled_node_path" node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3000 > "$server_output_path" 2>&1 &
  server_process_id="$!"
  wait_for_server_probe "$server_output_path"
  cat "$server_output_path" >> "$build_evidence_path"
  printf "SERVER_PROBE_RESULT: %s\n" "$server_probe_result" >> "$build_evidence_path"
  if [[ "$server_probe_result" = "ready" ]]; then
    printf "READY_LINE: %s\n" "$server_ready_line" >> "$build_evidence_path"
    printf "\n## npm-free dashboard route probe\n" >> "$build_evidence_path"
    append_command_line curl -sS -o "$dashboard_probe_output_path" -w "%{http_code}" --max-time 25 http://127.0.0.1:3000/dashboard
    dashboard_status="$(curl -sS -o "$dashboard_probe_output_path" -w "%{http_code}" --max-time 25 http://127.0.0.1:3000/dashboard 2>> "$build_evidence_path")"
    dashboard_probe_status="$?"
    printf "HTTP_STATUS: %s\n" "$dashboard_status" >> "$build_evidence_path"
    printf "EXIT_STATUS: %s\n" "$dashboard_probe_status" >> "$build_evidence_path"
    if [[ "$dashboard_probe_status" -ne 0 ]] || [[ "$dashboard_status" != "200" ]]; then
      record_failure "dashboard route probe exited with status $dashboard_probe_status and HTTP $dashboard_status"
    fi
  else
    record_failure "next dev server probe result: $server_probe_result ${server_exit_status:-}"
  fi
  stop_server
  rm -f "$server_output_path"
  rm -f "$dashboard_probe_output_path"
}

write_remediation() {
  {
    printf "# Task T4 build remediation\n\n"
    if [[ "$failure_count" -eq 0 ]]; then
      printf "No remediation needed. All npm-free verification commands completed successfully.\n"
      return
    fi
    printf "Failures observed during npm-free verification:\n"
    for failure_summary in "${failure_summaries[@]}"; do
      printf "%s\n" "- $failure_summary"
    done
    if grep -q "Cannot find module '../lightningcss.darwin-arm64.node'" "$build_evidence_path"; then
      printf "\nRemaining exact blocker: Next build reaches Tailwind/PostCSS, but node_modules is missing the Darwin arm64 Lightning CSS native binding expected by lightningcss: lightningcss-darwin-arm64 or lightningcss.darwin-arm64.node.\n"
    fi
    printf "\nRaw evidence: %s\n" "$build_evidence_path"
  } > "$remediation_path"
}

trap cleanup_on_exit EXIT INT TERM
mkdir -p "$evidence_directory"
export PATH="$bundled_node_bin_path:${PATH:-}"
{
  printf "# Task T4 npm-free verification evidence\n"
  printf "DATE_UTC: %s\n" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf "PROJECT_ROOT: %s\n" "$project_root"
  printf "BUNDLED_NODE: %s\n" "$bundled_node_path"
  printf "BUNDLED_NODE_BIN: %s\n" "$bundled_node_bin_path"
  printf "NODE_IN_PATH: %s\n" "$(command -v node || true)"
  printf "NPM_IN_PATH: %s\n" "$(command -v npm || true)"
  printf "NEXT_TELEMETRY_DISABLED: 1\n"
} > "$build_evidence_path"

cd "$project_root" || exit 1
export NEXT_TELEMETRY_DISABLED=1

if [[ ! -x "$bundled_node_path" ]]; then
  record_failure "bundled node is not executable: $bundled_node_path"
else
  run_command "bundled-node typecheck" "$bundled_node_path" node_modules/typescript/bin/tsc --noEmit
  run_command "bundled-node next build" "$bundled_node_path" node_modules/next/dist/bin/next build
  run_server_probe
fi

write_remediation
if [[ "$failure_count" -eq 0 ]]; then
  exit 0
fi
exit 1

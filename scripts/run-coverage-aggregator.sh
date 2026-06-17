#!/usr/bin/env bash
# ------------------------------------------------------------
# run-coverage-aggregator.sh
#   • Looks for the Coverage-Aggregator trigger file
#   • If present, invokes the generic agent runner (run-agent.sh)
#   • Falls back to a direct `just` task if run-agent.sh is missing
# ------------------------------------------------------------
set -euo pipefail

# ---- Configuration ------------------------------------------------
# Path to the trigger file that signals the agent should run
TRIGGER="${HOME}/.agents/knowledge/coverage-aggregator.trigger"

# Name of the logical agent we want to start
AGENT_NAME="coverage-aggregator"

# Path to the generic runner (if it exists)
GENERIC_RUNNER="./scripts/run-agent.sh"

# ---- Helper functions ---------------------------------------------
log()   { echo -e "\033[1;34m[Coverage-Aggregator] $*\033[0m"; }
error() { echo -e "\033[1;31m[Coverage-Aggregator-ERROR] $*\033[0m" >&2; }

# ---- Main logic -----------------------------------------------------
log "Checking for trigger file at ${TRIGGER}"
if [[ -f "${TRIGGER}" ]]; then
    log "Trigger found – launching ${AGENT_NAME} agent"
    
    if [[ -x "${GENERIC_RUNNER}" ]]; then
        # Run the generic runner, passing the agent name as an argument
        log "Using generic runner: ${GENERIC_RUNNER} ${AGENT_NAME}"
        "${GENERIC_RUNNER}" "${AGENT_NAME}"
    else
        # Fallback: try a just-task with the same name
        if command -v just >/dev/null 2>&1; then
            log "Generic runner not found – falling back to 'just run ${AGENT_NAME}'"
            just run "${AGENT_NAME}"
        else
            error "Neither ${GENERIC_RUNNER} nor 'just' are available. Please install one of them."
            exit 1
        fi
    fi
else
    log "No trigger file detected – nothing to do."
    exit 0
fi
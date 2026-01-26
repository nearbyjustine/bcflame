#!/bin/bash

###############################################################################
# Backup Scripts Test Suite
#
# Unit tests for backup.sh and restore.sh scripts
#
# Usage: ./backup.test.sh
###############################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

###############################################################################
# Test Framework Functions
###############################################################################

assert_equals() {
    local expected="$1"
    local actual="$2"
    local test_name="${3:-Unnamed test}"

    TESTS_RUN=$((TESTS_RUN + 1))

    if [[ "${expected}" == "${actual}" ]]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}✓${NC} ${test_name}"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}✗${NC} ${test_name}"
        echo -e "  Expected: ${expected}"
        echo -e "  Actual:   ${actual}"
        return 1
    fi
}

assert_success() {
    local command="$1"
    local test_name="${2:-Unnamed test}"

    TESTS_RUN=$((TESTS_RUN + 1))

    if eval "${command}" &>/dev/null; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}✓${NC} ${test_name}"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}✗${NC} ${test_name}"
        echo -e "  Command failed: ${command}"
        return 1
    fi
}

assert_failure() {
    local command="$1"
    local test_name="${2:-Unnamed test}"

    TESTS_RUN=$((TESTS_RUN + 1))

    if eval "${command}" &>/dev/null; then
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}✗${NC} ${test_name}"
        echo -e "  Command should have failed: ${command}"
        return 1
    else
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}✓${NC} ${test_name}"
        return 0
    fi
}

assert_file_exists() {
    local file_path="$1"
    local test_name="${2:-File existence test}"

    TESTS_RUN=$((TESTS_RUN + 1))

    if [[ -f "${file_path}" ]]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}✓${NC} ${test_name}"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}✗${NC} ${test_name}"
        echo -e "  File not found: ${file_path}"
        return 1
    fi
}

###############################################################################
# Test Cases
###############################################################################

test_scripts_exist() {
    echo ""
    echo "Testing: Script files exist"
    echo "----------------------------"

    assert_file_exists "${SCRIPT_DIR}/backup.sh" "backup.sh exists"
    assert_file_exists "${SCRIPT_DIR}/restore.sh" "restore.sh exists"
    assert_file_exists "${SCRIPT_DIR}/entrypoint.sh" "entrypoint.sh exists"
    assert_file_exists "${SCRIPT_DIR}/Dockerfile" "Dockerfile exists"
}

test_scripts_executable() {
    echo ""
    echo "Testing: Scripts are executable"
    echo "--------------------------------"

    assert_success "[[ -x ${SCRIPT_DIR}/backup.sh ]]" "backup.sh is executable"
    assert_success "[[ -x ${SCRIPT_DIR}/restore.sh ]]" "restore.sh is executable"
    assert_success "[[ -x ${SCRIPT_DIR}/entrypoint.sh ]]" "entrypoint.sh is executable"
}

test_scripts_syntax() {
    echo ""
    echo "Testing: Script syntax is valid"
    echo "--------------------------------"

    assert_success "bash -n ${SCRIPT_DIR}/backup.sh" "backup.sh has valid syntax"
    assert_success "bash -n ${SCRIPT_DIR}/restore.sh" "restore.sh has valid syntax"
    assert_success "bash -n ${SCRIPT_DIR}/entrypoint.sh" "entrypoint.sh has valid syntax"
}

test_dockerfile_syntax() {
    echo ""
    echo "Testing: Dockerfile syntax"
    echo "--------------------------"

    # Check if Dockerfile has required commands
    assert_success "grep -q 'FROM postgres:16-alpine' ${SCRIPT_DIR}/Dockerfile" "Dockerfile has correct base image"
    assert_success "grep -q 'COPY backup.sh' ${SCRIPT_DIR}/Dockerfile" "Dockerfile copies backup.sh"
    assert_success "grep -q 'COPY restore.sh' ${SCRIPT_DIR}/Dockerfile" "Dockerfile copies restore.sh"
    assert_success "grep -q 'COPY entrypoint.sh' ${SCRIPT_DIR}/Dockerfile" "Dockerfile copies entrypoint.sh"
    assert_success "grep -q 'ENTRYPOINT' ${SCRIPT_DIR}/Dockerfile" "Dockerfile has ENTRYPOINT"
}

test_backup_script_functions() {
    echo ""
    echo "Testing: Backup script functions"
    echo "--------------------------------"

    # Source the backup script (in a subshell to avoid executing main)
    (
        # Mock required environment variables
        export POSTGRES_HOST="localhost"
        export POSTGRES_DB="test"
        export POSTGRES_USER="test"
        export POSTGRES_PASSWORD="test"
        export BACKUP_DIR="/tmp"

        # Source functions (but don't run main)
        source "${SCRIPT_DIR}/backup.sh" &>/dev/null || true
    )

    # Test that key functions would be available
    assert_success "grep -q 'check_prerequisites()' ${SCRIPT_DIR}/backup.sh" "check_prerequisites function exists"
    assert_success "grep -q 'perform_backup()' ${SCRIPT_DIR}/backup.sh" "perform_backup function exists"
    assert_success "grep -q 'verify_backup()' ${SCRIPT_DIR}/backup.sh" "verify_backup function exists"
    assert_success "grep -q 'upload_to_s3()' ${SCRIPT_DIR}/backup.sh" "upload_to_s3 function exists"
    assert_success "grep -q 'apply_retention_policy()' ${SCRIPT_DIR}/backup.sh" "apply_retention_policy function exists"
}

test_restore_script_functions() {
    echo ""
    echo "Testing: Restore script functions"
    echo "----------------------------------"

    assert_success "grep -q 'check_prerequisites()' ${SCRIPT_DIR}/restore.sh" "check_prerequisites function exists"
    assert_success "grep -q 'confirm_restore()' ${SCRIPT_DIR}/restore.sh" "confirm_restore function exists"
    assert_success "grep -q 'create_pre_restore_backup()' ${SCRIPT_DIR}/restore.sh" "create_pre_restore_backup function exists"
    assert_success "grep -q 'perform_restore()' ${SCRIPT_DIR}/restore.sh" "perform_restore function exists"
    assert_success "grep -q 'verify_restore()' ${SCRIPT_DIR}/restore.sh" "verify_restore function exists"
    assert_success "grep -q 'rollback_restore()' ${SCRIPT_DIR}/restore.sh" "rollback_restore function exists"
}

test_error_handling() {
    echo ""
    echo "Testing: Error handling"
    echo "-----------------------"

    # Test that scripts use 'set -euo pipefail'
    assert_success "grep -q 'set -euo pipefail' ${SCRIPT_DIR}/backup.sh" "backup.sh has strict error handling"
    assert_success "grep -q 'set -euo pipefail' ${SCRIPT_DIR}/restore.sh" "restore.sh has strict error handling"
    assert_success "grep -q 'set -euo pipefail' ${SCRIPT_DIR}/entrypoint.sh" "entrypoint.sh has strict error handling"
}

test_logging() {
    echo ""
    echo "Testing: Logging functions"
    echo "--------------------------"

    # Test that scripts have logging functions
    assert_success "grep -q 'log_info()' ${SCRIPT_DIR}/backup.sh" "backup.sh has log_info function"
    assert_success "grep -q 'log_error()' ${SCRIPT_DIR}/backup.sh" "backup.sh has log_error function"
    assert_success "grep -q 'log_warning()' ${SCRIPT_DIR}/backup.sh" "backup.sh has log_warning function"

    assert_success "grep -q 'log_info()' ${SCRIPT_DIR}/restore.sh" "restore.sh has log_info function"
    assert_success "grep -q 'log_error()' ${SCRIPT_DIR}/restore.sh" "restore.sh has log_error function"
    assert_success "grep -q 'log_warning()' ${SCRIPT_DIR}/restore.sh" "restore.sh has log_warning function"
}

test_configuration_variables() {
    echo ""
    echo "Testing: Configuration variables"
    echo "---------------------------------"

    # Test that scripts reference required environment variables
    assert_success "grep -q 'POSTGRES_HOST' ${SCRIPT_DIR}/backup.sh" "backup.sh uses POSTGRES_HOST"
    assert_success "grep -q 'POSTGRES_DB' ${SCRIPT_DIR}/backup.sh" "backup.sh uses POSTGRES_DB"
    assert_success "grep -q 'POSTGRES_USER' ${SCRIPT_DIR}/backup.sh" "backup.sh uses POSTGRES_USER"
    assert_success "grep -q 'POSTGRES_PASSWORD' ${SCRIPT_DIR}/backup.sh" "backup.sh uses POSTGRES_PASSWORD"
    assert_success "grep -q 'BACKUP_DIR' ${SCRIPT_DIR}/backup.sh" "backup.sh uses BACKUP_DIR"
    assert_success "grep -q 'BACKUP_S3_ENABLED' ${SCRIPT_DIR}/backup.sh" "backup.sh uses BACKUP_S3_ENABLED"

    assert_success "grep -q 'POSTGRES_HOST' ${SCRIPT_DIR}/restore.sh" "restore.sh uses POSTGRES_HOST"
    assert_success "grep -q 'POSTGRES_DB' ${SCRIPT_DIR}/restore.sh" "restore.sh uses POSTGRES_DB"
    assert_success "grep -q 'POSTGRES_USER' ${SCRIPT_DIR}/restore.sh" "restore.sh uses POSTGRES_USER"
    assert_success "grep -q 'POSTGRES_PASSWORD' ${SCRIPT_DIR}/restore.sh" "restore.sh uses POSTGRES_PASSWORD"

    assert_success "grep -q 'BACKUP_SCHEDULE' ${SCRIPT_DIR}/entrypoint.sh" "entrypoint.sh uses BACKUP_SCHEDULE"
}

test_s3_support() {
    echo ""
    echo "Testing: S3 support"
    echo "-------------------"

    assert_success "grep -q 'aws s3 cp' ${SCRIPT_DIR}/backup.sh" "backup.sh has S3 upload functionality"
    assert_success "grep -q 'BACKUP_S3_BUCKET' ${SCRIPT_DIR}/backup.sh" "backup.sh uses BACKUP_S3_BUCKET"
    assert_success "grep -q 'server-side-encryption' ${SCRIPT_DIR}/backup.sh" "backup.sh uses S3 encryption"
}

test_retention_policy() {
    echo ""
    echo "Testing: Retention policy"
    echo "-------------------------"

    assert_success "grep -q 'BACKUP_RETENTION_DAYS' ${SCRIPT_DIR}/backup.sh" "backup.sh uses daily retention"
    assert_success "grep -q 'BACKUP_RETENTION_WEEKS' ${SCRIPT_DIR}/backup.sh" "backup.sh uses weekly retention"
    assert_success "grep -q 'BACKUP_RETENTION_MONTHS' ${SCRIPT_DIR}/backup.sh" "backup.sh uses monthly retention"
}

###############################################################################
# Test Runner
###############################################################################

print_summary() {
    echo ""
    echo "========================================="
    echo "Test Summary"
    echo "========================================="
    echo "Tests run:    ${TESTS_RUN}"
    echo -e "Tests passed: ${GREEN}${TESTS_PASSED}${NC}"

    if [[ ${TESTS_FAILED} -gt 0 ]]; then
        echo -e "Tests failed: ${RED}${TESTS_FAILED}${NC}"
        echo ""
        echo -e "${RED}TESTS FAILED${NC}"
        return 1
    else
        echo -e "Tests failed: ${TESTS_FAILED}"
        echo ""
        echo -e "${GREEN}ALL TESTS PASSED${NC}"
        return 0
    fi
}

main() {
    echo "========================================="
    echo "BC Flame Backup Scripts Test Suite"
    echo "========================================="

    # Run all tests
    test_scripts_exist
    test_scripts_executable
    test_scripts_syntax
    test_dockerfile_syntax
    test_backup_script_functions
    test_restore_script_functions
    test_error_handling
    test_logging
    test_configuration_variables
    test_s3_support
    test_retention_policy

    # Print summary and exit with appropriate code
    print_summary
}

# Run main function
main

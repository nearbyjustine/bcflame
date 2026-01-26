#!/bin/bash

###############################################################################
# SSL Setup Script Tests
#
# Unit tests for ssl-setup.sh and ssl-renew.sh scripts
#
# Usage: ./scripts/ssl-setup.test.sh
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

    assert_file_exists "${SCRIPT_DIR}/ssl-setup.sh" "ssl-setup.sh exists"
    assert_file_exists "${SCRIPT_DIR}/ssl-renew.sh" "ssl-renew.sh exists"
}

test_scripts_executable() {
    echo ""
    echo "Testing: Scripts are executable"
    echo "--------------------------------"

    assert_success "[[ -x ${SCRIPT_DIR}/ssl-setup.sh ]]" "ssl-setup.sh is executable"
    assert_success "[[ -x ${SCRIPT_DIR}/ssl-renew.sh ]]" "ssl-renew.sh is executable"
}

test_scripts_syntax() {
    echo ""
    echo "Testing: Script syntax is valid"
    echo "--------------------------------"

    assert_success "bash -n ${SCRIPT_DIR}/ssl-setup.sh" "ssl-setup.sh has valid syntax"
    assert_success "bash -n ${SCRIPT_DIR}/ssl-renew.sh" "ssl-renew.sh has valid syntax"
}

test_email_validation() {
    echo ""
    echo "Testing: Email validation"
    echo "-------------------------"

    # Source the ssl-setup.sh script to use its functions
    source "${SCRIPT_DIR}/ssl-setup.sh" &>/dev/null || true

    # Test valid emails
    EMAIL="test@example.com"
    assert_success "validate_email" "Valid email: test@example.com"

    EMAIL="user+tag@domain.co.uk"
    assert_success "validate_email" "Valid email: user+tag@domain.co.uk"

    EMAIL="firstname.lastname@company.org"
    assert_success "validate_email" "Valid email: firstname.lastname@company.org"

    # Test invalid emails
    EMAIL=""
    assert_failure "validate_email" "Invalid email: empty string"

    EMAIL="invalid"
    assert_failure "validate_email" "Invalid email: no @ symbol"

    EMAIL="@example.com"
    assert_failure "validate_email" "Invalid email: no local part"

    EMAIL="user@"
    assert_failure "validate_email" "Invalid email: no domain"
}

test_domain_validation() {
    echo ""
    echo "Testing: Domain validation"
    echo "--------------------------"

    # Source the ssl-setup.sh script to use its functions
    source "${SCRIPT_DIR}/ssl-setup.sh" &>/dev/null || true

    # Test valid domains
    assert_success "validate_domains example.com" "Valid domain: example.com"
    assert_success "validate_domains sub.example.com" "Valid domain: sub.example.com"
    assert_success "validate_domains example.co.uk" "Valid domain: example.co.uk"
    assert_success "validate_domains api-staging.example.com" "Valid domain: api-staging.example.com"
    assert_success "validate_domains example.com www.example.com" "Valid domains: multiple"

    # Test invalid domains
    assert_failure "validate_domains" "Invalid domain: no domain provided"
    assert_failure "validate_domains -example.com" "Invalid domain: starts with hyphen"
    assert_failure "validate_domains example-.com" "Invalid domain: ends with hyphen"
    assert_failure "validate_domains example..com" "Invalid domain: double dot"
    assert_failure "validate_domains 'example com'" "Invalid domain: contains space"
}

test_ssl_directory_structure() {
    echo ""
    echo "Testing: SSL directory structure"
    echo "--------------------------------"

    local project_root="$(cd "${SCRIPT_DIR}/.." && pwd)"
    local nginx_dir="${project_root}/nginx"

    assert_success "[[ -d ${nginx_dir} ]]" "nginx directory exists"
    assert_success "[[ -d ${nginx_dir}/ssl ]]" "nginx/ssl directory exists"
    assert_success "[[ -d ${nginx_dir}/conf.d ]]" "nginx/conf.d directory exists"
}

test_renew_script_functions() {
    echo ""
    echo "Testing: Renewal script functions"
    echo "----------------------------------"

    # Source the ssl-renew.sh script to use its functions
    source "${SCRIPT_DIR}/ssl-renew.sh" &>/dev/null || true

    # Test that key functions exist
    assert_success "declare -f check_certbot &>/dev/null" "check_certbot function exists"
    assert_success "declare -f check_nginx_container &>/dev/null" "check_nginx_container function exists"
    assert_success "declare -f renew_certificates &>/dev/null" "renew_certificates function exists"
    assert_success "declare -f copy_certificates &>/dev/null" "copy_certificates function exists"
    assert_success "declare -f reload_nginx &>/dev/null" "reload_nginx function exists"
}

test_setup_script_functions() {
    echo ""
    echo "Testing: Setup script functions"
    echo "--------------------------------"

    # Source the ssl-setup.sh script to use its functions
    source "${SCRIPT_DIR}/ssl-setup.sh" &>/dev/null || true

    # Test that key functions exist
    assert_success "declare -f validate_email &>/dev/null" "validate_email function exists"
    assert_success "declare -f validate_domains &>/dev/null" "validate_domains function exists"
    assert_success "declare -f check_certbot &>/dev/null" "check_certbot function exists"
    assert_success "declare -f check_nginx_container &>/dev/null" "check_nginx_container function exists"
    assert_success "declare -f generate_certificates &>/dev/null" "generate_certificates function exists"
    assert_success "declare -f copy_certificates &>/dev/null" "copy_certificates function exists"
    assert_success "declare -f reload_nginx &>/dev/null" "reload_nginx function exists"
}

test_error_handling() {
    echo ""
    echo "Testing: Error handling"
    echo "-----------------------"

    # Test that scripts use 'set -euo pipefail'
    assert_success "grep -q 'set -euo pipefail' ${SCRIPT_DIR}/ssl-setup.sh" "ssl-setup.sh has strict error handling"
    assert_success "grep -q 'set -euo pipefail' ${SCRIPT_DIR}/ssl-renew.sh" "ssl-renew.sh has strict error handling"
}

test_logging() {
    echo ""
    echo "Testing: Logging functions"
    echo "--------------------------"

    # Test that scripts have logging functions
    assert_success "grep -q 'log_info()' ${SCRIPT_DIR}/ssl-setup.sh" "ssl-setup.sh has log_info function"
    assert_success "grep -q 'log_error()' ${SCRIPT_DIR}/ssl-setup.sh" "ssl-setup.sh has log_error function"
    assert_success "grep -q 'log_warning()' ${SCRIPT_DIR}/ssl-setup.sh" "ssl-setup.sh has log_warning function"

    assert_success "grep -q 'log_info()' ${SCRIPT_DIR}/ssl-renew.sh" "ssl-renew.sh has log_info function"
    assert_success "grep -q 'log_error()' ${SCRIPT_DIR}/ssl-renew.sh" "ssl-renew.sh has log_error function"
    assert_success "grep -q 'log_warning()' ${SCRIPT_DIR}/ssl-renew.sh" "ssl-renew.sh has log_warning function"
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
    echo "BC Flame SSL Scripts Test Suite"
    echo "========================================="

    # Run all tests
    test_scripts_exist
    test_scripts_executable
    test_scripts_syntax
    test_email_validation
    test_domain_validation
    test_ssl_directory_structure
    test_setup_script_functions
    test_renew_script_functions
    test_error_handling
    test_logging

    # Print summary and exit with appropriate code
    print_summary
}

# Run main function
main

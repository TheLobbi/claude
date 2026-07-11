---
name: Member Journey Tester
type: specialized-agent
model: claude-sonnet-5
category: testing
keywords:
  - member testing
  - user journey
  - enrollment testing
  - profile management
  - membership lifecycle
  - payment testing
  - e2e testing
  - selenium
  - multi-tenant testing
  - data isolation
capabilities:
  - Member enrollment flow testing
  - Profile management testing
  - Membership lifecycle testing
  - Payment flow verification
  - Multi-tenant data isolation testing
  - Member search and filtering testing
  - Member status transition testing
  - Document upload testing
  - Member communication testing
  - Reporting and analytics testing
---

# Member Journey Tester

## Description

The **Member Journey Tester** is a specialized agent responsible for comprehensive end-to-end testing of member-related functionality in the Lobbi multi-tenant platform. This agent tests the complete member lifecycle from enrollment through active membership, renewal, and eventual termination. It focuses on profile management, payment processing, tenant data isolation, and all member-facing features to ensure a seamless user experience across different tenant contexts.

This agent works closely with both the selenium-test-architect (for framework utilities) and auth-flow-tester (for authentication setup) to provide comprehensive coverage of member journeys.

---

## Core Responsibilities

### 1. Member Enrollment Testing

**Objective:** Verify complete member enrollment flows work correctly across all tenants.

**Key Activities:**
- Test member registration and signup flows
- Verify form validation and error handling
- Test document upload during enrollment
- Verify email verification flows
- Test different membership tier selections
- Verify enrollment fee processing
- Test bulk member import functionality
- Validate enrollment confirmation workflows

**Deliverables:**
- Enrollment flow test suite
- Form validation tests
- Document upload verification
- Multi-tier enrollment tests

---

### 2. Profile Management Testing

**Objective:** Ensure member profile creation, viewing, updating, and deletion work correctly.

**Key Activities:**
- Test profile creation with all required fields
- Verify profile viewing and detail pages
- Test profile editing and updates
- Verify profile picture upload
- Test contact information management
- Verify emergency contact management
- Test profile deletion and deactivation
- Validate profile history and audit logs

**Deliverables:**
- CRUD operation test suite
- Profile validation tests
- Image upload verification
- Profile history tracking tests

---

### 3. Membership Lifecycle Testing

**Objective:** Test complete membership lifecycle from active to suspended to terminated states.

**Key Activities:**
- Test membership activation flows
- Verify status transitions (active, suspended, terminated)
- Test renewal processes and reminders
- Verify expiration handling
- Test reinstatement procedures
- Verify grace period handling
- Test automatic status updates
- Validate lifecycle event notifications

**Deliverables:**
- Status transition test suite
- Renewal flow tests
- Expiration handling tests
- Notification verification tests

---

### 4. Multi-Tenant Data Isolation Verification

**Objective:** Ensure strict data isolation between tenants for all member operations.

**Key Activities:**
- Test member data isolation across tenants
- Verify search results respect tenant boundaries
- Test member lists show only tenant members
- Verify cross-tenant access prevention
- Test API responses respect tenant context
- Validate database query tenant filtering
- Test member export respects tenant boundaries
- Verify reporting shows only tenant data

**Deliverables:**
- Tenant isolation test suite
- Cross-tenant access prevention tests
- Data leakage verification tests
- Boundary condition tests

---

## Complete Code Examples

### 1. Member Page Objects

```python
# tests/pages/members/members_list_page.py
"""
Members list page object.
"""
from typing import List, Optional
from selenium.webdriver.common.by import By
from tests.pages.base_page import BasePage
import logging

logger = logging.getLogger(__name__)


class MembersListPage(BasePage):
    """Members list/index page object."""

    # Locators
    PAGE_TITLE = (By.CSS_SELECTOR, "h1.page-title")
    ADD_MEMBER_BUTTON = (By.ID, "add-member-button")
    SEARCH_INPUT = (By.ID, "member-search")
    SEARCH_BUTTON = (By.ID, "search-button")
    CLEAR_SEARCH_BUTTON = (By.ID, "clear-search")

    # Table
    MEMBERS_TABLE = (By.ID, "members-table")
    TABLE_ROWS = (By.CSS_SELECTOR, "#members-table tbody tr")
    LOADING_SPINNER = (By.CLASS_NAME, "loading-spinner")
    NO_RESULTS_MESSAGE = (By.CLASS_NAME, "no-results")

    # Filters
    STATUS_FILTER = (By.ID, "filter-status")
    MEMBERSHIP_TYPE_FILTER = (By.ID, "filter-membership-type")
    APPLY_FILTERS_BUTTON = (By.ID, "apply-filters")
    CLEAR_FILTERS_BUTTON = (By.ID, "clear-filters")

    # Pagination
    PAGINATION_INFO = (By.CLASS_NAME, "pagination-info")
    NEXT_PAGE_BUTTON = (By.ID, "next-page")
    PREV_PAGE_BUTTON = (By.ID, "prev-page")

    # Bulk Actions
    SELECT_ALL_CHECKBOX = (By.ID, "select-all-members")
    BULK_ACTION_DROPDOWN = (By.ID, "bulk-actions")
    BULK_ACTION_EXECUTE = (By.ID, "execute-bulk-action")

    def wait_for_page_load(self, timeout: int = 15) -> None:
        """Wait for members list page to load."""
        self.wait_for_element_visible(self.PAGE_TITLE, timeout)
        self.wait_for_element_invisible(self.LOADING_SPINNER, timeout)
        logger.info("Members list page loaded")

    def click_add_member(self) -> None:
        """Click add member button."""
        self.click(self.ADD_MEMBER_BUTTON)
        logger.info("Clicked add member button")

    def search_members(self, query: str) -> 'MembersListPage':
        """
        Search for members.

        Args:
            query: Search query string

        Returns:
            Self for chaining
        """
        self.send_keys(self.SEARCH_INPUT, query)
        self.click(self.SEARCH_BUTTON)
        self.wait_for_element_invisible(self.LOADING_SPINNER)
        logger.info(f"Searched for members: {query}")
        return self

    def clear_search(self) -> 'MembersListPage':
        """Clear search and show all members."""
        self.click(self.CLEAR_SEARCH_BUTTON)
        self.wait_for_element_invisible(self.LOADING_SPINNER)
        logger.info("Cleared member search")
        return self

    def get_member_count(self) -> int:
        """Get number of members displayed in table."""
        rows = self.find_elements(self.TABLE_ROWS)
        count = len(rows)
        logger.info(f"Found {count} members in table")
        return count

    def get_member_names(self) -> List[str]:
        """Get list of all member names displayed."""
        rows = self.find_elements(self.TABLE_ROWS)
        names = []

        for row in rows:
            # Assuming name is in first column
            name_cell = row.find_element(By.CSS_SELECTOR, "td:first-child")
            names.append(name_cell.text)

        logger.info(f"Retrieved {len(names)} member names")
        return names

    def get_member_emails(self) -> List[str]:
        """Get list of all member emails displayed."""
        rows = self.find_elements(self.TABLE_ROWS)
        emails = []

        for row in rows:
            # Assuming email is in second column
            email_cell = row.find_element(By.CSS_SELECTOR, "td:nth-child(2)")
            emails.append(email_cell.text)

        return emails

    def click_member_by_name(self, name: str) -> None:
        """Click on member row by name."""
        rows = self.find_elements(self.TABLE_ROWS)

        for row in rows:
            name_cell = row.find_element(By.CSS_SELECTOR, "td:first-child")
            if name in name_cell.text:
                name_cell.click()
                logger.info(f"Clicked member: {name}")
                return

        raise ValueError(f"Member not found: {name}")

    def filter_by_status(self, status: str) -> 'MembersListPage':
        """
        Filter members by status.

        Args:
            status: Status value (active, suspended, terminated)

        Returns:
            Self for chaining
        """
        from selenium.webdriver.support.ui import Select
        select = Select(self.find_element(self.STATUS_FILTER))
        select.select_by_value(status)
        self.click(self.APPLY_FILTERS_BUTTON)
        self.wait_for_element_invisible(self.LOADING_SPINNER)
        logger.info(f"Filtered by status: {status}")
        return self

    def filter_by_membership_type(self, membership_type: str) -> 'MembersListPage':
        """Filter members by membership type."""
        from selenium.webdriver.support.ui import Select
        select = Select(self.find_element(self.MEMBERSHIP_TYPE_FILTER))
        select.select_by_value(membership_type)
        self.click(self.APPLY_FILTERS_BUTTON)
        self.wait_for_element_invisible(self.LOADING_SPINNER)
        logger.info(f"Filtered by membership type: {membership_type}")
        return self

    def clear_filters(self) -> 'MembersListPage':
        """Clear all filters."""
        self.click(self.CLEAR_FILTERS_BUTTON)
        self.wait_for_element_invisible(self.LOADING_SPINNER)
        logger.info("Cleared all filters")
        return self

    def is_no_results_displayed(self) -> bool:
        """Check if no results message is displayed."""
        return self.is_element_visible(self.NO_RESULTS_MESSAGE)

    def verify_member_exists(self, email: str) -> bool:
        """
        Verify a member with given email exists in the list.

        Args:
            email: Member email to search for

        Returns:
            True if member found
        """
        emails = self.get_member_emails()
        exists = email in emails
        logger.info(f"Member {email} exists: {exists}")
        return exists

    def verify_member_not_exists(self, email: str) -> bool:
        """Verify a member does NOT exist in the list."""
        return not self.verify_member_exists(email)


# tests/pages/members/member_detail_page.py
"""
Member detail/profile page object.
"""
from selenium.webdriver.common.by import By
from tests.pages.base_page import BasePage
import logging

logger = logging.getLogger(__name__)


class MemberDetailPage(BasePage):
    """Member detail/profile page object."""

    # Profile Information
    MEMBER_NAME = (By.ID, "member-name")
    MEMBER_EMAIL = (By.ID, "member-email")
    MEMBER_PHONE = (By.ID, "member-phone")
    MEMBER_STATUS = (By.ID, "member-status")
    MEMBERSHIP_TYPE = (By.ID, "membership-type")
    MEMBER_SINCE_DATE = (By.ID, "member-since")
    PROFILE_PICTURE = (By.ID, "profile-picture")

    # Action Buttons
    EDIT_BUTTON = (By.ID, "edit-member-button")
    DELETE_BUTTON = (By.ID, "delete-member-button")
    SUSPEND_BUTTON = (By.ID, "suspend-member-button")
    ACTIVATE_BUTTON = (By.ID, "activate-member-button")

    # Tabs
    PROFILE_TAB = (By.ID, "tab-profile")
    MEMBERSHIP_TAB = (By.ID, "tab-membership")
    PAYMENTS_TAB = (By.ID, "tab-payments")
    DOCUMENTS_TAB = (By.ID, "tab-documents")

    # Confirmation Modals
    DELETE_CONFIRM_MODAL = (By.ID, "delete-confirmation-modal")
    DELETE_CONFIRM_BUTTON = (By.ID, "confirm-delete-button")
    SUSPEND_CONFIRM_MODAL = (By.ID, "suspend-confirmation-modal")
    SUSPEND_CONFIRM_BUTTON = (By.ID, "confirm-suspend-button")

    def wait_for_page_load(self, timeout: int = 15) -> None:
        """Wait for member detail page to load."""
        self.wait_for_element_visible(self.MEMBER_NAME, timeout)
        logger.info("Member detail page loaded")

    def get_member_name(self) -> str:
        """Get displayed member name."""
        return self.get_text(self.MEMBER_NAME)

    def get_member_email(self) -> str:
        """Get displayed member email."""
        return self.get_text(self.MEMBER_EMAIL)

    def get_member_status(self) -> str:
        """Get member status."""
        return self.get_text(self.MEMBER_STATUS)

    def get_membership_type(self) -> str:
        """Get membership type."""
        return self.get_text(self.MEMBERSHIP_TYPE)

    def click_edit(self) -> None:
        """Click edit button."""
        self.click(self.EDIT_BUTTON)
        logger.info("Clicked edit member")

    def click_delete(self) -> None:
        """Click delete button."""
        self.click(self.DELETE_BUTTON)
        logger.info("Clicked delete member")

    def confirm_delete(self) -> None:
        """Confirm member deletion."""
        self.wait_for_element_visible(self.DELETE_CONFIRM_MODAL)
        self.click(self.DELETE_CONFIRM_BUTTON)
        logger.info("Confirmed member deletion")

    def click_suspend(self) -> None:
        """Click suspend button."""
        self.click(self.SUSPEND_BUTTON)
        logger.info("Clicked suspend member")

    def confirm_suspend(self) -> None:
        """Confirm member suspension."""
        self.wait_for_element_visible(self.SUSPEND_CONFIRM_MODAL)
        self.click(self.SUSPEND_CONFIRM_BUTTON)
        logger.info("Confirmed member suspension")

    def click_activate(self) -> None:
        """Click activate button."""
        self.click(self.ACTIVATE_BUTTON)
        logger.info("Clicked activate member")

    def switch_to_membership_tab(self) -> 'MemberDetailPage':
        """Switch to membership tab."""
        self.click(self.MEMBERSHIP_TAB)
        logger.info("Switched to membership tab")
        return self

    def switch_to_payments_tab(self) -> 'MemberDetailPage':
        """Switch to payments tab."""
        self.click(self.PAYMENTS_TAB)
        logger.info("Switched to payments tab")
        return self

    def switch_to_documents_tab(self) -> 'MemberDetailPage':
        """Switch to documents tab."""
        self.click(self.DOCUMENTS_TAB)
        logger.info("Switched to documents tab")
        return self


# tests/pages/members/add_member_page.py
"""
Add/Create member page object.
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from tests.pages.base_page import BasePage
from tests.factories.test_data_factory import MemberData
import logging

logger = logging.getLogger(__name__)


class AddMemberPage(BasePage):
    """Add/Create member page object."""

    # Form Fields
    FIRST_NAME_INPUT = (By.ID, "first-name")
    LAST_NAME_INPUT = (By.ID, "last-name")
    EMAIL_INPUT = (By.ID, "email")
    PHONE_INPUT = (By.ID, "phone")
    DATE_OF_BIRTH_INPUT = (By.ID, "date-of-birth")
    MEMBERSHIP_TYPE_SELECT = (By.ID, "membership-type")

    # Address Fields
    STREET_INPUT = (By.ID, "street")
    CITY_INPUT = (By.ID, "city")
    STATE_SELECT = (By.ID, "state")
    ZIP_INPUT = (By.ID, "zip-code")

    # Actions
    SUBMIT_BUTTON = (By.ID, "submit-member")
    CANCEL_BUTTON = (By.ID, "cancel-button")

    # Validation
    ERROR_MESSAGE = (By.CLASS_NAME, "error-message")
    SUCCESS_MESSAGE = (By.CLASS_NAME, "success-message")

    def wait_for_page_load(self, timeout: int = 15) -> None:
        """Wait for add member page to load."""
        self.wait_for_element_visible(self.FIRST_NAME_INPUT, timeout)
        logger.info("Add member page loaded")

    def fill_member_form(self, member_data: MemberData) -> 'AddMemberPage':
        """
        Fill member form with data.

        Args:
            member_data: MemberData instance

        Returns:
            Self for chaining
        """
        self.send_keys(self.FIRST_NAME_INPUT, member_data.first_name)
        self.send_keys(self.LAST_NAME_INPUT, member_data.last_name)
        self.send_keys(self.EMAIL_INPUT, member_data.email)
        self.send_keys(self.PHONE_INPUT, member_data.phone)
        self.send_keys(self.DATE_OF_BIRTH_INPUT, member_data.date_of_birth)

        # Select membership type
        membership_select = Select(self.find_element(self.MEMBERSHIP_TYPE_SELECT))
        membership_select.select_by_value(member_data.membership_type)

        # Fill address
        self.send_keys(self.STREET_INPUT, member_data.address['street'])
        self.send_keys(self.CITY_INPUT, member_data.address['city'])

        state_select = Select(self.find_element(self.STATE_SELECT))
        state_select.select_by_value(member_data.address['state'])

        self.send_keys(self.ZIP_INPUT, member_data.address['zip_code'])

        logger.info(f"Filled member form for: {member_data.email}")
        return self

    def submit_form(self) -> None:
        """Submit member form."""
        self.click(self.SUBMIT_BUTTON)
        logger.info("Submitted member form")

    def cancel_form(self) -> None:
        """Cancel form and return to list."""
        self.click(self.CANCEL_BUTTON)
        logger.info("Cancelled member form")

    def create_member(self, member_data: MemberData) -> None:
        """
        Complete flow to create a member.

        Args:
            member_data: Member data to create
        """
        self.fill_member_form(member_data)
        self.submit_form()
        self.wait_for_success_message()

    def wait_for_success_message(self, timeout: int = 10) -> None:
        """Wait for success message to appear."""
        self.wait_for_element_visible(self.SUCCESS_MESSAGE, timeout)
        logger.info("Success message appeared")

    def get_error_message(self) -> str:
        """Get form error message."""
        if self.is_element_visible(self.ERROR_MESSAGE):
            return self.get_text(self.ERROR_MESSAGE)
        return ""

    def is_error_displayed(self) -> bool:
        """Check if error message is displayed."""
        return self.is_element_visible(self.ERROR_MESSAGE)
```

---

### 2. Member Journey Test Suite

```python
# tests/e2e/test_member_enrollment.py
"""
E2E tests for member enrollment flows.
"""
import pytest
from tests.pages.members.members_list_page import MembersListPage
from tests.pages.members.add_member_page import AddMemberPage
from tests.pages.members.member_detail_page import MemberDetailPage
from tests.helpers.auth_helper import AuthHelper
from tests.factories.test_data_factory import TestDataFactory
import logging

logger = logging.getLogger(__name__)


@pytest.mark.member
@pytest.mark.smoke
class TestMemberEnrollment:
    """Member enrollment flow tests."""

    def test_create_new_member_tenant_a(self, tenant_a):
        """Test creating a new member in Tenant A."""
        # Arrange
        driver = tenant_a['driver']
        AuthHelper.perform_login(
            driver, tenant_a,
            tenant_a['admin_user'],
            tenant_a['admin_password']
        )

        member_data = TestDataFactory.create_member(tenant_key='tenant_a')

        # Act
        members_page = MembersListPage(driver, tenant_a)
        members_page.navigate_to(tenant_a['url'] + '/members')
        members_page.wait_for_page_load()

        initial_count = members_page.get_member_count()

        members_page.click_add_member()

        add_page = AddMemberPage(driver, tenant_a)
        add_page.wait_for_page_load()
        add_page.create_member(member_data)

        # Navigate back to list
        members_page.navigate_to(tenant_a['url'] + '/members')
        members_page.wait_for_page_load()

        # Assert
        final_count = members_page.get_member_count()
        assert final_count == initial_count + 1, "Member count should increase by 1"

        # Verify member appears in list
        assert members_page.verify_member_exists(member_data.email)

        logger.info(f"✓ Successfully created member: {member_data.email}")

    def test_create_member_with_invalid_email(self, tenant_a):
        """Test creating member with invalid email shows error."""
        driver = tenant_a['driver']
        AuthHelper.perform_login(
            driver, tenant_a,
            tenant_a['admin_user'],
            tenant_a['admin_password']
        )

        member_data = TestDataFactory.create_member(
            tenant_key='tenant_a',
            email='invalid-email'  # Invalid format
        )

        members_page = MembersListPage(driver, tenant_a)
        members_page.navigate_to(tenant_a['url'] + '/members')
        members_page.click_add_member()

        add_page = AddMemberPage(driver, tenant_a)
        add_page.wait_for_page_load()
        add_page.fill_member_form(member_data)
        add_page.submit_form()

        # Assert error is displayed
        assert add_page.is_error_displayed(), "Error message should be displayed"
        error_msg = add_page.get_error_message()
        assert 'email' in error_msg.lower(), "Error should mention email"

        logger.info("✓ Invalid email validation test passed")

    def test_create_member_all_membership_types(self, tenant_a):
        """Test creating members with different membership types."""
        driver = tenant_a['driver']
        AuthHelper.perform_login(
            driver, tenant_a,
            tenant_a['admin_user'],
            tenant_a['admin_password']
        )

        membership_types = ['standard', 'premium', 'vip']

        for membership_type in membership_types:
            member_data = TestDataFactory.create_member(
                tenant_key='tenant_a',
                membership_type=membership_type
            )

            members_page = MembersListPage(driver, tenant_a)
            members_page.navigate_to(tenant_a['url'] + '/members')
            members_page.click_add_member()

            add_page = AddMemberPage(driver, tenant_a)
            add_page.wait_for_page_load()
            add_page.create_member(member_data)

            # Verify created
            members_page.navigate_to(tenant_a['url'] + '/members')
            members_page.wait_for_page_load()
            assert members_page.verify_member_exists(member_data.email)

            logger.info(f"✓ Created {membership_type} member: {member_data.email}")

    def test_bulk_member_creation(self, tenant_a):
        """Test creating multiple members in bulk."""
        driver = tenant_a['driver']
        AuthHelper.perform_login(
            driver, tenant_a,
            tenant_a['admin_user'],
            tenant_a['admin_password']
        )

        # Create 5 members
        members = TestDataFactory.create_members_batch(5, tenant_key='tenant_a')

        members_page = MembersListPage(driver, tenant_a)

        for member_data in members:
            members_page.navigate_to(tenant_a['url'] + '/members')
            members_page.wait_for_page_load()
            members_page.click_add_member()

            add_page = AddMemberPage(driver, tenant_a)
            add_page.wait_for_page_load()
            add_page.create_member(member_data)

        # Verify all members created
        members_page.navigate_to(tenant_a['url'] + '/members')
        members_page.wait_for_page_load()

        for member_data in members:
            assert members_page.verify_member_exists(member_data.email)

        logger.info(f"✓ Successfully created {len(members)} members in bulk")


@pytest.mark.member
class TestMemberProfileManagement:
    """Member profile management tests."""

    def test_view_member_profile(self, tenant_a):
        """Test viewing member profile details."""
        driver = tenant_a['driver']
        AuthHelper.perform_login(
            driver, tenant_a,
            tenant_a['admin_user'],
            tenant_a['admin_password']
        )

        # Create a member first
        member_data = TestDataFactory.create_member(tenant_key='tenant_a')

        members_page = MembersListPage(driver, tenant_a)
        members_page.navigate_to(tenant_a['url'] + '/members')
        members_page.click_add_member()

        add_page = AddMemberPage(driver, tenant_a)
        add_page.create_member(member_data)

        # View member profile
        members_page.navigate_to(tenant_a['url'] + '/members')
        members_page.click_member_by_name(member_data.first_name)

        detail_page = MemberDetailPage(driver, tenant_a)
        detail_page.wait_for_page_load()

        # Assert profile details
        assert member_data.first_name in detail_page.get_member_name()
        assert member_data.email == detail_page.get_member_email()

        logger.info("✓ Member profile view test passed")

    def test_edit_member_profile(self, tenant_a):
        """Test editing member profile."""
        pytest.skip("Requires edit member page object")
        # TODO: Implement edit flow
        # - Create member
        # - Click edit
        # - Update fields
        # - Save
        # - Verify changes

    def test_delete_member(self, tenant_a):
        """Test deleting a member."""
        driver = tenant_a['driver']
        AuthHelper.perform_login(
            driver, tenant_a,
            tenant_a['admin_user'],
            tenant_a['admin_password']
        )

        # Create a member
        member_data = TestDataFactory.create_member(tenant_key='tenant_a')

        members_page = MembersListPage(driver, tenant_a)
        members_page.navigate_to(tenant_a['url'] + '/members')
        members_page.click_add_member()

        add_page = AddMemberPage(driver, tenant_a)
        add_page.create_member(member_data)

        # Delete member
        members_page.navigate_to(tenant_a['url'] + '/members')
        members_page.click_member_by_name(member_data.first_name)

        detail_page = MemberDetailPage(driver, tenant_a)
        detail_page.wait_for_page_load()
        detail_page.click_delete()
        detail_page.confirm_delete()

        # Verify deleted
        members_page.navigate_to(tenant_a['url'] + '/members')
        members_page.wait_for_page_load()
        assert members_page.verify_member_not_exists(member_data.email)

        logger.info("✓ Member deletion test passed")


@pytest.mark.member
class TestMemberLifecycle:
    """Member lifecycle and status transition tests."""

    def test_suspend_member(self, tenant_a):
        """Test suspending an active member."""
        driver = tenant_a['driver']
        AuthHelper.perform_login(
            driver, tenant_a,
            tenant_a['admin_user'],
            tenant_a['admin_password']
        )

        # Create active member
        member_data = TestDataFactory.create_member(tenant_key='tenant_a')

        members_page = MembersListPage(driver, tenant_a)
        members_page.navigate_to(tenant_a['url'] + '/members')
        members_page.click_add_member()

        add_page = AddMemberPage(driver, tenant_a)
        add_page.create_member(member_data)

        # Suspend member
        members_page.navigate_to(tenant_a['url'] + '/members')
        members_page.click_member_by_name(member_data.first_name)

        detail_page = MemberDetailPage(driver, tenant_a)
        detail_page.wait_for_page_load()

        initial_status = detail_page.get_member_status()
        assert initial_status.lower() == 'active'

        detail_page.click_suspend()
        detail_page.confirm_suspend()

        # Verify status changed
        detail_page.refresh_page()
        detail_page.wait_for_page_load()

        new_status = detail_page.get_member_status()
        assert new_status.lower() == 'suspended'

        logger.info("✓ Member suspension test passed")

    def test_activate_suspended_member(self, tenant_a):
        """Test reactivating a suspended member."""
        pytest.skip("Requires member suspension setup")
        # TODO: Create suspended member, then activate

    def test_member_status_transitions(self, tenant_a):
        """Test all valid member status transitions."""
        pytest.skip("Requires complete status transition logic")
        # TODO: Test: active -> suspended -> active
        # TODO: Test: active -> terminated
        # TODO: Test: invalid transitions are prevented


@pytest.mark.member
@pytest.mark.multi_tenant
@pytest.mark.tenant_isolation
class TestMemberDataIsolation:
    """Multi-tenant member data isolation tests."""

    def test_tenant_a_members_not_visible_in_tenant_b(self, multi_tenant):
        """Test Tenant A members are not visible in Tenant B."""
        tenant_a_ctx = multi_tenant[0]
        tenant_b_ctx = multi_tenant[1]

        # Login to Tenant A and create member
        AuthHelper.perform_login(
            tenant_a_ctx['driver'],
            tenant_a_ctx,
            tenant_a_ctx['admin_user'],
            tenant_a_ctx['admin_password']
        )

        member_a = TestDataFactory.create_member(tenant_key='tenant_a')

        members_page_a = MembersListPage(tenant_a_ctx['driver'], tenant_a_ctx)
        members_page_a.navigate_to(tenant_a_ctx['url'] + '/members')
        members_page_a.click_add_member()

        add_page_a = AddMemberPage(tenant_a_ctx['driver'], tenant_a_ctx)
        add_page_a.create_member(member_a)

        # Verify member exists in Tenant A
        members_page_a.navigate_to(tenant_a_ctx['url'] + '/members')
        members_page_a.wait_for_page_load()
        assert members_page_a.verify_member_exists(member_a.email)

        # Login to Tenant B
        AuthHelper.perform_login(
            tenant_b_ctx['driver'],
            tenant_b_ctx,
            tenant_b_ctx['admin_user'],
            tenant_b_ctx['admin_password']
        )

        # Verify member does NOT exist in Tenant B
        members_page_b = MembersListPage(tenant_b_ctx['driver'], tenant_b_ctx)
        members_page_b.navigate_to(tenant_b_ctx['url'] + '/members')
        members_page_b.wait_for_page_load()

        assert members_page_b.verify_member_not_exists(member_a.email), \
            f"Tenant A member {member_a.email} should NOT be visible in Tenant B"

        logger.info("✓ Tenant isolation test passed")

    def test_member_search_respects_tenant_boundaries(self, multi_tenant):
        """Test member search returns only tenant-specific results."""
        tenant_a_ctx = multi_tenant[0]
        tenant_b_ctx = multi_tenant[1]

        # Create members in both tenants
        member_a = TestDataFactory.create_member(tenant_key='tenant_a')
        member_b = TestDataFactory.create_member(tenant_key='tenant_b')

        # Create in Tenant A
        AuthHelper.perform_login(
            tenant_a_ctx['driver'],
            tenant_a_ctx,
            tenant_a_ctx['admin_user'],
            tenant_a_ctx['admin_password']
        )

        members_page_a = MembersListPage(tenant_a_ctx['driver'], tenant_a_ctx)
        members_page_a.navigate_to(tenant_a_ctx['url'] + '/members')
        members_page_a.click_add_member()

        add_page_a = AddMemberPage(tenant_a_ctx['driver'], tenant_a_ctx)
        add_page_a.create_member(member_a)

        # Create in Tenant B
        AuthHelper.perform_login(
            tenant_b_ctx['driver'],
            tenant_b_ctx,
            tenant_b_ctx['admin_user'],
            tenant_b_ctx['admin_password']
        )

        members_page_b = MembersListPage(tenant_b_ctx['driver'], tenant_b_ctx)
        members_page_b.navigate_to(tenant_b_ctx['url'] + '/members')
        members_page_b.click_add_member()

        add_page_b = AddMemberPage(tenant_b_ctx['driver'], tenant_b_ctx)
        add_page_b.create_member(member_b)

        # Search in Tenant A
        members_page_a.navigate_to(tenant_a_ctx['url'] + '/members')
        members_page_a.search_members(member_a.first_name)

        tenant_a_results = members_page_a.get_member_emails()
        assert member_a.email in tenant_a_results
        assert member_b.email not in tenant_a_results

        # Search in Tenant B
        members_page_b.navigate_to(tenant_b_ctx['url'] + '/members')
        members_page_b.search_members(member_b.first_name)

        tenant_b_results = members_page_b.get_member_emails()
        assert member_b.email in tenant_b_results
        assert member_a.email not in tenant_b_results

        logger.info("✓ Search tenant isolation test passed")

    def test_bulk_operations_respect_tenant_boundaries(self, multi_tenant):
        """Test bulk operations only affect current tenant members."""
        pytest.skip("Requires bulk operations implementation")
        # TODO: Create members in both tenants
        # TODO: Perform bulk operation in Tenant A
        # TODO: Verify only Tenant A members affected
        # TODO: Verify Tenant B members unaffected


@pytest.mark.member
class TestMemberSearchAndFiltering:
    """Member search and filtering tests."""

    def test_search_by_name(self, tenant_a):
        """Test searching members by name."""
        driver = tenant_a['driver']
        AuthHelper.perform_login(
            driver, tenant_a,
            tenant_a['admin_user'],
            tenant_a['admin_password']
        )

        # Create test members
        members = TestDataFactory.create_members_batch(3, tenant_key='tenant_a')

        members_page = MembersListPage(driver, tenant_a)

        for member in members:
            members_page.navigate_to(tenant_a['url'] + '/members')
            members_page.click_add_member()
            add_page = AddMemberPage(driver, tenant_a)
            add_page.create_member(member)

        # Search for specific member
        target_member = members[0]
        members_page.navigate_to(tenant_a['url'] + '/members')
        members_page.search_members(target_member.first_name)

        # Verify search results
        results = members_page.get_member_names()
        assert target_member.full_name in ' '.join(results)

        logger.info("✓ Search by name test passed")

    def test_filter_by_membership_type(self, tenant_a):
        """Test filtering members by membership type."""
        driver = tenant_a['driver']
        AuthHelper.perform_login(
            driver, tenant_a,
            tenant_a['admin_user'],
            tenant_a['admin_password']
        )

        # Create members with different types
        premium_member = TestDataFactory.create_member(
            tenant_key='tenant_a',
            membership_type='premium'
        )
        standard_member = TestDataFactory.create_member(
            tenant_key='tenant_a',
            membership_type='standard'
        )

        members_page = MembersListPage(driver, tenant_a)

        # Create both members
        for member in [premium_member, standard_member]:
            members_page.navigate_to(tenant_a['url'] + '/members')
            members_page.click_add_member()
            add_page = AddMemberPage(driver, tenant_a)
            add_page.create_member(member)

        # Filter by premium
        members_page.navigate_to(tenant_a['url'] + '/members')
        members_page.filter_by_membership_type('premium')

        # Verify only premium members shown
        results = members_page.get_member_emails()
        assert premium_member.email in results
        # Note: May have other premium members, just ensure target is there

        logger.info("✓ Filter by membership type test passed")

    def test_clear_filters_shows_all_members(self, tenant_a):
        """Test clearing filters shows all members."""
        driver = tenant_a['driver']
        AuthHelper.perform_login(
            driver, tenant_a,
            tenant_a['admin_user'],
            tenant_a['admin_password']
        )

        members_page = MembersListPage(driver, tenant_a)
        members_page.navigate_to(tenant_a['url'] + '/members')

        # Get total count
        total_count = members_page.get_member_count()

        # Apply filter
        members_page.filter_by_status('active')
        filtered_count = members_page.get_member_count()

        # Clear filters
        members_page.clear_filters()
        final_count = members_page.get_member_count()

        # Should return to original count
        assert final_count == total_count

        logger.info("✓ Clear filters test passed")
```

---

### 3. Payment Flow Testing

```python
# tests/e2e/test_member_payments.py
"""
E2E tests for member payment flows.
"""
import pytest
from tests.helpers.auth_helper import AuthHelper
from tests.factories.test_data_factory import TestDataFactory
import logging

logger = logging.getLogger(__name__)


@pytest.mark.member
@pytest.mark.payment
class TestMemberPayments:
    """Member payment flow tests."""

    def test_view_member_payment_history(self, tenant_a):
        """Test viewing member payment history."""
        pytest.skip("Requires payment history page object")

        driver = tenant_a['driver']
        AuthHelper.perform_login(
            driver, tenant_a,
            tenant_a['admin_user'],
            tenant_a['admin_password']
        )

        # TODO: Create member with payment history
        # TODO: Navigate to payments tab
        # TODO: Verify payment records displayed

    def test_process_membership_payment(self, tenant_a):
        """Test processing a membership payment."""
        pytest.skip("Requires payment processing flow")

        # TODO: Create member
        # TODO: Initiate payment
        # TODO: Complete payment flow
        # TODO: Verify payment recorded

    def test_payment_isolation_across_tenants(self, multi_tenant):
        """Test payment data is isolated between tenants."""
        pytest.skip("Requires payment data setup")

        # TODO: Create payments in Tenant A
        # TODO: Verify not visible in Tenant B
        # TODO: Verify payment totals are tenant-specific
```

---

## Best Practices

### 1. Test Data Management
- **Unique identifiers:** Use timestamps or UUIDs in test data
- **Cleanup:** Clean up test data after tests (or use transactional rollback)
- **Realistic data:** Use Faker for realistic test data generation
- **Tenant-specific:** Always include tenant identifier in test data

### 2. Member Testing
- **Test all CRUD operations:** Create, Read, Update, Delete
- **Test all status transitions:** Verify all valid and invalid transitions
- **Test validation:** Verify form validation and error messages
- **Test edge cases:** Empty fields, special characters, long strings

### 3. Multi-Tenant Isolation
- **Always verify isolation:** Every member test should verify tenant boundaries
- **Test cross-tenant access:** Explicitly test that cross-access is prevented
- **Verify search/filter:** Ensure filtering respects tenant context
- **Test bulk operations:** Verify bulk operations don't leak across tenants

### 4. Page Object Usage
- **Fluent API:** Use method chaining for readable tests
- **Wait properly:** Use explicit waits in page objects
- **Encapsulate logic:** Keep Selenium details in page objects
- **Reuse components:** Create component objects for reusable UI elements

### 5. Assertions
- **Clear messages:** Use descriptive assertion messages
- **Verify state:** Always verify expected state after actions
- **Multiple assertions:** Use multiple specific assertions vs one complex one
- **Log results:** Log test results for debugging

---

## Collaboration Points

### Works With: **selenium-test-architect**
- **Receives:** Base framework, page objects, test utilities
- **Provides:** Member-specific test scenarios and coverage
- **Integration:** Uses shared base page class and fixtures

### Works With: **auth-flow-tester**
- **Receives:** Authentication utilities for test setup
- **Provides:** Member journey requirements
- **Integration:** Uses AuthHelper for test authentication

### Works With: **Stripe Payment Agent**
- **Receives:** Payment processing utilities
- **Provides:** Payment flow test scenarios
- **Integration:** Tests payment integration with member management

### Works With: **Multi-Tenant Agent**
- **Receives:** Tenant architecture patterns
- **Provides:** Tenant isolation verification at member level
- **Integration:** Shared tenant context management

### Works With: **MongoDB Atlas Agent**
- **Receives:** Database test data setup
- **Provides:** Data validation requirements
- **Integration:** Test data seeding and verification

---

## Test Coverage Checklist

### Member CRUD Operations
- [ ] Create member with all required fields
- [ ] Create member with optional fields
- [ ] View member list
- [ ] View member details
- [ ] Update member information
- [ ] Delete member
- [ ] Bulk member operations

### Member Validation
- [ ] Required field validation
- [ ] Email format validation
- [ ] Phone format validation
- [ ] Date validation
- [ ] Duplicate email prevention

### Member Lifecycle
- [ ] Active member creation
- [ ] Suspend active member
- [ ] Reactivate suspended member
- [ ] Terminate member
- [ ] Prevent invalid status transitions

### Search and Filtering
- [ ] Search by name
- [ ] Search by email
- [ ] Filter by status
- [ ] Filter by membership type
- [ ] Combined filters
- [ ] Clear filters

### Multi-Tenant Isolation
- [ ] Members isolated per tenant
- [ ] Search respects tenant boundaries
- [ ] Member details accessible only to own tenant
- [ ] Cross-tenant access prevented
- [ ] Bulk operations respect tenant boundaries

### Payment Integration
- [ ] View payment history
- [ ] Process payment
- [ ] Payment confirmation
- [ ] Payment isolation per tenant

---

## Performance Considerations

### Test Optimization
- **Parallel execution:** Run tests in parallel where possible
- **Minimize navigation:** Group related actions to reduce page loads
- **Reuse sessions:** Keep authenticated sessions for related tests
- **Smart waits:** Use appropriate timeout values

### Data Setup
- **API setup:** Use APIs for test data setup when possible (faster than UI)
- **Fixtures:** Use pytest fixtures for reusable setup
- **Teardown:** Clean up only necessary data
- **Batch operations:** Use bulk operations for creating test data

---

**Remember:** Member journeys are the heart of the Lobbi platform. Comprehensive testing ensures members have a seamless, secure, and reliable experience across all tenant contexts.

# Admin Panel

## Table of Contents

- [Admin Scope](#admin-scope)
- [User and Role Management](#user-and-role-management)
- [Chart and Sensor Configuration](#chart-and-sensor-configuration)
- [System Settings](#system-settings)
- [Safety and Governance](#safety-and-governance)

## Admin Scope

Admin views provide operational control over users, settings, device onboarding, and analytics-related behavior.

Typical responsibilities:
- account and role governance
- platform configuration
- diagnostics and log review
- device key provisioning and revocation
- mock data toggling for local testing and demos

## User and Role Management

Admin operations include:
- creating users
- enabling or disabling accounts
- assigning roles and permissions
- reviewing role-based access outcomes

Always validate RBAC behavior after permission model changes.

## Chart and Sensor Configuration

Admin configuration should include:
- threshold controls
- display or metric toggles
- retention-oriented settings where supported
- device identity and pairing controls

Pair UI settings changes with backend config persistence checks.

The current admin console is split into dedicated sections for overview, connections, device keys, users, UI, plant sensors, limits, config, raw data, logs, and mock data. The sidebar and navbar are extracted into dedicated layout components so the main page stays focused on data orchestration.

## System Settings

Expected settings areas:
- connectivity and endpoint values
- AI provider and usage behavior
- weather and recommendation controls
- test mode and diagnostics controls where available

## Safety and Governance

- Require authenticated and authorized admin context.
- Log impactful configuration changes.
- Validate that viewer and user roles cannot access admin-only actions.
- Keep device key operations and mock toggles behind the admin permission model.

## Quick Reference

- [Authentication and RBAC](../backend/authentication-rbac.md)
- [Backend Guide](../backend/backend-guide.md)
- [Frontend Guide](frontend-guide.md)
- [Contributor Guide](../onboarding/contributor-guide.md)

# Admin Panel

## Table of Contents

- [Admin Scope](#admin-scope)
- [User and Role Management](#user-and-role-management)
- [Chart and Sensor Configuration](#chart-and-sensor-configuration)
- [System Settings](#system-settings)
- [Safety and Governance](#safety-and-governance)

## Admin Scope

Admin views provide operational control over users, settings, and analytics-related behavior.

Typical responsibilities:
- account and role governance
- platform configuration
- diagnostics and log review

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

Pair UI settings changes with backend config persistence checks.

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

## Quick Reference

- [Authentication and RBAC](authentication.md)
- [Backend Guide](backend.md)
- [Frontend Guide](frontend.md)
- [Contributor Guide](contributor-guide.md)

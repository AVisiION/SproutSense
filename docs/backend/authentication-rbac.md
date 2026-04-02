# Authentication & RBAC

## Table of Contents

- [Role Model](#role-model)
- [Permissions Matrix](#permissions-matrix)
- [Auth Flows](#auth-flows)
- [Password Policy](#password-policy)
- [Implementation Notes](#implementation-notes)

## Role Model

Default roles:
- admin
- user
- viewer

Each role maps to explicit permission keys enforced by middleware.

## Permissions Matrix

| Capability | Admin | User | Viewer |
|------|------|------|------|
| Read dashboard | Yes | Yes | Yes |
| Control watering | Yes | Yes | No |
| Manage users and roles | Yes | No | No |
| Access analytics | Yes | Yes | Limited |
| Access AI chat | Yes | Yes | No |

Project-specific permission keys should remain centralized in backend RBAC config.

## Auth Flows

Supported flows:
- register
- email verification
- login
- token refresh
- logout
- forgot password
- reset password

Recommended verification path:
- run auth and RBAC smoke script after auth changes

## Password Policy

Policy goals:
- minimum length and complexity
- block known weak patterns
- deny profile-derived password patterns where possible

Apply strict policy for privileged roles.

## Implementation Notes

Backend modules involved:
- auth controllers
- authenticate middleware
- permission guards
- role and permission services

Update frontend route guards when backend permission semantics change.

## Quick Reference

- [Backend Guide](backend.md)
- [Admin Panel](admin-panel.md)
- [Contributor Guide](contributor-guide.md)
- [Setup Guide](setup.md)

# Frontend Guide

## Table of Contents

- [Frontend Structure](#frontend-structure)
- [Routing Model](#routing-model)
- [State and Data Flow](#state-and-data-flow)
- [Public vs Protected Experience](#public-vs-protected-experience)
- [Component Conventions](#component-conventions)

## Frontend Structure

Canonical frontend path is apps/web.

Key areas:
- src/pages for route-level screens
- src/components for reusable UI
- src/hooks for reusable logic and websocket behavior
- src/services and src/utils for API and helper modules

## Routing Model

The app uses route grouping patterns for:
- Public pages
- Auth pages
- Protected dashboard pages
- Admin-oriented routes guarded by permission checks

When adding routes:
1. Add route entry in App route config.
2. Add navigation metadata if required.
3. Validate role and permission behavior for protected screens.

## State and Data Flow

Data sources:
- REST requests for snapshots and history
- WebSocket updates for near real-time status

Recommended pattern:
1. Fetch initial snapshot on page load.
2. Merge websocket updates into active state slices.
3. Use explicit loading and error UI states.

## Public vs Protected Experience

Public area:
- Marketing and informational routes accessible without login

Protected area:
- Dashboard, analytics, controls, and settings requiring authenticated context

Admin area:
- User and permission management features behind role and permission checks

## Component Conventions

- Keep route-level orchestration in page components.
- Keep reusable UI and behavior in components and hooks.
- Keep API call wrappers in one place for consistency.
- Prefer descriptive prop names and explicit loading states.

## Quick Reference

- [Backend Guide](backend.md)
- [Authentication and RBAC](authentication.md)
- [Public Website](public-pages.md)
- [Admin Panel](admin-panel.md)

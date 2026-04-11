# Contributor Guide

## Table of Contents

- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing Expectations](#testing-expectations)
- [Commit Guidance](#commit-guidance)

## Git Workflow

1. Branch from main using a focused branch name.
2. Keep each branch scoped to one feature or fix.
3. Rebase or merge main regularly to reduce conflicts.

## Pull Request Process

A quality pull request should include:
- concise change summary
- why the change is needed
- testing evidence
- screenshots for UI changes
- docs updates when behavior changes

## Code Style

- Follow existing project conventions per app.
- Keep changes minimal and cohesive.
- Avoid broad unrelated refactors.
- Prefer explicit naming and guard clauses.

## Testing Expectations

Minimum checks before opening a PR:
- backend starts and endpoints function
- frontend builds successfully
- docs links remain valid

For auth and RBAC related changes:
- run apps/api/scripts/auth-rbac-smoke.mjs

## Commit Guidance

Use clear and focused commit messages.

Good examples:
- feat auth add refresh token rotation guard
- fix api normalize websocket url handling
- docs add module guides for admin and analytics

## Quick Reference

- [Setup Guide](setup.md)
- [Backend Guide](../backend/backend-guide.md)
- [Frontend Guide](../frontend/frontend-guide.md)
- [Root Contributing](../CONTRIBUTING.md)

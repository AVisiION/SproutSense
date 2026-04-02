# Contributing to SproutSense

Thank you for contributing.

## Project Layout

- apps/api: backend service
- apps/web: frontend dashboard
- firmware: embedded modules
- docs: project documentation

Use canonical app paths in new code and docs. Legacy wrapper folders remain for compatibility only.

## Development Setup

1. Install dependencies in both app folders.
2. Configure environment files:
   - apps/api/.env
   - apps/web/.env
3. Run local development from repo root:
   - powershell -ExecutionPolicy ByPass -File .\start.ps1

## Branch and PR Workflow

1. Create a feature branch from main.
2. Keep commits focused and descriptive.
3. Include docs updates when behavior or structure changes.
4. Open a pull request with:
   - summary
   - testing steps
   - screenshots for UI changes

## Coding and Documentation Rules

- Prefer canonical paths in documentation:
  - apps/api
  - apps/web
  - firmware/esp32-sensor
  - firmware/esp32-cam
- Keep changes small and reviewable.
- Avoid unrelated formatting churn.
- Keep markdown in ASCII where possible.

## Validation Checklist

Before opening a pull request:

- Backend starts and serves expected endpoints.
- Frontend builds successfully.
- Updated docs links resolve.
- If auth or RBAC changed, run smoke script:
  - cd apps/api; node scripts/auth-rbac-smoke.mjs

## Reporting Issues

When filing a bug include:

- expected behavior
- actual behavior
- reproduction steps
- environment details
- logs or screenshots

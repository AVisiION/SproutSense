# Contributing

Thanks for helping improve SproutSense. This document describes the preferred workflow, development setup, and quality checks.

## Project layout

- `apps/api` — backend service
- `apps/web` — frontend dashboard
- `firmware` — embedded modules and firmware
- `docs` — project documentation

Use the canonical paths above when adding code or documentation. Legacy wrapper folders are kept for backward compatibility only.

## Development setup

1. Install dependencies in each app folder:

```powershell
cd apps/api
npm install

cd ../web
npm install
```

2. Add environment files (examples are provided where applicable):

- `apps/api/.env`
- `apps/web/.env`

3. Start both apps from the repository root:

```powershell
powershell -ExecutionPolicy ByPass -File .\start.ps1
```

## Branch and pull request workflow

1. Create a feature branch from `main`.
2. Keep commits small, focused, and descriptive.
3. Update documentation when public behavior, APIs, or structure change.
4. Include the following in PR descriptions:

- short summary of changes
- testing steps to validate the change
- screenshots for UI updates

## Coding and documentation rules

- Prefer canonical paths in docs and code: `apps/api`, `apps/web`, `firmware/ESP32-SENSOR`, `firmware/ESP32_CAM_AI`.
- Keep changes reviewable; avoid large, unrelated formatting changes.
- Use clear, simple Markdown (UTF-8); avoid binary files in docs.

## Validation checklist

Before opening a PR, verify:

- Backend starts and exposes expected endpoints.
- Frontend builds and loads without errors.
- Documentation links resolve.
- If authentication or RBAC changed, run the smoke test:

```powershell
cd apps/api
node scripts/auth-rbac-smoke.mjs
```

## Reporting issues

When filing a bug report include:

- expected behavior
- actual behavior
- reproduction steps
- environment details (OS, Node version, env vars)
- relevant logs or screenshots

If you're unsure where to open a PR or issue, ask in a short issue describing the change and a maintainer will advise.

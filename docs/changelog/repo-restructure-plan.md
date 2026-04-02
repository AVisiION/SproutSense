# SproutSense Repository Restructure Plan

This document provides a practical migration map from the current layout to a professional, collaborative structure suitable for IoT + AI + web development.

## 1) Target Repository Tree

```text
sproutsense/
|-- apps/
|   |-- web/
|   `-- api/
|-- firmware/
|   |-- esp32-sensor/
|   |-- esp32-cam/
|   |-- shared/
|   `-- simulator/
|-- packages/
|   |-- shared-contracts/
|   |-- ui-kit/
|   `-- config/
|-- tests/
|   |-- e2e/
|   |-- integration/
|   |-- contract/
|   `-- firmware-sim/
|-- docs/
|   |-- architecture/
|   |-- api/
|   |-- frontend/
|   |-- backend/
|   |-- firmware/
|   |-- operations/
|   |-- onboarding/
|   |-- adr/
|   `-- changelog/
|-- scripts/
|   |-- setup/
|   |-- dev/
|   |-- ci/
|   |-- deploy/
|   `-- maintenance/
|-- assets/
|   |-- brand/
|   |-- diagrams/
|   |-- screenshots/
|   `-- demo-data/
|-- infra/
|   |-- render/
|   |-- netlify/
|   |-- mongodb/
|   `-- docker/
|-- .github/
|   |-- workflows/
|   |-- ISSUE_TEMPLATE/
|   |-- PULL_REQUEST_TEMPLATE.md
|   `-- CODEOWNERS
|-- README.md
|-- CONTRIBUTING.md
|-- SECURITY.md
|-- LICENSE
`-- package.json
```

## 2) Current -> Target Mapping

| Current path | Target path | Notes |
|---|---|---|
| `web/` | `apps/web/` | Frontend app root |
| `backend/` | `apps/api/` | Backend app root |
| `esp32-upload/ESP32-SENSOR/` | `firmware/esp32-sensor/` | Sensor controller firmware |
| `esp32-upload/ESP32_CAM_AI/` (or equivalent CAM folder) | `firmware/esp32-cam/` | Camera/AI firmware |
| `docs/*.md` | `docs/architecture/`, `docs/operations/`, `docs/firmware/` etc. | Categorize docs by responsibility |
| `start.ps1`, `start-production.ps1` | `scripts/dev/` and `scripts/deploy/` | Keep root wrappers temporarily |
| `render.yaml`, `netlify.toml` | `infra/render/`, `infra/netlify/` | Keep symlink/wrapper if platform expects root |
| `local/` | `docs/onboarding/` or `scripts/setup/` | Depends on content type |
| smoke/integration scripts under backend | `tests/integration/` and `apps/api/scripts/` | Split test logic vs ops script |

## 3) Frontend Structure (apps/web)

```text
apps/web/src/
|-- app/
|   |-- providers/
|   |-- routes/
|   `-- layout/
|-- features/
|   |-- public-site/
|   |-- auth/
|   |-- dashboard/
|   |-- sensors/
|   |-- analytics/
|   |-- ai-assistant/
|   |-- insights/
|   |-- settings/
|   |-- admin-panel/
|   `-- viewer/
|-- shared/
|   |-- components/
|   |-- hooks/
|   |-- services/
|   |-- utils/
|   |-- constants/
|   |-- types/
|   `-- styles/
`-- test/
```

### Why this helps
- Public pages and dashboard pages are clearly separated.
- Auth and RBAC guard logic becomes discoverable.
- Shared utilities stop duplicating across features.

## 4) Backend Structure (apps/api)

```text
apps/api/src/
|-- config/
|-- modules/
|   |-- auth/
|   |-- users/
|   |-- rbac/
|   |-- sensors/
|   |-- watering/
|   |-- analytics/
|   |-- reports/
|   |-- ai/
|   |-- public-preview/
|   |-- settings/
|   `-- notifications/
|-- middleware/
|-- integrations/
|-- websocket/
|-- logging/
|-- jobs/
|-- database/
|   |-- models/
|   |-- migrations/
|   `-- seeds/
`-- utils/
```

### Why this helps
- Route/controller/service/model files are grouped by domain.
- Contributors can own modules without navigating the whole backend.
- Public preview, analytics, and AI concerns remain isolated.

## 5) Firmware Structure (firmware)

```text
firmware/
|-- esp32-sensor/
|   |-- src/sensors/
|   |-- src/irrigation/
|   |-- src/connectivity/
|   |-- src/transport/
|   |-- src/config/
|   `-- src/calibration/
|-- esp32-cam/
|   |-- src/camera/
|   |-- src/inference/
|   |-- src/connectivity/
|   |-- src/transport/
|   `-- src/config/
|-- shared/
`-- simulator/
```

### Why this helps
- Sensor reading, watering control, connectivity, and communication are explicit.
- CAM inference and sensor-controller firmware remain independently maintainable.

## 6) Documentation Structure

- Keep a strong root `README.md` for quick-start and repo map.
- Add folder-level READMEs at:
  - `apps/web/README.md`
  - `apps/api/README.md`
  - `firmware/esp32-sensor/README.md`
  - `firmware/esp32-cam/README.md`
- Organize deep docs in `docs/` by topic.

Recommended docs split:
- `docs/architecture/` for diagrams and system boundaries.
- `docs/api/` for endpoint references and contracts.
- `docs/onboarding/` for new contributor setup.
- `docs/operations/` for deployment and runbooks.

## 7) PR-by-PR Migration Sequence

### PR-1: Introduce Target Skeleton (no moves yet)
- Create `apps/`, `firmware/`, `packages/`, `tests/`, `infra/`, `scripts/` subtrees.
- Add this plan and docs index updates.
- No runtime behavior changes.

### PR-2: Move Frontend to apps/web
- Move `web/` -> `apps/web/`.
- Update root scripts and CI paths.
- Keep compatibility npm scripts at root.

### PR-3: Move Backend to apps/api
- Move `backend/` -> `apps/api/`.
- Update Render build/start paths and docs.
- Validate health, auth, and sensor endpoints.

### PR-4: Firmware Split
- Move sensor firmware and CAM firmware into separate `firmware/*` folders.
- Add per-firmware READMEs with flash/build commands.

### PR-5: Docs Categorization
- Move docs files into category folders (`architecture`, `operations`, `firmware`).
- Keep redirect pointers for renamed docs.

### PR-6: Tests Consolidation
- Add top-level `tests/` for integration/e2e/contract.
- Keep module-specific unit tests near code if preferred.

### PR-7: Infra and Scripts Consolidation
- Move platform and helper scripts into `infra/` and `scripts/`.
- Keep root wrappers only when tooling requires root files.

## 8) Migration Safety Checklist

Before each PR:
- Run frontend build.
- Run backend smoke/auth tests.
- Verify local dev start scripts.
- Validate CI workflow paths.

After each PR:
- Update README path references.
- Update docs links.
- Confirm deployment config still points to correct root directories.

## 9) Student-Level vs Final-Year/Production Guidance

### Good student level
- Minimal split: `apps/web`, `apps/api`, `firmware`, `docs`, `tests`, `scripts`.
- Keep simple scripts and one main README.

### Strong final-year / production style
- Add shared contracts package.
- Add contract tests and CI path checks.
- Add CODEOWNERS and module ownership docs.
- Maintain ADRs for architecture decisions.

## 10) Immediate Next Actions for This Repo

1. Approve PR-1 skeleton creation.
2. Execute PR-2 (`web` -> `apps/web`) with script and CI updates.
3. Execute PR-3 (`backend` -> `apps/api`) and verify Render config.
4. Execute PR-4 firmware split and update hardware docs.

---

If you want, the next step is a file-by-file move list for PR-2 and PR-3 with exact old path -> new path operations.

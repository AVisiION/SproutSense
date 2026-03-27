## Plan: Generate Project Memory for SproutSense

Create a concise, structured memory file summarizing the project’s architecture, main components, conventions, and critical files. This will serve as a quick reference for contributors and for future planning/automation.

**Steps**
1. Summarize the overall project structure (backend, web, esp32-upload, docs).
2. Document backend architecture:
   - Key folders (api, src, controllers, models, routes, utils, middleware, validators)
   - Main entry points and configuration files
   - API conventions and notable patterns
3. Document web frontend architecture:
   - Main entry points and folder structure (components, hooks, pages, stores, styles, utils)
   - Notable React/Vite conventions
4. Note ESP32 firmware structure and purpose.
5. List critical documentation files and their purpose.
6. Capture any project-specific conventions or patterns (from repo memory and docs).
7. Reference any existing memory files for API shapes or config conventions.
8. Save the summary to /memories/repo/overview.md for persistent reference.

**Relevant files**
- backend/STRUCTURE.md — backend architecture
- docs/ARCHITECTURE.md — overall system architecture
- docs/MERN_ARCHITECTURE.md, docs/REACT_ARCHITECTURE.md — stack-specific details
- /memories/repo/api-shapes.md — API conventions
- /memories/repo/config-cleanup-routes.md — config routes conventions

**Verification**
1. Review the generated memory file for completeness and clarity.
2. Ensure all major project areas and conventions are covered.
3. Cross-check with existing documentation for accuracy.

**Decisions**
- Focus on high-level structure and conventions, not implementation details.
- Exclude deep dives into individual features unless critical for understanding architecture.

**Further Considerations**
1. If the project structure changes, update the memory file accordingly.
2. Consider adding a section for common troubleshooting or onboarding tips in the future.

Would you like to review or customize any part of this plan before I proceed to generate the memory file?

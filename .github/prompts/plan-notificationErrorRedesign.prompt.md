Rebuild Notification Error UI (Bottom Right, Close Button)

---

## Plan: Notification Error Redesign

**Goal:**
- Display notifications (especially errors) at the bottom right of the screen.
- Add a close (X) button to manually dismiss notifications.
- Ensure error notifications are visually distinct (e.g., red accent, icon).
- Maintain auto-dismiss after a few seconds, but allow manual close at any time.

**Steps:**
1. **Update Notification Component**
   - Add a close (X) button to the notification UI.
   - Ensure the close button calls the `onClose` handler immediately.
   - Keep the auto-dismiss timer (e.g., 3 seconds) as a fallback.
   - Add an error icon for error notifications (optional, for clarity).

2. **Adjust Notification CSS**
   - Ensure the notification container is fixed at the bottom right (`bottom: 24px; right: 24px;`).
   - Style the close button (hover, focus, accessibility).
   - Ensure error notifications have a red accent and are visually distinct.

3. **App Integration**
   - Ensure only one notification is shown at a time (current logic is fine).
   - Pass the `onClose` handler to the notification.

4. **Testing**
   - Trigger error and success notifications.
   - Confirm notifications appear bottom right, can be closed manually, and auto-dismiss after timeout.
   - Confirm error notifications are styled with a red accent and icon.

**Relevant Files:**
- apps/web/src/components/Notification.jsx
- apps/web/src/styles/notification.css
- apps/web/src/App.jsx (for notification usage)

---

This plan will ensure notifications are user-friendly, visually clear, and dismissible both automatically and manually.

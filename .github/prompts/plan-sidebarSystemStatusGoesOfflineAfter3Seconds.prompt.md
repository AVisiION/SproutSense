Thank you for reporting the issue with the sidebar system status showing "offline" after 3 seconds. Here’s a plan to diagnose and address the problem:

---

## Plan: Sidebar System Status Goes Offline After 3 Seconds

The sidebar system status (Backend, ESP32, ESP32-CAM) is showing "offline" after a few seconds, even though the backend or devices may still be online. This is likely due to how the `systemStatus` state is updated in the `App` component, possibly related to the WebSocket connection or the polling/fetch logic.

**Steps**

1. **Review State Update Logic**
   - Examine how `systemStatus` is set in all relevant `useEffect` hooks and callbacks.
   - Check if the WebSocket connection (`isConnected`) or polling fetches are causing premature "offline" status.

2. **Check WebSocket Integration**
   - Confirm how `isConnected` is determined and how quickly it can toggle to "offline".
   - Review the `useWebSocket` hook and its reconnection logic.

3. **Analyze Polling and Health Checks**
   - Inspect the polling interval and error handling in the main data fetch effect.
   - Ensure that transient network issues or slow responses do not immediately set status to "offline".

4. **Debounce or Delay Status Changes**
   - Consider adding a debounce or grace period before marking a service as "offline" to avoid flickering due to brief disconnects.

5. **Testing and Verification**
   - Simulate backend and device availability/unavailability to confirm the status indicators behave as expected.
   - Check browser console for errors or warnings related to WebSocket or fetch failures.

**Relevant files**
- apps/web/src/App.jsx — All logic for system status, WebSocket, and polling.
- apps/web/src/hooks/useWebSocket.js — WebSocket connection management.
- apps/api/src/app.js, apps/api/api/index.js — Backend health endpoints (if needed for debugging).

**Verification**
1. Observe the sidebar system status for at least 10 seconds after page load.
2. Confirm that status indicators do not flip to "offline" unless the backend or device is truly unreachable for a sustained period (e.g., >5 seconds).
3. Check that reconnecting the backend or device updates the status back to "online" without requiring a page reload.

**Decisions**
- The plan assumes the issue is with frontend polling or WebSocket state handling, not a backend bug.
- Will not change backend code unless a frontend fix is insufficient.

**Further Considerations**
1. If the problem is due to a race condition between polling and WebSocket, recommend unifying status logic or adding a minimum offline threshold.
2. If the backend is slow to respond, consider increasing polling intervals or adding retries.

---

Would you like to proceed with a detailed investigation of the `useWebSocket` logic and the polling effect, or do you have more details about when the "offline" status appears?

# Frontend Guide: Files, Flow, and How Things Work

This document explains the key frontend files in this project and how they fit together. It’s written for beginners and walks through the data flow, components, and CSS classes you’ll see in the code.

## Quick Mental Model

- The app loads and tries to fetch devices from the backend (`http://localhost:8000`).
- If the API is unavailable or empty, it falls back to local `mockData` for demo purposes.
- You can search devices by hostname or IP from the header.
- The sidebar shows live counts (Total, Active, Inactive, Unauthorized).
- The main list shows each device with status and a “Refresh” button for that device.
- Clicking a device opens a modal with detailed info and a port grid indicating status.

---

## Entry Point

- `src/index.tsx`
  - Bootstraps React and renders the `App` component into the `#root` element.
  - Imports global styles from `src/index.css`.

---

## Main App Container

- `src/App.tsx`
  - Responsible for data fetching, filtering, and page layout.
  - Important state:
    - `devices`: The list of devices currently displayed.
    - `selectedDevice`: The device selected for the details modal (or `null`).
    - `isModalOpen`: Whether the details modal is open.
    - `searchTerm`: The current search text.
    - `loading`: Whether the app is loading data.
    - `error`: An error message if the API call fails (currently cleared on fallback).
    - `usingMockData`: Whether the UI is showing `mockData` instead of API data.
    - `refreshingIp`: IP of a device currently being refreshed (disables its button).
  - Data fetching:
    - `fetchDevices()` calls `GET /devices/get_all`.
      - If the response is not OK or returns an empty array, it sets devices from `mockData` and marks `usingMockData = true`.
      - On success with data, it sets `devices` from the API and `usingMockData = false`.
    - `useEffect(() => { fetchDevices(); }, [])` triggers the fetch on first render.
  - Filtering:
    - Converts `searchTerm`, each hostname, and each interface IP to lowercase and checks for inclusion.
    - Matches if either hostname or any interface IP contains the term.
  - Refresh actions:
    - Header “Refresh” button calls `fetchDevices()`.
    - Per-device “Refresh” calls `POST /refresh_one?ip=...` then re-fetches devices.
  - Layout:
    - Renders `Header` (search + refresh), `Sidebar` (stats), `DeviceList` (cards), and `DeviceModal` (details).
    - Shows loading and error states inline.

---

## Shared Types and Mock Data

- `src/types.ts`
  - `NetworkInterface`: `{ interface: string; ip_address: string; status: string }`
  - `NetworkDevice`: `{ Mac: string; hostname: string; interface: NetworkInterface[]; "last updated at": string | { $date: string } }`
    - Note: `"last updated at"` can be a simple string or an object with `$date` (e.g., Mongo-like format). Components handle both.

- `src/data.ts`
  - Exports `mockData` — a sample array of `NetworkDevice` used as a fallback.
  - Useful for development when the backend isn’t running.

---

## Components

- `src/components/Header.tsx`
  - Props: `{ loading, onRefresh, searchTerm, onSearchChange }`.
  - Shows the logo, title, a search input (hidden during loading), and a global “Refresh” button.
  - Uses `forwardRef` so the parent can reference the header if needed.

- `src/components/Sidebar.tsx`
  - Props: `{ devices, usingMockData, loading }`.
  - Computes stats from `devices`:
    - `total`: count of all devices.
    - `active`: device has at least one interface with `status` containing `"up/up"`.
    - `inactive`: device has no `up/up` interfaces and isn’t “Unauthorized”.
    - `unauthorized`: device with `hostname === "Hostname not found"`.
  - Shows a “Using mock data” banner when applicable.

- `src/components/DeviceList.tsx`
  - Props: `{ devices, onDeviceClick, onRefreshDevice, refreshingIp }`.
  - Renders a list of `DeviceListItem` cards. Each card shows:
    - Hostname, primary IP (first interface’s `ip_address`), and MAC.
    - Active/total interface count, and a formatted “Last updated” timestamp.
    - A colored status badge: Active, Inactive, or Unauthorized (derived from hostname + ports).
    - A per-device “Refresh” button that calls `onRefreshDevice(primaryIP)`.
  - Clicking a card opens the modal (event propagation is stopped when pressing the refresh button so it doesn’t open the modal).

- `src/components/Modal.tsx`
  - Props: `{ device, isOpen, onClose }`.
  - Returns `null` if closed or no device is selected.
  - “Device Information” section with Hostname, MAC (with Copy button), and Last Updated (handles either plain string or `{ $date }`).
  - “Interface Details” lists each interface with name, IP (Copy button when meaningful), and status.
  - “Port Status” grid:
    - Small boxes represent ports; coloring reflects interface status:
      - `up/up` → active
      - `not/authorized` → unauthorized
      - everything else → inactive
  - Clicking the dimmed overlay closes the modal; clicking inside the content doesn’t close it.

- `src/components/Logo.tsx`
  - Simple SVG logo with a blue→purple gradient background and linked nodes/edges motif.

---

## Styles and Layout

- `src/index.css`
  - Global font smoothing and base font settings.

- `src/App.css`
  - CSS Variables: `--header-height`, `--sidebar-width` to control layout dimensions.
  - App shell:
    - `.app`: root container.
    - `.app-header`: fixed header at the top with shadow; contains title, search, refresh.
    - `.app-layout`: main area below header using flex layout.
    - `.main-content`: content area to the right of the sidebar; has left margin equal to sidebar width.
  - Sidebar:
    - `.sidebar`: fixed on the left, full height under the header; scrollable; rounded and shadowed.
    - `.sidebar-content`: inner padding wrapper.
    - `.sidebar-mock-banner`: highlighted banner shown when `usingMockData`.
    - `.stat-item` (+ modifiers `.total`, `.active`, `.inactive`, `.unauthorized`): cards with subtle gradients and colored edge bars.
  - Header elements:
    - `.header-container`, `.header-section`, `.refresh-button` (with hover/disabled styles), `.header-search input`.
  - Device list and cards:
    - `.devices-list`: container for the cards.
    - `.device-list-item`: card with hover glow; status modifier classes `.active`, `.inactive`, `.unauthorized` adjust accents.
    - `.device-list-content`: grid-like layout for primary/secondary info + actions.
    - `.device-status-info`: holds the status badge and the per-device `.refresh-device-button`.
    - `.status` + modifiers `.active`, `.inactive`, `.unauthorized`: colored badges.
  - Modal and port grid:
    - `.modal-overlay`: full-screen dimmed backdrop; centers the modal.
    - `.modal-content`: the dialog panel; header (`.modal-header`) + body (`.modal-body`).
    - `.copy-button`: small inline action next to values like MAC/IP.
    - `.port-status`, `.ports-grid`, and individual `.port` boxes with modifier classes:
      - `.port-active` (green), `.port-inactive` (gray/red), `.port-unauthorized` (orange).
  - Responsive tweaks:
    - Media queries adjust header spacing, card layout, and grid density for smaller screens.

Tip: If you want to change the layout quickly, try adjusting the CSS variables at the top of `App.css`:

```css
:root {
  --header-height: 180px;   /* header size */
  --sidebar-width: 300px;   /* sidebar width */
}
```

---

## Data Flow (Step-by-Step)

1. `App` mounts → `fetchDevices()` runs.
2. Try `GET http://localhost:8000/devices/get_all`.
   - Success with data → show that data.
   - Error or empty → load `mockData` and show mock banner.
3. As you type in Search (Header), `searchTerm` updates and filters devices by hostname or IP.
4. Sidebar counts update automatically based on the filtered list.
5. Device list shows cards; click a card to open the modal with details.
6. Click the global Refresh (Header) to refetch all devices.
7. Click a card’s Refresh to `POST /refresh_one?ip=...` for that device, then the list refetches.

---

## Common Gotchas (Beginner Notes)

- CORS/API errors: If the backend isn’t running at `http://localhost:8000`, the app will fall back to `mockData`. That’s expected for development—start the backend to see live data.
- Date format: `"last updated at"` may be a string or `{ $date }`; formatting is handled in components.
- Search scope: The filter checks hostname and every interface’s `ip_address` case-insensitively.
- Unauthorized devices: The UI treats `hostname === "Hostname not found"` as “Unauthorized.”

---

## Where to Customize First

- Text/labels: Change headings and button text directly in the component files.
- Colors/spacing: Edit the CSS variables and the modifier classes in `App.css`.
- Stats logic: Tweak how Active/Inactive/Unauthorized are computed in `Sidebar.tsx`.
- Data shape: Update `types.ts` if your backend payload changes, then adjust components.

---

## File Map (at a glance)

- `src/index.tsx` — App entry and render.
- `src/index.css` — Global base styles.
- `src/App.tsx` — Main state, data fetching, layout.
- `src/App.css` — App, header, sidebar, list, modal styles.
- `src/types.ts` — Shared TypeScript interfaces.
- `src/data.ts` — Local mock dataset used as fallback.
- `src/components/Header.tsx` — Top bar: logo, title, search, refresh.
- `src/components/Sidebar.tsx` — Stats panel + mock data banner.
- `src/components/DeviceList.tsx` — Device cards list + per-device refresh.
- `src/components/Modal.tsx` — Device details modal + port grid.
- `src/components/Logo.tsx` — SVG logo.

If you want, we can add screenshots or inline comments in the code next.

# Release Test Plan

This plan covers end-to-end checks for the booking flow, validation handling, basket management, AI clarifier behaviour, network resilience, and accessibility.

## Pre-test setup
1. From the repository root, start a static server:
   ```bash
   python -m http.server 3000
   ```
2. Open the app at http://localhost:3000 in a modern desktop browser.
3. Reset the page between scenarios to avoid cross-test state.

## Happy path booking
1. Enter a valid registration starting with `AB`, `CD`, or `EF` and a valid postcode; wait for vehicle/location labels to populate.
2. Select a work category and at least one service.
3. Choose driveability, pick an available day and time, and start and complete the AI clarifier questions.
4. Enter contact details (name, email, phone, address, postcode) and proceed to confirm.
5. Verify the confirmation summary lists car, location, services, schedule, driveability, clarifier answers, notes, and contact details.

## Validation errors
1. Attempt to continue from the car step with empty registration or postcode and verify inline error messages.
2. Try advancing without choosing a category or service and confirm the services step error appears.
3. On the details step, leave required contact fields blank or use an invalid email and verify errors block progression.
4. Ensure errors clear once valid inputs are provided.

## Basket add/remove
1. Add multiple services from different categories and confirm the basket list and totals update in both desktop and mobile summaries.
2. Remove a service from the basket and verify it disappears from summaries and totals recalculate.
3. Re-add the removed service to ensure duplication rules permit re-selection and totals update correctly.

## AI clarifier stop conditions
1. Start the clarifier and answer each question until completion; confirm the clarifier marks as complete and cannot be restarted inadvertently.
2. Use any available stop/close control mid-flow (or navigate away) and ensure the clarifier marks as stopped with partial answers saved and no further prompts shown.
3. Confirm moving forward while clarifier is incomplete shows any expected warnings or prevents progression if required by the UI.

## Network failure handling
1. Simulate offline/blocked requests (e.g., enable "Offline" in DevTools or block `services.json`).
2. Reload the app and verify the category grid shows the "Unable to load services right now." message and no broken UI renders.
3. Restore network, reload, and ensure services load normally.

## Accessibility checks (keyboard/modal focus)
1. Navigate the entire flow using only the keyboard (Tab/Shift+Tab/Enter/Space) and verify focus order is logical and all controls are reachable.
2. Open the service detail modal from a service card and confirm focus moves to the modal close or heading.
3. Attempt to tab while the modal is open and verify focus stays trapped inside; closing the modal should return focus to the triggering control.
4. Trigger inline validations and ensure error text is associated with fields for screen readers (via focus movement or described-by behaviour if implemented).

## Pre-release checklist
- [ ] All scenarios above exercised on at least one evergreen Chromium-based browser and one Gecko-based browser (e.g., Firefox).
- [ ] No blocking errors in the developer console during tests.
- [ ] Network failure and recovery verified.
- [ ] Keyboard-only and modal focus behaviours confirmed.
- [ ] Test evidence (notes or screenshots) captured for the release record.

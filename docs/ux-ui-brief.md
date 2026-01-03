# UX/UI layout brief

## Objective
Design AI-generated page layouts for Ringwood Mobile Mechanics that feel trustworthy, efficient, and mobile-first. The flow should guide customers from vehicle lookup to booking confirmation with clear progress cues, while an admin console enables staff to review and update jobs.

## Global layout patterns
- **Top bar:** Sticky header with logo and running total; compact on mobile.
- **Progress tracker:** Horizontal steps showing the current stage of the booking.
- **Cards:** White panels for each primary form area; use subtle shadows and rounded corners.
- **Two-column grids (desktop) / single column (mobile):** Primary content on the left, basket/summary on the right.
- **Floating action bar:** Persistent bottom bar for Back/Continue CTAs.
- **Modal:** Centered dialog for service details and add-to-basket actions.

## Booking flow pages
### 1) Vehicle lookup (step-car)
- **Hero card:**
  - Title: “Find your car”
  - Subtitle: “Enter your reg and postcode so we can pull your vehicle details and find a nearby mechanic.”
  - Inputs: Registration (placeholder “e.g. AB12 CDE”), Postcode (placeholder “e.g. RH4 1SW”), primary button “Lookup vehicle”.
  - Helper text below button: “No reg? Switch to test car to explore the flow.”
- **Lookup mode pill toggle:** Left helper label “Lookup mode”, right aligned pills “DVLA lookup” (default) and “Use test car” with active state copy “Test car selected for demo”.
- **Lookup chips:** Inline badges that render after lookup: vehicle make/model/year (e.g. “BMW 3 Series 2017”), fuel type, color; postcode chip (e.g. “Postcode: RH4 1SW”).
- **Error state:** Inline alert under chips with icon and text “We couldn’t find that vehicle. Check your reg/postcode or try the test car option.”
- **Summary box:** Compact recap card showing “Vehicle: <make/model/year>”, “Postcode: <postcode>”, and a muted line “You can edit this above.”

### 2) Service selection (step-category)
- **Grid layout:** Left card for categories and services; right column basket. Section heading “Choose your services”.
- **Category grid:** Tiles containing icon, title (e.g. “Diagnostics”), and short description (e.g. “Check engine light, warning messages”). Tile footer badge “From £X”. Active state shows “Selected”.
- **Service list:** Within chosen category, rows show name (e.g. “Full service”), price (e.g. “£169”), duration (e.g. “~90 mins”), short blurb “Includes oil, filters, and safety checks”, and info icon labeled “Details”. Add button text “Add to basket”.
- **Error areas:** Inline alert above category grid “We’re having trouble loading categories. Retry?” and another above service list “Services failed to load. Please refresh.”
- **Basket (desktop):** Sticky sidebar titled “Your booking”. Each line item shows service name, quantity, price, and “Edit”/“Remove” text buttons. Totals area with “Subtotal”, “Call-out fee”, “Total today £X”. CTA button “Continue”.
- **Basket (mobile):** Collapsible panel titled “Your booking” mirroring basket contents with a summary chip “Total £X”.

### 3) Contact & availability (step-details)
- **Context summary:** Card titled “Booking summary” listing vehicle line (“BMW 3 Series 2017”), selected services bullet list, and running total line “Total: £X”.
- **Form grid:** Input labels: “Full name”, “Email address”, “Phone number”, “Street address”, “Postcode”. Placeholders match label (e.g. “e.g. Jane Doe”). Required markers for name/email/phone/postcode.
- **Issue description:** Textarea label “Tell us about the issue” with placeholder “Warning lights, noises, or recent work. The more detail, the better.”
- **AI clarifier block:** Sub-card titled “Get help describing the issue”. Helper copy: “We’ll ask a few quick questions to make sure we send the right mechanic.” Button text “Start AI helper”. Conversation area shows alternating Q/A bubbles (e.g. Q: “When did the issue start?” A: “Two days ago”).
- **Driveable pills:** Group label “Is the car driveable?” with pills “Yes, it’s driveable” and “No, need a mobile visit”.
- **Week availability grid:** Heading “When are you free?”; each day column with chips “Morning”, “Afternoon”, “Evening”. Selected state shows check icon.
- **Inline validation:** Alert near CTA reading “Please complete required fields before continuing.”
- **Basket (desktop):** Sticky right column mirroring step 2 style with CTA “Review & confirm”.

### 4) Confirmation (step-confirm)
- **Summary box:** Card titled “Confirm your booking” with sections: Vehicle (make/model/year), Services (list with prices), Availability (selected slots), Contact (name, phone, email), and Location (address/postcode). Each section has “Edit” link text.
- **Reassurance copy:** Paragraph: “A mechanic will review your request and confirm any parts before charging you. You’ll get a text and email with next steps.”
- **Action area:** Bottom floating bar with secondary button “Back” and primary “Submit booking”. Inline note “You can still edit before submission.”

### 5) Modal (info-modal)
- **Dialog shell:** Title matches service name (e.g. “Full service”). Lead paragraph describing what’s included (e.g. “Comprehensive service including oil, filters, fluid top-up, and safety checks.”). Bullet list of inclusions, a price line “From £X”, duration “Approx. 90 mins”, and primary button “Add to basket”. Secondary link “Close”.
- **Backdrop:** Dim overlay with click-to-dismiss and ESC support. Below modal, keep page scroll locked.

## Admin console (admin.html)
- **Credentials panel:** Card titled “API credentials” with two inputs: “API base URL” (placeholder “https://api.example.com”), “Admin token” (placeholder “Paste token”). Save status text “Saved”/“Not saved yet”. Button “Save credentials”.
- **Job list:** Table with headers “Booking ID”, “Customer”, “Vehicle”, “Services”, “Status”, “Created”, “Updated”. Each row example: Booking ID “RM-1042”, Customer “Jane Doe”, Vehicle “BMW 3 Series 2017”, Services “Full service, Diagnostics”, Status pill, timestamps like “09:42”/“Today”.
- **Status controls:** Within each row, pill buttons “Pending”, “In progress”, “Completed”, “Cancelled”; active pill highlighted. Optional dropdown alternative with same labels.
- **Filters/search:** Row above table with text input placeholder “Search by name, reg, or ID”, dropdown “Status: Any/Pending/In progress/Completed/Cancelled”, and button “Apply filters”.
- **Feedback area:** Inline alert above table “Couldn’t load jobs. Check credentials and retry.” Toast bottom-right “Changes saved”.

## Accessibility & responsiveness
- Minimum 16px fonts, high-contrast buttons, and focus outlines.
- Mobile-first stacking with gutters; sticky CTAs stay above keyboard on mobile.
- ARIA labels for inputs, toggles, pills, and modal dialog semantics.

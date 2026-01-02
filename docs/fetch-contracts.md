# Frontend fetch helper contracts

The booking UI can call the Supabase Edge Functions directly. Each function follows the same CORS pattern and expects `Content-Type: application/json`.

## `lookup-vehicle`
- **Request**: `{ "reg": string, "postcode"?: string }`
- **Response**: `{ reg: string; postcode?: string; vehicle?: { make: string; model: string; year: string; fuelType?: string; colour?: string }; source: "dvla" | "stub"; dvlaReady: boolean }
- **Notes**: Currently returns stub data but the shape is ready for DVLA integration.

## `ai-clarify`
- **Request**: `{ "notes"?: string, "answers"?: string[] }`
- **Response**: `{ promptSummary: string; questions: string[]; completed: boolean }`
- **Notes**: Uses fallback clarifier questions when an AI provider is unavailable and surfaces remaining questions to ask.

## `submit-job`
- **Request**: 
  ```json
  {
    "reg": "AB12 CDE",
    "postcode": "SW1A 1AA",
    "areaLabel": "Westminster",
    "vehicle": { "make": "Ford", "model": "Focus", "year": "2018" },
    "services": [{ "id": "oil-change", "name": "Oil change", "price": 79.99 }],
    "availability": { "day": "Monday", "slot": "PM" },
    "clarifier": { "questions": ["..."], "answers": ["..."] },
    "contact": {
      "name": "Alex Driver",
      "email": "alex@example.com",
      "phone": "+447700900000",
      "addressLine": "10 Downing St",
      "addressPostcode": "SW1A 2AA"
    },
    "notes": "Brake noise when slowing down",
    "driveable": true
  }
  ```
- **Response**: `{ job: <row from jobs table>, sms: { sid?: string; to?: string; skipped?: boolean; reason?: string } }`
- **Validation**: Requires `reg`, `postcode`, `contact.name`, `contact.phone`, `contact.addressLine`, `contact.addressPostcode`, and `services` to be an array. Registration and postcode are normalised to uppercase before insert.

All functions reply with standard error shapes: `{ "error": string, "details"?: string[] }` and HTTP status codes (400 for validation errors, 500 for server issues).

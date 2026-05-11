## ADDED Requirements

### Requirement: API accepts requests from approved origins

The API SHALL respond with `Access-Control-Allow-Origin` header matching the request origin when the request origin is in the approved allowlist. Approved origins are `https://travel-itinerary-web.vercel.app` and `http://localhost:3000`. The API SHALL NOT include `Access-Control-Allow-Origin` for requests from other origins.

The API SHALL set `Access-Control-Allow-Credentials: true` on all cross-origin responses.

#### Scenario: Approved origin receives CORS headers

- **WHEN** a browser sends a request with `Origin: https://travel-itinerary-web.vercel.app`
- **THEN** the response includes `Access-Control-Allow-Origin: https://travel-itinerary-web.vercel.app` and `Access-Control-Allow-Credentials: true`

#### Scenario: Unapproved origin receives no CORS header

- **WHEN** a browser sends a request with `Origin: https://malicious.example.com`
- **THEN** the response does NOT include `Access-Control-Allow-Origin`

#### Scenario: OPTIONS preflight succeeds

- **WHEN** a browser sends `OPTIONS /trips` with `Origin: https://travel-itinerary-web.vercel.app`
- **THEN** the API responds with status 204 and includes `Access-Control-Allow-Methods: GET,POST,PATCH,DELETE,OPTIONS` and `Access-Control-Allow-Headers: Content-Type,Authorization`

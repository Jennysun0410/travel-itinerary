## MODIFIED Requirements

### Requirement: Gmail scan request accepts optional trip_id

The `POST /email/gmail/scan` endpoint SHALL accept an optional `trip_id` field in the request body. When present, the endpoint SHALL query the trips table for `start_date` and `end_date` and apply trip-date filtering during import. When absent, import behaviour is unchanged.

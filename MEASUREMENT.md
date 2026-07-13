# Measurement design

Shared measurement logic lives in `assets/tracking.js`.

Update `variantId` in that file for every measurable LP release.

Current variant:

```text
2026-07-11_lp_v1
```

## Events

| Event | Trigger |
| --- | --- |
| `page_view` | Any tracked page is loaded |
| `lp_scroll` | LP scroll reaches 25%, 50%, 75%, 90% |
| `cta_click` | Primary CTA click |
| `form_view` | `/form` page load |
| `form_scroll` | Form page scroll reaches 25%, 50%, 75%, 90% |
| `form_start` | First focus into a form field |
| `form_error` | Required/type/API/custom form error |
| `form_submit` | Form submit attempt |
| `form_success` | `/thanks` page consumes a pending successful submission |

## Common parameters

All events include:

```text
page_path
page_title
device
screen_width
source
medium
campaign
campaign_id
adgroup
keyword
search_term
referrer
variant_id
```

## Event-specific parameters

| Event | Parameters |
| --- | --- |
| `lp_scroll`, `form_scroll` | `scroll_percent` |
| `cta_click` | `cta_id`, `cta_location`, `link_url` |
| `form_view`, `form_start`, `form_submit`, `form_error` | `form_id` |
| `form_success` | `submission_id`, `form_id` |
| `form_start`, `form_error` | `field_name` |
| `form_error` | `error_type` |

## Recommended GTM setup

1. Keep the existing Google Tag / GA4 configuration tag on all pages.
2. Create Custom Event triggers for each event above.
3. Create one GA4 Event tag for each event, or a reusable GA4 Event tag pattern if the GTM workspace supports it.
4. Pass the common parameters and event-specific parameters into GA4.
5. In GA4 Admin > Data display > Events, mark `form_success` as a key event.
6. Use GA4 Funnel Exploration with: `page_view` -> `lp_scroll` -> `cta_click` -> `form_view` -> `form_scroll` -> `form_start` -> `form_submit` -> `form_success`.

## Operational notes

- `form_submit` means the submit button was attempted.
- `form_success` means the lead was actually completed and should be used as the main conversion.
- `form_success` only fires when the form API returns success, stores a pending submission in `sessionStorage`, and the `/thanks` page consumes it.
- The pending submission is deleted and its `submission_id` is marked as processed before `dataLayer.push`, so reloads, direct `/thanks` visits, and browser back/forward navigation do not duplicate `form_success`.
- A second successful form submission creates a new `submission_id`, allowing one new `form_success` event.
- Scroll events are deduplicated per page view.
- Attribution parameters are read from UTM parameters and Google Ads click IDs, then persisted in `sessionStorage` during the session.
- `cta_id` is normalized to `hero`, `middle`, `bottom`, or `floating`.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.1] - 2026-02-24

### Added

- Internationalization with 10 built-in languages (en, zh, hi, es, fr, ar, pt, de, ru, ja)
- `translations` option for overriding individual UI strings
- `resolveTranslations()` exported from public API
- RTL layout support for Arabic and other right-to-left locales
- Home/End keys to jump to first/last day of the month
- Page Up/Page Down keys to move focus by one month
- Auto-scroll when keyboard focus moves beyond the visible two-month window
- Tab trapping within the dialog (presets, grid, footer cycle)
- Disabled date skipping — arrow and page keys automatically advance past dates outside `minDate`/`maxDate`
- `startOfMonth()`, `endOfMonth()`, `clampDate()`, and `normalizeAndClampRange()` calendar utilities

### Changed

- ARIA labels, preset labels, and button text use translated strings instead of hardcoded English
- CSS uses logical properties (`border-inline-end`, `text-align: start`) for RTL compatibility
- Popup entry animation only plays on open, not on every rerender

### Fixed

- Preset ranges now clamped to `minDate`/`maxDate` bounds
- `setRange()` normalizes, clamps, and rerenders when the popup is open
- Focus restoration falls back to first enabled date when focused date is disabled or off-screen
- Invalid locale strings no longer throw — gracefully falls back to `en-US`
- Popup position clamped to viewport bounds to prevent off-screen rendering

## [0.1.0] - 2026-02-24

### Added

- Dual side-by-side calendar layout
- Built-in preset ranges (Today, Yesterday, Last 7/14/30 Days, Last Month)
- Custom preset support
- Full keyboard navigation and ARIA accessibility
- Theming via `TwoCalTheme` and CSS custom properties
- Locale-aware formatting via `Intl` API
- Min/max date constraints
- Configurable first day of week (Sunday or Monday)
- Popup placement with automatic flip when clipped
- Programmatic API: `open()`, `close()`, `getRange()`, `setRange()`, `setTheme()`, `destroy()`

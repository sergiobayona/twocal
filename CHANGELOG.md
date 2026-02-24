# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Home/End keys to jump to first/last day of the month
- Page Up/Page Down keys to move focus by one month
- Auto-scroll when keyboard focus moves beyond the visible two-month window
- Tab trapping within the dialog (presets, grid, footer cycle)
- Disabled date skipping — arrow and page keys automatically advance past dates outside `minDate`/`maxDate`
- `startOfMonth()` and `endOfMonth()` calendar utilities

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

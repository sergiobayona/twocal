# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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

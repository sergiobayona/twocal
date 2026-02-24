# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TwoCal is a framework-agnostic date range picker library written in TypeScript. It renders as a popup with dual side-by-side calendars, a presets sidebar, and apply/cancel footer. It ships as both ES module and UMD via Vite's library mode.

## Coding Style

Clarity is king. Write code that reads like well-written prose. Choose names that reveal intent — if a comment is needed to explain what code does, rename it. Comments should explain why, never what.
Keep things small and focused. Every function does one thing. Every class has one responsibility. If you can't describe it without "and," split it. Favor short methods, shallow nesting, and early returns.
Simplicity over cleverness. Write the most obvious solution that works. No clever one-liners, no premature abstractions, no speculative generality. Solve the problem at hand — YAGNI.
Manage complexity through separation. Keep components loosely coupled and highly cohesive. Program to interfaces, not implementations. Favor composition over inheritance. Isolate what varies behind clear boundaries.
Minimize state. Prefer immutability and pure functions. The less mutable state you manage, the fewer bugs you create.
Fail loudly. Never swallow errors or return nil silently. Make failures visible, specific, and actionable.
Don't repeat yourself — but don't over-abstract. Extract duplication when a clear pattern emerges, not before. Two instances of similar code is often fine; three is a signal.
Leave the codebase cleaner than you found it. Delete dead code, remove commented-out blocks, and clean up unused abstractions. Version control remembers.
Consistency matters. Follow the existing conventions of the codebase in style, naming, patterns, and structure. Surprise is the enemy.
Design for change and testability. Use dependency injection, clear interfaces, and small surface areas. Expose only what's necessary. Write tests that give confidence to refactor, not tests that cement implementation details.

## Commands

- **Build:** `npm run build` — produces `dist/twocal.js` (ESM) and `dist/twocal.umd.cjs` (UMD) with types
- **Dev server:** `npm run dev` — serves `index.html` demo page with HMR
- **Type check:** `npm run lint` — runs `tsc --noEmit`
- **Run all tests:** `npm run test:run`
- **Run tests in watch mode:** `npm run test`
- **Run a single test file:** `npx vitest run tests/state.test.ts`
- **Run tests with coverage:** `npm run test:coverage`

## Architecture

The library follows a unidirectional data flow pattern (action → reducer → render):

- **`types.ts`** — All interfaces and type definitions. `StateAction` is a discriminated union defining every possible user interaction.
- **`state.ts`** — Pure state management. `createInitialState()` and `reduce(state, action)` implement a Redux-style reducer. Selection goes through three phases: `idle` → `start_selected` → `range_complete`.
- **`twocal.ts`** — The `TwoCal` class is the public API and orchestrator. It owns the state, dispatches actions, manages the popup lifecycle (mount/unmount/rerender), and handles side effects (applying ranges, reverting on cancel). Hover-only changes use a fast DOM-patching path (`updateHoverPreview`) instead of full rerender.
- **`render.ts`** — Pure functions that produce DOM elements from state and config. `renderPopup()` builds the entire popup tree. Uses a small `el()` helper instead of innerHTML.
- **`events.ts`** — Event delegation using `data-tc-action` and `data-tc-date` attributes on DOM elements. Provides `bindPopupEvents`, `bindTriggerEvents`, and `bindDocumentEvents`, each returning a cleanup function.
- **`calendar.ts`** — Date math utilities using a plain `CalendarDate` value object (`{year, month, day}`) instead of native `Date`. Includes `buildCalendarMonth()` which produces a 6-row grid structure.
- **`styles.ts`** — Dynamic CSS injection with scoped prefixes (`tc-1`, `tc-2`, etc.) to allow multiple instances. `buildStylesheet()` generates the full CSS from a resolved theme. CSS custom properties (`--tc-*`) drive theming.
- **`position.ts`** — Popup positioning relative to the trigger element with viewport clamping and bottom/top flip.
- **`presets.ts`** — Default preset ranges (Today, Yesterday, Last 7/30 Days, This/Last Month).
- **`aria.ts`** — ARIA attribute builders for dialog, grid, and gridcell roles.

## Key Patterns

- **CalendarDate over native Date:** The library uses `{year, month, day}` plain objects throughout. `month` is 1-indexed (1=January). Conversion to/from `Date` is isolated in `calendar.ts`.
- **Scoped CSS prefixes:** Each `TwoCal` instance gets a unique style prefix (e.g., `tc-1`) so multiple instances don't clash. All CSS class names and selectors use this prefix.
- **Event delegation:** DOM events are handled via `data-tc-*` attributes rather than per-element listeners. Click/hover handlers walk up to find `[data-tc-action]` elements.
- **Immutable state updates:** The reducer returns new state objects; reference equality (`===`) is used to skip unnecessary rerenders.

## TypeScript Config

Strict mode is enabled with `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, and `exactOptionalPropertyTypes`. Target is ES2022.

## Test Environment

Tests use Vitest with jsdom. Test files live in `tests/` and mirror source file names (e.g., `state.test.ts` tests `state.ts`). Coverage excludes `src/index.ts` (re-export barrel).

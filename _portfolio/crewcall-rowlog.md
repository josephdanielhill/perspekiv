---
title: "CrewCall – Row Log Feature Design"
date: 2026-09-01
tags: [product-design, ui-ux, mobile-first]
status: launched
images: ["/portfolio/crewcall-rowlog/screenshot.png"]
brief: A touch-friendly end-of-session workout logbook and chronological history viewer for CrewCall (Interval Rowing Coach).
models: [Gemini 2.5 Flash, Claude 3.5 Sonnet]
tools: ["HTML5", "CSS3", "Playwright", "Stripe-Apple Aesthetic System"]
notes:
  - "Designed with a strict 0/10 slop score – zero generic mesh gradients, custom interval color palette."
  - "Features direct local file syncing (showDirectoryPicker) for Chrome/Edge with automatic localStorage fallback for Safari."
  - "Includes a 1-click 'Re-row Session' feature that hydrates past workout sequences straight back into the setup builder."
---

CrewCall needed a minimal, fast, touch-friendly local workout logbook (ROWLOG) designed to let indoor rowers save workouts immediately after completion without cloud latency or account creation.

The design system uses Space Grotesk for crisp tabular metrics and split times, paired with Hanken Grotesk for controls. Workout cards feature color-coded sequence bars matching CrewCall's interval intensity tokens (Coral Red for Extreme, Amber for Hard, Ocean Blue for Medium, Mint for Low).

The feature hands off directly to engineering on Linear (BLD-839) with interactive HTML prototypes and direct schema support for local JSON file writing.

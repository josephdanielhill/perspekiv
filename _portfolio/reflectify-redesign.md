---
title: "Reflectify – Complete Product & Visual Redesign"
date: 2026-09-07
tags: [product-design, brand-identity, scandi-botanical, web-app]
status: launched
images: ["/portfolio/reflectify-redesign/screenshot.png", "/portfolio/reflectify-redesign/job-reflection.jpg", "/portfolio/reflectify-redesign/reflection-path.jpg"]
brief: Complete visual and UX overhaul of Reflectify into a warm, Scandi-botanical reflection sanctuary with custom vector artwork, clear typography, and refined terminology.
models: [Gemini 2.5 Flash, ByteDance Seedream 5.0 Pro]
tools: ["HTML5", "CSS3", "JavaScript", "Stripe-Apple Aesthetic System", "Cloudflare Pages"]
notes:
  - "Designed with a strict 0/10 slop score – zero generic blue/purple tech gradients, grounded Scandi organic palette."
  - "Replaced cold 'report card' terminology with warm, growth-oriented 'reflection summary'."
  - "Custom AI illustration system generated matching botanical vector art across hero banners and interactive tool cards."
  - "Fully responsive with mobile-optimized full-width CTAs and high-contrast pill actions."
---

Reflectify underwent a complete end-to-end visual identity and product redesign to elevate its experience from a plain web utility into a serene, intentional reflection sanctuary.

### Motivation & Brand Vision
The original design felt overly formal and utility-driven, using rigid terms like "report card" and generic UI patterns that failed to foster a calm, thoughtful atmosphere. The goal of the redesign (PRV-5) was to create a grounded, organic environment that encourages deep personal and professional reflection.

### Scandi-Botanical Aesthetic System
We anchored the brand in a Scandinavian botanical design system featuring:
- **Palette**: Deep forest moss green (`#2D4A3E`), soft sage (`#4E7C67`), warm terracotta (`#E8A88A`), and a soft paper-grain sand background (`#EBF3EF` / `#F7F5F0`).
- **Typography**: Clean serif brand accents paired with modern sans-serif readability for structured reflection frameworks.
- **Custom Artwork**: A unified illustration suite created using Seedream 5.0 Pro, depicting quiet morning sanctuaries, sunlight pathways, desk reflection setups, and growing saplings.

### Core Enhancements & Tooling
- **Header & Navigation**: Removed full-width top border lines and experimental badges to spotlight a prominent, elegant SVG logo mark (`reflectify-logo-primary.svg`).
- **Tool Card Media Banners**: Updated card UI in `script.js` with integrated 180px artwork header banners, micro-hover lifts (`translateY(-2px)`), soft shadows, and full-width primary CTA buttons (`Start reflection →`).
- **Copy Discipline**: Systematically updated all copy across the app to replace cold "report card" phrasing with warm "reflection summary".
- **Mobile Responsiveness**: Standardized CTA actions on mobile viewports (`<= 600px`) to full-width stacked columns for touch precision.

The redesign is live on Cloudflare Pages (`staging` branch) and fully deployed to production.

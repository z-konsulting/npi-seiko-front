# Cost Seiko Front - Project Memory

## Architecture
- Angular 21 + PrimeNG 21.1.1, standalone components, OnPush change detection
- Global styles in `src/app/styles/` with `theme.scss` forwarding 26+ component SCSS files
- Design tokens defined in `global.scss` (:root CSS custom properties + SCSS variables)
- `styles.scss` is the entry point (imports theme + global + primeicons)

## Design System (established)
- **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- **Radius**: `--radius-sm` (6px), `--radius-md` (10px), `--radius-lg` (14px)
- **Colors**: Primary #0a84c1, Success #48b461, Danger #dc3545, Warn #f97316
- **Typography**: Inter var, 14px base, 600-700 headings

## Key Patterns
- All admin pages use `<p-card>` > `<p-table class="app-table">` pattern
- Required field indicators use `.required-indicator` class (not inline `style="color: red"`)
- Action columns use `class="col-actions"` on both `<th>` and `<td>`
- Card headers: single `<div class="card-header">` wrapper (NOT double nested)
- Modal footers: `class="modal-actions-footer-end"` for consistent bottom action bar

## Gotchas
- Don't use `darken()` SCSS function (deprecated) - use `color.adjust()` or `color.scale()`
- Don't use `::ng-deep` - it's banned in CLAUDE.md
- Toast colors are intentionally different from global semantic colors (more muted)
- Accordion had a CSS bug: duplicate `.danger` where one should be `.success` (fixed)

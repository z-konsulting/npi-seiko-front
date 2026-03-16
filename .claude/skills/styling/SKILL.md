# Styling Architecture

## File Structure

Located in `src/app/styles/`:

- `global.scss` - Global variables and base styles
- `theme.scss` - PrimeNG theme overrides (imports component styles)
- `components/_[component].scss` - Individual PrimeNG component customizations

## Styling a PrimeNG Component

1. Create `src/app/styles/components/_[component-name].scss`
2. Import in `src/app/styles/theme.scss`

### Example

```scss
// src/app/styles/components/_button.scss
.p-button {
  border-radius: 4px;

  &.p-button-primary {
    background-color: #007fbe;
  }
}
```

```scss
// src/app/styles/theme.scss
@import "./components/button";
@import "./components/dialog";
@import "./components/table";
```

## Theme Configuration

Custom PrimeNG preset in `src/app/app.config.ts`:

```typescript
providePrimeNG({
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: false,
      cssLayer: false,
    },
  },
});
```

Primary color: `#007fbe`

## Component-Specific Styles

Each component has its own stylesheet:

```scss
// src/app/components/user-card/user-card.component.scss
:host {
  display: block;
  padding: 1rem;
}

.user-card {
  border: 1px solid #ddd;
  border-radius: 4px;

  &__header {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  &__content {
    color: #666;
  }
}
```

## Global Variables

global variable is in src/app/styles/global.scss

```scss
//In root part
:root {
}
```

## Responsive Design

```scss
// Mobile first approach
.my-component {
  padding: 1rem;

  // Tablet
  @media (min-width: 768px) {
    padding: 1.5rem;
  }

  // Desktop
  @media (min-width: 1024px) {
    padding: 2rem;
  }
}
```

## BEM Naming Convention

Use BEM (Block Element Modifier) for component styles:

```scss
.user-card {
  // Block

  &__header {
    // Element
  }

  &__title {
    // Element
  }

  &--featured {
    // Modifier
  }

  &--compact {
    // Modifier
  }
}
```

```html
<div class="user-card user-card--featured">
  <div class="user-card__header">
    <h3 class="user-card__title">John Doe</h3>
  </div>
</div>
```

## PrimeNG Table Classes (REQUIRED)

**All PrimeNG tables MUST use these classes:**

### Table Container

```html
<p-table class="app-table" [value]="items" dataKey="uid">
  <!-- table content -->
</p-table>
```

The `app-table` class is **REQUIRED** for all tables and provides:

- Consistent spacing and padding
- Proper border styling
- Responsive behavior
- Standard cell alignment

### Column-Specific Classes

**Action columns:**

```html
<th class="col-actions">{{ TableColsTitle.ACTIONS }}</th>
<td class="col-actions">
  <p-button [icon]="Icons.PENCIL"></p-button>
</td>
```

**Centered columns (for checkboxes, badges, etc.):**

```html
<th class="col-center">{{ TableColsTitle.ACTIVE }}</th>
<td class="col-center">
  <p-checkbox [(ngModel)]="item.active"></p-checkbox>
</td>
```

**Bold text cells:**

```html
<td class="text-bold">{{ item.name }}</td>
```

### Empty Message Template

**ALWAYS include an empty message template:**

```html
<ng-template pTemplate="emptymessage">
  <tr class="p-datatable-emptymessage">
    <td colspan="10">No data</td>
  </tr>
</ng-template>
```

### Table Structure Rules

1. ✅ **ALWAYS** use `class="app-table"` on `<p-table>` elements
2. ✅ **ALWAYS** use `class="col-actions"` for action columns
3. ✅ **ALWAYS** use `class="col-center"` for centered columns
4. ✅ **ALWAYS** use `class="text-bold"` for emphasized text
5. ✅ **ALWAYS** include an `emptymessage` template
6. ❌ **NEVER** use inline `[tableStyle]` - styling is handled by `app-table` class

### Expanded Rows (Row Expansion)

**For tables with expandable rows (e.g., master-detail pattern):**

#### HTML Structure

```html
<p-table [expandedRowKeys]="expandedRows" class="app-table" dataKey="uid">
  <!-- Main body template -->
  <ng-template
    let-item
    let-expanded="expanded"
    let-ri="rowIndex"
    pTemplate="body"
  >
    <tr
      [class.row-expanded]="expanded"
      [class.row-even]="ri % 2 === 0"
      [class.row-odd]="ri % 2 !== 0"
    >
      <td>
        <p-button
          [icon]="expanded ? Icons.CHEVRON_DOWN : Icons.CHEVRON_RIGHT"
          [pRowToggler]="item"
        />
      </td>
      <!-- other cells -->
    </tr>
  </ng-template>

  <!-- Expansion template (PrimeNG 21 syntax) -->
  <ng-template #expandedrow let-item>
    <tr class="expanded-row">
      <td class="expansion-cell" colspan="8">
        <div class="expansion-container">
          <!-- expanded content here -->
        </div>
      </td>
    </tr>
  </ng-template>
</p-table>
```

#### Required Classes

- **`row-expanded`**: Applied to the main row when expanded (provides highlight)
- **`row-even`/`row-odd`**: Manual striping based on `rowIndex` (prevents color shift when rows expand)
- **`expanded-row`**: Applied to the expansion template `<tr>` (transparent background, no hover)
- **`expansion-cell`**: Applied to the `<td>` in expansion template (styling for the cell)
- **`expansion-container`**: Applied to the content `<div>` (border, padding, shadow)

#### Why Manual Striping?

When using PrimeNG's default `:nth-child()` striping, expanding a row inserts the expansion template into the DOM, which
shifts the position of subsequent rows and breaks the alternating colors. Manual striping based on `rowIndex` solves
this.

### Global vs Component Styles

#### Global Styles (src/app/styles/)

Use for:

- PrimeNG component overrides (buttons, dialogs, tables, etc.)
- Shared patterns used across multiple components
- Theme variables and color schemes
- Layout utilities

All global styles are automatically available to all components.

#### Component-Specific Styles

Use for:

- Styles unique to a single component
- Business logic-specific layouts
- Component-internal structure

**IMPORTANT:** Never add global table/PrimeNG overrides in component stylesheets. Always use
`src/app/styles/components/_table.scss` or the appropriate global file.

## ::ng-deep Usage Rules (CRITICAL)

### ❌ NEVER Use Standalone ::ng-deep

```scss
// ❌ WRONG - This leaks to global scope
::ng-deep .p-button {
  color: red;
}
```

### ✅ ALWAYS Use :host ::ng-deep in Component Styles

```scss
// ✅ CORRECT - Scoped to component
:host ::ng-deep .p-button {
  color: red;
}
```

### ✅ BEST PRACTICE - Avoid ::ng-deep Entirely

Instead of using `::ng-deep` in component stylesheets:

1. **Add styles to global files** (`src/app/styles/components/*.scss`) if they apply to multiple components
2. **Use custom CSS classes** on PrimeNG components and style those classes without `::ng-deep`
3. **Only use `:host ::ng-deep`** when absolutely necessary for component-specific PrimeNG customization

### Examples

#### Bad - Styling PrimeNG in Component File

```scss
// ❌ src/app/components/my-component/my-component.component.scss
::ng-deep .app-table {
  .p-datatable-tbody > tr {
    background: red;
  }
}
```

#### Good - Use Global Styles

```scss
// ✅ src/app/styles/components/_table.scss
.app-table {
  .p-datatable-tbody > tr {
    background: red;
  }
}
```

#### Acceptable - Scoped PrimeNG Override

```scss
// ✅ src/app/components/my-component/my-component.component.scss
:host ::ng-deep .p-dialog {
  width: 90vw; // Component-specific dialog width
}
```

### When to Use Each Approach

| Scenario                                   | Solution                                |
| ------------------------------------------ | --------------------------------------- |
| Style applies to all tables                | Add to `_table.scss`                    |
| Style applies to all buttons               | Add to `_button.scss`                   |
| Style specific to one component's dialog   | Use `:host ::ng-deep` in component SCSS |
| Style specific to component HTML structure | Use regular CSS in component SCSS       |

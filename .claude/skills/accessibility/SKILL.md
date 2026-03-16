# Accessibility (MANDATORY)

All components and pages MUST:

## Requirements

- ✅ Pass all **AXE accessibility checks** (zero violations)
- ✅ Meet **WCAG AA** minimum standards:
    - Color contrast ratios (4.5:1 for text, 3:1 for large text)
    - Keyboard navigation support (all interactive elements accessible)
    - Focus management (visible focus indicators, logical tab order)
    - ARIA attributes where needed (labels, roles, states)
    - Semantic HTML elements
    - Alt text for all images
    - Form labels and error messages
    - Skip navigation links for main content
- When create a form with label and input use the app-input-container
-

## Examples

### Accessible Form

```html
<!-- ✅ GOOD: Accessible form -->
<!-- Use the app-input-container component to create a form with label and input -->
<app-input-container>
  <label for="name">Name</label>
  <input id="name" type="text" [formControl]="nameControl" />
</app-input-container>
<!--otherwise use the following markup:-->
<label for="email">Email Address</label>
<input
  id="email"
  type="email"
  [formControl]="emailControl"
  aria-required="true"
  [attr.aria-invalid]="emailControl.invalid"
  aria-describedby="email-error"
/>
@if (emailControl.invalid && emailControl.touched) {
<span id="email-error" role="alert"> Please enter a valid email address </span>
}
```

### Accessible Button

```html
<!-- ✅ GOOD: Accessible button -->
<p-button
  type="button"
  (onClick)="deleteUser()"
  [attr.aria-label]="'Delete user ' + user.name"
>
  <i class="pi pi-trash" aria-hidden="true"></i>
</p-button>
```

### Accessible Navigation

```html
<!-- Skip link for keyboard users -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<nav aria-label="Main navigation">
  <ul>
    <li><a href="/home">Home</a></li>
    <li><a href="/users">Users</a></li>
  </ul>
</nav>

<main id="main-content">
  <!-- Main content -->
</main>
```

### Accessible Dialogs

```typescript
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
      <h2 id="dialog-title">{{ title }}</h2>
      <p>{{ message }}</p>
      <div role="group" aria-label="Dialog actions">
        <p-button (onClick)="onCancel()">Cancel</p-button>
        <p-button (onClick)="onConfirm()" [attr.aria-label]="'Confirm ' + action">
          Confirm
        </p-button>
      </div>
    </div>
  `
})
```

### Accessible Tables

```html
<table>
  <caption>
    User List
  </caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Email</th>
      <th scope="col">Role</th>
    </tr>
  </thead>
  <tbody>
    @for (user of users(); track user.uid) {
    <tr>
      <td>{{ user.name }}</td>
      <td>{{ user.email }}</td>
      <td>{{ user.role }}</td>
    </tr>
    }
  </tbody>
</table>
```

## Checklist

Before submitting any component:

- [ ] All interactive elements are keyboard accessible
- [ ] Focus order is logical
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Color contrast meets WCAG AA standards
- [ ] ARIA attributes are used appropriately
- [ ] Tested with screen reader
- [ ] No AXE violations

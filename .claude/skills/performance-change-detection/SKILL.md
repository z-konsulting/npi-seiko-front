# Performance & Change Detection

## Change Detection Strategy (REQUIRED)

All components must use OnPush:

```typescript
// ✅ REQUIRED: All components must use OnPush
@Component({
  selector: "app-user-list",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent {
  // OnPush works perfectly with signals and observables with async pipe
  users = signal<User[]>([]);
  users$ = this.userRepo.getUsers();
}
```

## Template Performance

```html
<!-- ✅ REQUIRED: Always use trackBy with @for -->
@for (user of users(); track user.uid) {
<app-user-card [user]="user" />
}

<!-- ❌ BAD: No track function -->
@for (user of users(); track $index) {
<app-user-card [user]="user" />
}
```

## Other Performance Best Practices

- **Debounce user input** (300ms for search, form inputs)
- **Lazy load feature routes** for better initial load time
- **Use NgOptimizedImage** for all static images
- **Avoid complex calculations in templates** (use `computed()` instead)

## Lazy Loading Example

```typescript
// In routes
{
  path: 'admin',
    loadChildren
:
  () => import('./pages/admin/admin.routes').then(m => m.ADMIN_ROUTES)
}
```

## NgOptimizedImage Example

```html
<!-- ✅ GOOD: Optimized image loading -->
<img
  ngSrc="assets/logo.svg"
  alt="Company Logo"
  width="200"
  height="100"
  priority
/>

<!-- For lazy-loaded images -->
<img
  ngSrc="assets/user-avatar.jpg"
  alt="User Avatar"
  width="48"
  height="48"
  loading="lazy"
/>
```

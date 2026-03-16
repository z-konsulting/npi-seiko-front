# Observable Management

## takeUntilDestroyed (REQUIRED)

Always use `takeUntilDestroyed` to automatically clean up subscriptions:

```typescript
export class MyComponent {
    private destroyRef = inject(DestroyRef);
    private dataService = inject(DataService);

    ngOnInit() {
        this.dataService
            .getData()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((data) => {
                // Handle data
            });
    }
}
```

## Observable Naming

Suffix observable variables with `$`:

```typescript
users$: Observable<User[]>;
isLoading$ = this.loadingSubject.asObservable();
```

## Async Pipe (Preferred)

Use async pipe in templates to avoid manual subscriptions:

```typescript
export class UsersComponent {
  private userRepo = inject(UserRepo);

  // Expose observable directly, no subscription needed
  users$ = this.userRepo.getUsers();
}
```

```html
<!-- Async pipe handles subscribe/unsubscribe automatically -->
@if (users$ | async; as users) {
  @for (user of users; track user.uid) {
    <div>{{ user.name }}</div>
  }
}
```

## Debouncing

Use `debounceTime` for search and table events:

```typescript
searchSubject$ = new Subject<string>();

ngOnInit()
{
    this.searchSubject$
        .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
        .subscribe((searchText) => this.search(searchText));
}
```

## One-Shot Requests

Use `take(1)` for single requests (delete, update, etc.):

```typescript
deleteUser(userId: string) {
  this.userRepo.deleteUser(userId)
    .pipe(take(1))
    .subscribe(() => {
      this.messageService.successMessage('User deleted');
      this.refreshList();
    });
}
```

## Error Handling

Errors are handled automatically by the global interceptor (`handle-error-request-interceptor.fn.ts`). Only handle
errors explicitly if you need specific behavior:

```typescript
this.userRepo
  .deleteUser(userId)
  .pipe(take(1))
  .subscribe({
    next: () => {
      this.messageService.successMessage("User deleted");
    },
  });
```
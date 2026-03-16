# Dependency Injection

Use this skill when injecting services, repositories, or other dependencies in Angular components and services.

## Use inject() Function (REQUIRED)

**Always use `inject()` instead of constructor injection:**

```typescript
// ✅ GOOD: inject() function
export class MyComponent {
  private userRepo = inject(UserRepo);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  navigateToHome() {
    this.router.navigate(["/"]);
  }

  loadData() {
    this.userRepo
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(/*...*/);
  }
}

// ❌ BAD: Constructor injection
export class MyComponent {
  constructor(
    private userRepo: UserRepo,
    private router: Router,
  ) {}
}
```

## Key Rules

1. ✅ **ALWAYS** use `inject()` function for dependency injection
2. ❌ **NEVER** use constructor injection
3. ✅ Inject `DestroyRef` for automatic subscription cleanup
4. ✅ Use private or protected access modifiers for injected dependencies
5. ✅ Inject dependencies at the class field level, not in methods

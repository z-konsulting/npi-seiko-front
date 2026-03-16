# Signals & Reactive State Management

Use this skill when working with signals, computed values, and reactive state management in Angular.

## Signal Basics (RECOMMENDED for component state)

**Use signals for all component state:**

```typescript
export class UserListComponent {
  // ✅ Use signal() for mutable state
  users = signal<User[]>([]);
  isLoading = signal<boolean>(false);
  selectedUser = signal<User | null>(null);

  // ✅ Use computed() for derived state
  userCount = computed(() => this.users().length);
  hasUsers = computed(() => this.users().length > 0);
  activeUsers = computed(() => this.users().filter(u => u.isActive));

  loadUsers() {
    this.isLoading.set(true);
    this.userRepo.getUsers()
      .pipe(take(1))
      .subscribe(users => {
        this.users.set(users); // ✅ Use set() to replace value
        this.isLoading.set(false);
      });
  }

  addUser(user: User) {
    // ✅ Use update() to modify based on current value
    this.users.update(current => [...current, user]);
  }

  removeUser(userId: string) {
    this.users.update(current => current.filter(u => u.id !== userId));
  }

  selectUser(user: User) {
    this.selectedUser.set(user);
  }
}
```

## ❌ FORBIDDEN Signal Patterns

**NEVER use these deprecated or incorrect patterns:**

```typescript
// ❌ NEVER use mutate() - deprecated and impure
this.users.mutate(arr => arr.push(newUser));

// ✅ GOOD: Use update() with immutable operations
this.users.update(arr => [...arr, newUser]);

// ❌ BAD: Mutating array directly
const current = this.users();
current.push(newUser);
this.users.set(current);

// ✅ GOOD: Create new array
this.users.update(current => [...current, newUser]);
```

## Signal Inputs/Outputs (REQUIRED for new components)

**Use signal-based inputs and outputs:**

```typescript
export class UserCardComponent {
  // ✅ Use input() and input.required()
  user = input.required<User>();
  showActions = input<boolean>(true);
  size = input<'sm' | 'md' | 'lg'>('md');

  // ✅ Use output() instead of EventEmitter
  userClick = output<User>();
  deleteClick = output<string>();

  // ✅ Computed values from inputs
  displayName = computed(() => {
    const user = this.user();
    return `${user.firstName} ${user.lastName}`;
  });

  isLargeSize = computed(() => this.size() === 'lg');

  onUserClick() {
    this.userClick.emit(this.user());
  }

  onDelete() {
    this.deleteClick.emit(this.user().id);
  }
}
```

## When to Use Signals vs Observables

### ✅ Use Signals for:
- Component state (loading flags, form data, UI state)
- Derived/computed values
- Parent-child component communication (inputs/outputs)
- Simple synchronous state

### ✅ Use Observables for:
- HTTP requests
- Asynchronous operations
- Stream-based data (WebSockets, SSE)
- Complex RxJS operators needed
- Integration with existing Observable-based APIs

### Example combining both:

```typescript
export class DashboardComponent {
  // ✅ Signals for component state
  isLoading = signal(false);
  selectedTab = signal(0);

  // ✅ Observables for async data
  users$ = this.userRepo.getUsers();
  notifications$ = this.notificationService.stream$;

  // ✅ Convert Observable to Signal if needed (for templates)
  currentUser = toSignal(this.authService.currentUser$);

  // ✅ Computed from signal
  tabTitle = computed(() => {
    return ['Overview', 'Users', 'Settings'][this.selectedTab()];
  });
}
```

## Key Rules

1. ✅ **ALWAYS** use `signal()` for component state
2. ✅ **ALWAYS** use `computed()` for derived state
3. ✅ **ALWAYS** use `set()` to replace signal values
4. ✅ **ALWAYS** use `update()` with immutable operations
5. ✅ **ALWAYS** use `input()/input.required()` instead of `@Input`
6. ✅ **ALWAYS** use `output()` instead of `@Output`/`EventEmitter`
7. ❌ **NEVER** use `mutate()` (deprecated)
8. ❌ **NEVER** mutate signal values directly
9. ✅ Use `toSignal()` to convert Observables to Signals when needed
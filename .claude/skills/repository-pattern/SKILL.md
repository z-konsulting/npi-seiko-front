# Repository Pattern (REQUIRED)

All API calls MUST go through repositories:

```typescript
// ✅ GOOD: Repository pattern
@Injectable({ providedIn: "root" })
export class UserRepo {
  private userService = inject(User2); // Generated client

  searchUsers(offset: number, limit: number): Observable<UsersPaginated> {
    return fromRequest(
      this.userService.searchUsers({
        query: { offset, limit },
      }),
    );
  }
}

// Component uses repository
export class UsersComponent {
  private userRepo = inject(UserRepo);

  loadUsers() {
    this.userRepo
      .searchUsers(0, 10)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(/*...*/);
  }
}

// ❌ BAD: Direct HTTP in component
export class UsersComponent {
  private http = inject(HttpClient);

  loadUsers() {
    this.http.get("/api/users").subscribe(/*...*/);
  }
}
```

## Repository Location

- All repositories in `src/app/repositories/`
- Named with `.repo.ts` suffix
- Wrap OpenAPI-generated client methods
- Convert Promises to Observables via `fromRequest<T>(promise)` utility

## Example Repository

```typescript
@Injectable({ providedIn: "root" })
export class UserRepo {
  private userService = inject(User2);

  searchUsers(
    offset: number,
    limit: number,
    search?: string,
    filter?: UserFilter
  ): Observable<UsersPaginated> {
    return fromRequest(
      this.userService.searchUsers({
        query: { offset, limit, search, ...filter },
      })
    );
  }

  getUser(userId: string): Observable<User> {
    return fromRequest(
      this.userService.getUser({ path: { userId } })
    );
  }

  createUser(user: UserCreate): Observable<User> {
    return fromRequest(
      this.userService.createUser({ body: user })
    );
  }

  updateUser(userId: string, user: UserUpdate): Observable<User> {
    return fromRequest(
      this.userService.updateUser({ path: { userId }, body: user })
    );
  }

  deleteUser(userId: string): Observable<void> {
    return fromRequest(
      this.userService.deleteUser({ path: { userId } })
    );
  }
}
```

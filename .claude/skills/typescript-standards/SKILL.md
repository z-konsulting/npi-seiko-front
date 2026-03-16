# TypeScript Standards

Use this skill when writing TypeScript code, defining types, and using enums.

## Explicit Typing (REQUIRED)

**All properties, parameters, and return types MUST have explicit types:**

```typescript
// ✅ GOOD: Explicit types
getUsers(offset: number, limit: number): Observable<UsersPaginated> {
  return this.userRepo.searchUsers(offset, limit);
}

private currentUser: User | null = null;
private loadingState: boolean = false;

// ❌ BAD: Implicit typing
getUsers(offset, limit) {
  return this.userRepo.searchUsers(offset, limit);
}

private currentUser = null;
```

## Enums for Form Fields (REQUIRED)

**Always create enums for form field names in `src/app/models/enums/form-field-names/`:**

```typescript
// src/app/models/enums/form-field-names/user-form-field.ts
export enum UserFormField {
  EMAIL = "email",
  USERNAME = "username",
  PASSWORD = "password",
  ROLE = "role",
}

// ✅ GOOD: Usage in forms
this.form.get(UserFormField.EMAIL)?.setValue("test@example.com");

// ❌ NEVER use magic strings
this.form.get("email")?.setValue("test@example.com");
```

## Enums for Constants

**Use enums for type-safe constants:**

```typescript
export enum RouteId {
  LOGIN,
  ADMIN,
  ADMIN_USERS,
}

export enum Icons {
  CALCULATOR = "pi pi-calculator",
  PENCIL = "pi pi-pencil",
  TRASH = "pi pi-trash",
}

export enum UserRole {
  ADMINISTRATOR = "ADMINISTRATOR",
  SUPER_ADMINISTRATOR = "SUPER_ADMINISTRATOR",
}
```

## Enum References (CRITICAL)

**ALWAYS use enum references, NEVER hard-coded enum values:**

```typescript
export enum CostRequestStatus {
    PENDING_INFORMATION = "PENDING_INFORMATION",
  ESTIMATED = "ESTIMATED",
  ABORTED = "ABORTED",
}

// ✅ GOOD: Use enum reference
if (costRequest.status === CostRequestStatus.ESTIMATED) {
  // ...
}

@if (costRequest.status === CostRequestStatus.ESTIMATED) {
  <p-button label="New Revision" />
}

// ❌ DANGEROUS: Hard-coded string value
if (costRequest.status === "ESTIMATED") {
  // ⚠️ If enum value changes, this breaks!
}

@if (costRequest.status === "ESTIMATED") {
  // ⚠️ If enum value changes, this breaks!
}
```

**Why this matters:**

- If the enum value changes from `"ESTIMATED"` to `"ESTIMATED_STATUS"`, all hard-coded strings break silently
- Using enum references provides type safety and refactoring support
- TypeScript compiler will catch errors if enum changes

**This applies to:**

- Comparisons in TypeScript (`===`, `!==`, `switch`)
- Template conditions (`@if`, `@switch`)
- Default values and assignments
- Function parameters and return values

## File Locations for Enums

**Form field enums:**

- Location: `src/app/models/enums/form-field-names/[feature]-form-field.ts`
- Example: `user-form-field.ts`, `login-form-field.ts`

**Other enums:**

- Location: `src/app/models/enums/`
- Examples: `routes-id.ts`, `icons.ts`, `user-role.ts`

## Key Rules

1. ✅ **ALWAYS** provide explicit types for all properties, parameters, and return types
2. ✅ **ALWAYS** create enums for form field names
3. ✅ **ALWAYS** use enums instead of magic strings
4. ✅ **ALWAYS** use enum references (e.g., `CostRequestStatus.ESTIMATED`) instead of hard-coded values (e.g.,
   `"ESTIMATED"`)
5. ✅ **ALWAYS** place form field enums in `src/app/models/enums/form-field-names/`
6. ❌ **NEVER** use implicit typing
7. ❌ **NEVER** use magic strings for form fields or enum comparisons
8. ❌ **NEVER** use `any` type (use specific types or `unknown`)
9. ❌ **NEVER** hard-code enum string values in comparisons or templates
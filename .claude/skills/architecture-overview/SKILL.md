# Architecture Overview

## Routing System

Routes are defined via **environment-based configuration** in `src/environments/routes.environment.ts` as `RouteEnv[]` objects. Each route has an ID from the `RouteId` enum.

### Adding a new route

1. Add ID to `src/app/models/enums/routes-id.ts`
2. Add configuration to `src/environments/routes.environment.ts`
3. Create route file (e.g., `src/app/pages/feature/feature.routes.ts`)
4. Update `src/app/services/Access.service.ts` if role-based access needed
5. Add to `src/app/app.routes.ts` or parent route's `children`

### Key routing utilities

```typescript
// Get route configuration
RoutingService.getRouteEnv(routeId)

// Get full path including parent routes
RoutingService.fullPathRoute(routeId)

// Get routes shown in navbar
RoutingService.getAllPrincipalsRoute()
```

### Navigation Example

```typescript
import { RoutingService } from "src/app/services/Routing.service";

const path = RoutingService.fullPathRoute(RouteId.ADMIN_USERS);
this.router.navigate([path]);
```

## Security Architecture

Four-layer security model:

### 1. AuthenticationService

`src/app/security/authentication.service.ts`

- Manages localStorage: `userLogged`, `userTokenKey`, `userRole`, `userLoginKey`, `userId`, `userAllowedCapacities`
- Broadcasts storage changes across tabs
- Exposes `authStatus$` Observable

### 2. Guards

- **AuthGuardService** - Redirects to login if not authenticated
- **RoleGuard** - Enforces role-based access control

### 3. AccessService

`src/app/services/Access.service.ts`

- Static method `canAccess(routeId, role)` determines route visibility
- Used by NavBar to show/hide menu items

### 4. HTTP Interceptors

`src/app/configs/interceptors/`

- **authenticationInterceptorFn** - Adds Bearer token to all requests
- **handleErrorRequestInterceptorFn** - Global error handling:
  - Detects `MUST_BE_DISCONNECTED` error → logout + redirect to login
  - Converts Blob errors to JSON
  - Shows toast messages via `HandleToastMessageService`
  - Respects `SKIP_ERROR_TOAST` HTTP context token

## Component Organization

### Directory Structure

- `src/app/components/` - Global reusable components (nav-bar, custom-loader, search-input, etc.)
- `src/app/modales/` - Dialog/modal components (extend `BaseModal`)
- `src/app/pages/` - Page components organized by feature
  - `public/` - Unauthenticated pages (login, password reset)
  - `admin/` - Admin-only pages (lazy loaded)

### Base Classes

- **BaseModal** - For dialog components, provides FormService, DialogRef, HandleToastMessageService
- **BaseListComponent** - For paginated list pages with lazy loading and search

## File Organization

### Form Field Enums

- Location: `src/app/models/enums/form-field-names/[feature]-form-field.ts`
- Example: `user-form-field.ts`, `login-form-field.ts`

### Components

- Reusable: `src/app/components/`
- Pages: `src/app/pages/[feature]/`
- Dialogs: `src/app/modales/[feature]/`

### Pipes

- Location: `src/app/pipes/`
- Pattern: Create one pipe per enum for display transformation
- **IMPORTANT**: When using `inject()` to inject a pipe in a component, you MUST add it to the `providers` array

**Example:**

```typescript
@Component({
  selector: "app-my-component",
  imports: [CommonModule],
  providers: [
    // ✅ REQUIRED: Add pipes to providers when using inject()
    MarkupApprovalStrategyPipe,
    CurrencyExchangeRateStrategyPipe,
  ],
  templateUrl: "./my-component.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent {
  // ✅ Now inject() will work
  private markupPipe = inject(MarkupApprovalStrategyPipe);
  private currencyPipe = inject(CurrencyExchangeRateStrategyPipe);
}
```

### Services

- Business logic: `src/app/services/`
- Repositories: `src/app/repositories/`

## Key Files Reference

- `src/app/app.routes.ts` - Main application routes
- `src/app/app.config.ts` - Application configuration and providers
- `src/app/security/authentication.service.ts` - Authentication state management
- `src/app/services/Access.service.ts` - Role-based access control
- `src/app/services/Routing.service.ts` - Route configuration utilities
- `src/app/services/components/modal.service.ts` - Dialog management
- `src/app/configs/interceptors/` - HTTP interceptors
- `src/environments/routes.environment.ts` - Route definitions
- `src/app/models/enums/routes-id.ts` - Route ID enum

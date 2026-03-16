# Service Patterns

## Modal Service Pattern

`src/app/services/components/modal.service.ts`

- Uses PrimeNG DialogService
- All modal methods return `Observable<boolean | undefined>`
- Parent component subscribes to refresh data on dialog close

### Example Pattern

```typescript
showUserCreateEditModal(editMode: boolean, user?: User): Observable<boolean | undefined> {
  const ref = this.dialogService.open(UserCreateEditDialogComponent, {
    data: {
      editMode,
      user,
    },
    header: editMode ? 'Edit User' : 'Create User',
    width: '600px',
  });
  return race(ref.onClose, ref.onDestroy);
}
```

### Usage in Parent Component

```typescript
export class UsersListComponent {
  private modalService = inject(ModalService);

  openCreateDialog() {
    this.modalService
      .showUserCreateEditModal(false)
      .pipe(take(1))
      .subscribe((result) => {
        if (result) {
          this.refreshList();
        }
      });
  }
}
```

## Toast/Message Service

`src/app/services/components/HandleToastMessage.service.ts`

```typescript
// Success notification
this.handleToastMessage.successMessage('User created successfully');

// Error notification
this.handleToastMessage.errorMessage('Failed to create user');

// Handle error object (automatically called by interceptor)
this.handleToastMessage.handleError(error);
```

## Creating a New Modal

1. Create component in `src/app/modales/[feature]/[name]-dialog/`
2. Extend `BaseModal`
3. Add method to `ModalService` following existing patterns
4. Call from parent component and subscribe to result

### Modal Component Example

```typescript
@Component({
  selector: 'app-user-dialog',
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDialogComponent extends BaseModal implements OnInit {
  editMode = signal<boolean>(false);
  user = signal<User | undefined>(undefined);

  form = this.formService.formBuilder().group({
    [UserFormField.EMAIL]: ['', [Validators.required, Validators.email]],
    [UserFormField.USERNAME]: ['', Validators.required],
  });

  ngOnInit() {
    this.editMode.set(this.config.data.editMode);
    this.user.set(this.config.data.user);

    if (this.editMode()) {
      this.patchForm();
    }
  }

  patchForm() {
    const user = this.user();
    if (user) {
      this.form.patchValue({
        [UserFormField.EMAIL]: user.email,
        [UserFormField.USERNAME]: user.username,
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.formService.trimFormStringValues(this.form);
      // Submit logic
      this.closeDialog(true);
    }
  }

  onCancel() {
    this.closeDialog(false);
  }
}
```

## Loader Service

`src/app/services/components/loader.service.ts`

```typescript
export class MyComponent {
  private loaderService = inject(LoaderService);

  loadData() {
    this.loaderService.show();

    this.dataService.getData()
      .pipe(
        take(1),
        finalize(() => this.loaderService.hide())
      )
      .subscribe(data => {
        // Handle data
      });
  }
}
```

## Config Service

`src/app/services/config.service.ts`

- Loads `/assets/config.json` on initialization
- Polls config every 60 seconds to detect new deployments
- Notifies user when new version available

```typescript
export class AppComponent {
  private configService = inject(ConfigService);

  ngOnInit() {
    this.configService.config$.subscribe(config => {
      console.log('Current version:', config.version);
    });
  }
}
```

# Common Patterns

## Lazy Loading with Debounce

```typescript
onLazyLoad(event
:
TableLazyLoadEvent
)
{
    this.lazyLoadEvent$.next(event);
}

// In ngOnInit
ngOnInit()
{
    this.lazyLoadEvent$
        .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
        .subscribe(event => this.loadData(event));
}
```

## Search with Debounce

```typescript
export class SearchComponent {
    private destroyRef = inject(DestroyRef);
    searchSubject$ = new Subject<string>();

    ngOnInit() {
        this.searchSubject$
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((searchText) => this.performSearch(searchText));
    }

    onSearchInput(value: string) {
        this.searchSubject$.next(value);
    }

    performSearch(searchText: string) {
        // Perform search
    }
}
```

## Paginated List Component

```typescript
export class UsersListComponent extends BaseListComponent implements OnInit {
    private userRepo = inject(UserRepo);

    users = signal<User[]>([]);

    lazyLoadEvent$ = new Subject<TableLazyLoadEvent>();

    ngOnInit() {
        this.lazyLoadEvent$
            .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
            .subscribe((event) => this.loadUsers(event));
    }

    loadUsers(event: TableLazyLoadEvent) {
        this.loading.set(true);
        const offset = event.first || 0;
        const limit = event.rows || 10;

        this.userRepo
            .searchUsers(offset, limit, this.searchText())
            .pipe(
                take(1),
                finalize(() => this.loading.set(false)),
            )
            .subscribe((response) => {
                this.users.set(response.items);
                this.totalRecords.set(response.total);
            });
    }

    onLazyLoad(event: TableLazyLoadEvent) {
        this.lazyLoadEvent$.next(event);
    }
}
```

## CRUD Operations

### Create

```typescript
createUser(userData
:
UserCreate
)
{
    this.userRepo
        .createUser(userData)
        .pipe(take(1))
        .subscribe({
            next: (user) => {
                this.handleToastMessage.successMessage('User created successfully');
                this.refreshList();
            },
        });
}
```

### Read

```typescript
loadUser(userId
:
string
)
{
    this.loading.set(true);

    this.userRepo
        .getUser(userId)
        .pipe(
            take(1),
            finalize(() => this.loading.set(false))
        )
        .subscribe(user => {
            this.user.set(user);
        });
}
```

### Update

```typescript
updateUser(userId
:
string, userData
:
UserUpdate
)
{
    this.userRepo
        .updateUser(userId, userData)
        .pipe(take(1))
        .subscribe({
            next: (user) => {
                this.handleToastMessage.successMessage('User updated successfully');
                this.user.set(user);
            }
        });
}
```

### Delete

```typescript
deleteUser(userId
:
string
)
{
    this.userRepo
        .deleteUser(userId)
        .pipe(take(1))
        .subscribe({
            next: () => {
                this.handleToastMessage.successMessage('User deleted successfully');
                this.refreshList();
            }
        });
}
```

## Modal with Form

```typescript
export class UserDialogComponent extends BaseModal implements OnInit {
    editMode = signal<boolean>(false);

    form = this.formService.formBuilder().group({
        [UserFormField.EMAIL]: ["", [Validators.required, Validators.email]],
        [UserFormField.USERNAME]: ["", Validators.required],
    });

    ngOnInit() {
        this.editMode.set(this.config.data.editMode);

        if (this.editMode() && this.config.data.user) {
            this.patchForm(this.config.data.user);
        }
    }

    patchForm(user: User) {
        this.form.patchValue({
            [UserFormField.EMAIL]: user.email,
            [UserFormField.USERNAME]: user.username,
        });
    }

    onSubmit() {
        if (this.form.valid) {
            this.formService.trimFormStringValues(this.form);
            const formData = {
                email: this.form.get(UserFormField.EMAIL)?.value,
                username: this.form.get(UserFormField.USERNAME)?.value,
            };

            this.saveUser(formData);
        }
    }

    saveUser(userData: UserCreate) {
        const request = this.editMode()
            ? this.userRepo.updateUser(this.config.data.user.id, userData)
            : this.userRepo.createUser(userData);

        request.pipe(take(1)).subscribe({
            next: () => {
                this.handleToastMessage.successMessage(
                    this.editMode() ? "User updated" : "User created",
                );
                this.closeDialog(true);
            },
        });
    }

    onCancel() {
        this.closeDialog(false);
    }
}
```

## Modal with Controlled Close Button

When you need to control the closing behavior of a modal (e.g., to detect unsaved changes), always add a close button
with the `close-modal-btn` class **outside** the main modal container:

```html
<!-- Main modal content -->
<div class="modal-container">
    <!-- Modal content here -->

    <div class="modal-actions-footer-end">
        <p-button
                (click)="save()"
                [icon]="Icons.CHECK"
                [label]="'Save'"
                severity="success"
        />
        <p-button
                (onClick)="cancel()"
                [icon]="Icons.TIMES"
                [label]="'Cancel'"
                [outlined]="true"
                severity="danger"
        />

    </div>
</div>

<!-- Controlled close button (positioned outside, typically top-right) -->
<p-button
        (onClick)="cancel()"
        [icon]="Icons.TIMES"
        [text]="true"
        class="close-modal-btn"
        severity="secondary"
></p-button>
```

In the component TypeScript:

```typescript
export class MyDialogComponent extends BaseModal {
    private confirmationService = inject(ConfirmationService);

    cancel(): void {
        // Check if there are unsaved changes
        if (this.hasUnsavedChanges()) {
            this.confirmationService.confirm({
                message: "You have unsaved changes. Are you sure you want to close? All modifications will be lost.",
                header: "Unsaved Changes",
                icon: "pi pi-exclamation-triangle",
                key: "confirmDialogKey",
                rejectButtonProps: {
                    label: "No, stay",
                    outlined: true,
                },
                accept: () => {
                    this.ref.close(false);
                },
                reject: () => {
                    // User cancelled
                },
            });
        } else {
            this.ref.close(false);
        }
    }

    private hasUnsavedChanges(): boolean {
        // Implement your change detection logic
        return false;
    }
}
```

**Important:** The close button with `class="close-modal-btn"` allows you to:

- Control the modal close behavior
- Intercept the close action to show confirmations
- Detect unsaved changes before closing
- Provide a consistent close experience across all modals

## Confirmation Dialog

```typescript
confirmDelete(userId
:
string, userName
:
string
)
{
    this.confirmationService.confirm({
        message: `Are you sure you want to delete ${userName}?`,
        header: 'Confirm Delete',
        icon: "pi pi-exclamation-triangle",
        key: "confirmDialogKey",
        rejectButtonProps: {
            label: "Cancel",
            outlined: true,
        },
        accept: () => {
            this.deleteUser(userId);
        },
        reject: () => {
            // User cancelled
        }
    });
}
```

## Confirmation Popover

```typescript
confirmDelete(userId
:
string, userName
:
string, event
:
any
)

)
{
    this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: `Are you sure you want to abort ${userName}?`,
        header: 'Confirm Delete',
        icon: "pi pi-exclamation-triangle",
        key: "confirmPopKey",
        rejectButtonProps: {
            label: "No",
            outlined: true,
        },
        accept: () => {
            this.abortUser(userId);
        },
        reject: () => {
            // User cancelled
        }
    });
}
```
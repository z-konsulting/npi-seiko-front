# Forms

## Reactive Forms with Enums

```typescript
export class LoginComponent {
  private formService = inject(FormService);

  loginForm = new FormGroup({
    [LoginFormField.EMAIL]: new FormControl("", [
      Validators.required,
      Validators.email,
    ]),
    [LoginFormField.PASSWORD]: new FormControl("", [Validators.required]),
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.formService.trimFormStringValues(this.loginForm);
      const email = this.form.get(LoginFormField.EMAIL)?.value;
      const password = this.form.get(LoginFormField.PASSWORD)?.value;
      // Submit
    }
  }
}
```

## Form Building Pattern

```typescript
export class MyFormComponent {
  private formService = inject(FormService);

  form = this.formService.formBuilder().group({
    [MyFormField.EMAIL]: ["", [Validators.required, Validators.email]],
    [MyFormField.ROLE]: [null, Validators.required],
  });

  onSubmit() {
    if (this.form.valid) {
      this.formService.trimFormStringValues(this.form);
      const data = {
        email: this.form.get(MyFormField.EMAIL)?.value,
        role: this.form.get(MyFormField.ROLE)?.value,
      };
      // Submit data
    }
  }
}
```

## Form Field Enums

Always create enums for form fields in `src/app/models/enums/form-field-names/[feature]-form-field.ts`:

```typescript
// src/app/models/enums/form-field-names/user-form-field.ts
export enum UserFormField {
  EMAIL = "email",
  USERNAME = "username",
  PASSWORD = "password",
  ROLE = "role",
}
```

## Form Validation

```typescript
// Built-in validators
Validators.required
Validators.email
Validators.minLength(3)
Validators.maxLength(50)
Validators.pattern(/regex/)

// Custom validators
customValidator(control
:
AbstractControl
):
ValidationErrors | null
{
  if (control.value !== 'expected') {
    return { custom: true };
  }
  return null;
}
```

## Form Utilities

```typescript
// Trim string values
this.formService.trimFormStringValues(this.form);

// Check validity
if (this.form.valid) {
  /* ... */
}

// Get field value
const email = this.form.get(MyFormField.EMAIL)?.value;

// Set field value
this.form.get(MyFormField.EMAIL)?.setValue("new@value.com");

// Mark as touched
this.form.markAllAsTouched();

// Reset form
this.form.reset();
```

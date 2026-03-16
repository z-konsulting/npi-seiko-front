import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
  Injector,
  input,
  OnInit,
  viewChild,
} from "@angular/core";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { InputText } from "primeng/inputtext";
import { FloatLabelModule } from "primeng/floatlabel";
import { Textarea } from "primeng/textarea";
import { InputNumber } from "primeng/inputnumber";

@Component({
  selector: "app-input-container",
  imports: [
    ReactiveFormsModule,
    FormsModule,
    InputText,
    FloatLabelModule,
    Textarea,
    InputNumber,
  ],
  templateUrl: "./input-container.component.html",
  styleUrl: "./input-container.component.scss",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputContainerComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputContainerComponent implements ControlValueAccessor, OnInit {
  inputField = viewChild("inputField", { read: InputText });
  label = input<string>("");
  id = input<string>("");
  placeholder = input<string>("");
  type = input<"text" | "number" | "textarea">("text");
  disabled = input<boolean>(false);
  readonly = input<boolean>(false);
  pattern = input<any | null>(null);
  inputMode = input<string>("text");
  textAreaRows = input<number>(2);
  textTransform = input<"uppercase" | "lowercase" | "capitalize" | "none">(
    "none",
  );
  size = input<"small" | "large" | "default">("large");
  errorMessage = input<string>("");
  helpText = input<string>("");
  min = input<number | null>(null);
  max = input<number | null>(null);
  maxFractionDigits = input<number>(4);
  minFractionDigits = input<number>(2);
  prefix = input<string | null>(null);
  value: string = "";
  numberValue: number | null = null;
  isDisabled: boolean = false;
  isEmptyAfterFocusOut: boolean = false;
  requiredPassed = input<boolean | undefined>(undefined);
  private readonly injector = inject(Injector);
  private ngControl: NgControl | null = null;
  private readonly cdr = inject(ChangeDetectorRef);

  get required(): boolean {
    if (this.requiredPassed() !== undefined) {
      return this.requiredPassed()!;
    }
    return this.isRequiredFromValidator();
  }

  get fieldRequiredError() {
    return this.required && this.isEmptyAfterFocusOut;
  }

  get inputClasses(): string {
    const classes = ["custom-input"];

    if (this.size() === "small") {
      classes.push("p-inputtext-sm");
    } else if (this.size() === "large") {
      classes.push("p-inputtext-lg");
    }

    if (this.textTransform() !== "none") {
      classes.push(`text-${this.textTransform()}`);
    }
    if (this.errorMessage() || this.fieldRequiredError) {
      classes.push("ng-invalid ng-touched");
    }
    return classes.join(" ");
  }

  get isInputDisabled(): boolean {
    return this.disabled() || this.isDisabled;
  }

  ngOnInit(): void {
    this.ngControl = this.injector.get(NgControl, null);
  }

  writeValue(value: any): void {
    if (this.type() === "number") {
      this.numberValue = value ?? null;
    } else {
      this.value = value ?? "";
    }
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onInputChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.value = inputElement.value;
    this.onChange(this.value);
    this.isEmptyAfterFocusOut = !this.value || this.value === "";
  }

  onNumberChange(value: number | null): void {
    this.numberValue = value;
    this.onChange(value);
  }

  onFocusOut() {
    this.isEmptyAfterFocusOut = !this.value || this.value === "";
  }

  onBlur(): void {
    this.onTouched();
  }

  getDefaultErrorMessage() {
    if (this.required) {
      return "This field is required";
    }
    return "";
  }

  private isRequiredFromValidator(): boolean {
    if (!this.ngControl || !this.ngControl.control) {
      return false;
    }

    const validator = this.ngControl.control.validator;
    if (!validator) {
      return false;
    }
    return this.ngControl.control.hasValidator(Validators.required);
  }

  private onChange: (value: any) => void = () => {};

  private onTouched: () => void = () => {};
}

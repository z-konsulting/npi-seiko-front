import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  viewChild,
} from "@angular/core";
import { finalize, forkJoin } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AutoComplete, AutoCompleteModule } from "primeng/autocomplete";
import { FormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { TabsModule } from "primeng/tabs";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { BaseModal } from "../../../models/classes/base-modal";
import { Customer } from "../../../../client/costSeiko";
import { Icons } from "../../../models/enums/icons";
import { RegexPatterns } from "../../../services/utils/regex-patterns";
import { CustomerRepo } from "../../../repositories/customer.repo";

@Component({
  selector: "app-customer-contacts-dialog",
  imports: [
    AutoCompleteModule,
    FormsModule,
    Button,
    TabsModule,
    ProgressSpinnerModule,
  ],
  templateUrl: "./customer-contacts-dialog.component.html",
  styleUrl: "./customer-contacts-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerContactsDialogComponent
  extends BaseModal
  implements OnInit
{
  customer: Customer = this.dataConfig.customer;
  requestorNames = signal<string[]>([]);
  customerEmails = signal<string[]>([]);
  filteredSuggestions = signal<string[]>([]);
  isLoading = signal<boolean>(true);
  isSavingNames = signal<boolean>(false);
  isSavingEmails = signal<boolean>(false);
  emailError = signal<string | null>(null);
  namesAutoComplete = viewChild<AutoComplete>("namesAutoComplete");
  emailsAutoComplete = viewChild<AutoComplete>("emailsAutoComplete");
  protected readonly Icons = Icons;
  private customerRepo = inject(CustomerRepo);

  ngOnInit(): void {
    this.loadData();
  }

  onNameKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      const input = event.target as HTMLInputElement;
      const value = input.value?.trim();
      if (value) {
        if (this.verifyIfRequestorNameExists(value)) {
          this.handleMessage.warningMessage(
            `"${value}" is already in the list`,
          );
          return;
        }
        this.requestorNames.update((names) => [...names, value]);
        input.value = "";
        event.preventDefault();
      }
    }
  }

  onEmailKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      const input = event.target as HTMLInputElement;
      const value = input.value?.trim();
      if (value) {
        if (!RegexPatterns.emailValid(value)) {
          this.emailError.set("Invalid email format");
          return;
        }
        if (this.verifyIfEmailExists(value)) {
          this.handleMessage.warningMessage(
            `"${value}" is already in the list`,
          );
          return;
        }
        this.emailError.set(null);
        this.customerEmails.update((emails) => [...emails, value]);
        input.value = "";
        event.preventDefault();
      }
    }
  }

  onSearch(): void {
    this.filteredSuggestions.set([]);
  }

  saveRequestorNames(): void {
    this.flushPendingName();
    this.isSavingNames.set(true);
    this.customerRepo
      .setRequestorNames(this.customer.uid, this.requestorNames())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSavingNames.set(false)),
      )
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Requestor names saved");
        },
      });
  }

  saveCustomerEmails(): void {
    if (!this.flushPendingEmail()) return;
    this.isSavingEmails.set(true);
    this.customerRepo
      .setCustomerEmails(this.customer.uid, this.customerEmails())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSavingEmails.set(false)),
      )
      .subscribe({
        next: () => {
          this.handleMessage.successMessage("Customer emails saved");
        },
      });
  }

  private verifyIfEmailExists(email: string): boolean {
    return this.customerEmails().some(
      (existingEmail) => existingEmail.toLowerCase() === email.toLowerCase(),
    );
  }

  private verifyIfRequestorNameExists(name: string): boolean {
    return this.requestorNames().some(
      (existingName) => existingName.toLowerCase() === name.toLowerCase(),
    );
  }

  private flushPendingName(): boolean {
    const input = this.namesAutoComplete()?.inputEL?.nativeElement as
      | HTMLInputElement
      | undefined;
    const value = input?.value?.trim();
    if (value) {
      if (this.verifyIfRequestorNameExists(value)) {
        this.handleMessage.warningMessage(`"${value}" is already in the list`);
        return false;
      }
      this.requestorNames.update((names) => [...names, value]);
      if (input) input.value = "";
      return true;
    }
    return false;
  }

  private flushPendingEmail(): boolean {
    const input = this.emailsAutoComplete()?.inputEL?.nativeElement as
      | HTMLInputElement
      | undefined;
    const value = input?.value?.trim();
    if (value) {
      if (!RegexPatterns.emailValid(value)) {
        this.emailError.set("Invalid email format");
        return false;
      }
      if (this.verifyIfEmailExists(value)) {
        this.handleMessage.warningMessage(`"${value}" is already in the list`);
        return false;
      }
      this.emailError.set(null);
      this.customerEmails.update((emails) => [...emails, value]);
      if (input) input.value = "";
    }
    return true;
  }

  private loadData(): void {
    forkJoin({
      names: this.customerRepo.getRequestorNames(this.customer.uid),
      emails: this.customerRepo.getCustomerEmails(this.customer.uid),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: ({ names, emails }) => {
          this.requestorNames.set(names);
          this.customerEmails.set(emails);
        },
      });
  }
}

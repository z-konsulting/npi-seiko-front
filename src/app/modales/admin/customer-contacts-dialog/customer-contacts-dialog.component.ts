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
import { Customer } from "../../../../client/npiSeiko";
import { Icons } from "../../../models/enums/icons";
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
  filteredSuggestions = signal<string[]>([]);
  isLoading = signal<boolean>(true);
  isSavingNames = signal<boolean>(false);
  namesAutoComplete = viewChild<AutoComplete>("namesAutoComplete");
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

  private loadData(): void {
    forkJoin({
      names: this.customerRepo.getRequestorNames(this.customer.uid),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: ({ names }) => {
          this.requestorNames.set(names);
        },
      });
  }
}

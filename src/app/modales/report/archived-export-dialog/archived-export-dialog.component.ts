import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { finalize } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { format } from "date-fns";
import { BaseModal } from "../../../models/classes/base-modal";
import {
  DatePickerStartEnd,
  ExportMonthFilterComponent,
} from "../../../components/export-month-filter/export-month-filter.component";
import { CostRequestRepo } from "../../../repositories/cost-request.repo";
import { FileService } from "../../../services/file.service";
import { LoaderService } from "../../../services/components/loader.service";

@Component({
  selector: "app-archived-export-dialog",
  imports: [ExportMonthFilterComponent],
  templateUrl: "./archived-export-dialog.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchivedExportDialogComponent extends BaseModal {
  private costRequestRepo = inject(CostRequestRepo);
  private fileService = inject(FileService);
  private loaderService = inject(LoaderService);

  onDateSelected(dates: DatePickerStartEnd): void {
    const startDate = format(dates.startDate, "yyyy-MM-dd");
    const endDate = format(dates.endDate, "yyyy-MM-dd");
    this.loaderService.showLoader("Exporting archived quotations...");
    this.costRequestRepo
      .exportArchivedCostRequests(startDate, endDate)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          setTimeout(() => {
            this.loaderService.hideLoader();
            this.closeDialog(true);
          }, 800);
        }),
      )
      .subscribe({
        next: (response) => {
          setTimeout(() => {
            this.fileService.downloadFile(
              response.body,
              response,
              "archived-cost-requests.xlsx",
            );
            this.handleMessage.successMessage("Export downloaded successfully");
          }, 800);
        },
      });
  }
}

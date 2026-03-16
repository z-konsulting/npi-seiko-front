import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { Button } from "primeng/button";
import { CostRequestRepo } from "../../repositories/cost-request.repo";
import { FileService } from "../../services/file.service";
import { HandleToastMessageService } from "../../services/handle-toast-message.service";
import { ModalService } from "../../services/components/modal.service";
import { Icons } from "../../models/enums/icons";
import { CustomTitleComponent } from "../../components/custom-title/custom-title.component";
import { RoutingService } from "../../services/Routing.service";
import { RouteId } from "../../models/enums/routes-id";
import { Card } from "primeng/card";
import { PrimeTemplate } from "primeng/api";
import { LoaderService } from "../../services/components/loader.service";

@Component({
  selector: "app-report",
  imports: [Button, CustomTitleComponent, Card, PrimeTemplate],
  templateUrl: "./report.component.html",
  styleUrl: "./report.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportComponent {
  protected readonly Icons = Icons;
  protected readonly title = RoutingService.getRouteTitle(RouteId.REPORT);
  private costRequestRepo = inject(CostRequestRepo);
  private fileService = inject(FileService);
  private handleMessage = inject(HandleToastMessageService);
  private modalService = inject(ModalService);
  private destroyRef = inject(DestroyRef);
  private loaderService = inject(LoaderService);

  exportOpenCostRequests(): void {
    this.loaderService.showLoader("Exporting open request for quotation...");
    this.costRequestRepo
      .exportOpenCostRequests()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          setTimeout(() => {
            this.loaderService.hideLoader();
          }, 800);
        }),
      )
      .subscribe({
        next: (response) => {
          setTimeout(() => {
            this.fileService.downloadFile(
              response.body,
              response,
              "open-cost-requests.xlsx",
            );
            this.handleMessage.successMessage("Export downloaded successfully");
          }, 800);
        },
      });
  }

  openArchivedExportDialog(): void {
    this.modalService
      .showArchivedExportModal()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}

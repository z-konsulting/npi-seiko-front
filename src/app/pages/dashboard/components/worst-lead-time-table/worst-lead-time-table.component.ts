import {
  ChangeDetectionStrategy,
  Component,
  input,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { DashboardCostRequest } from "../../../../../client/costSeiko";
import { CostRequestStatusPipe } from "../../../../pipes/cost-request-status.pipe";
import { Icons } from "../../../../models/enums/icons";

@Component({
  selector: "app-worst-lead-time-table",
  imports: [DatePipe, TagModule, TooltipModule, CostRequestStatusPipe],
  templateUrl: "./worst-lead-time-table.component.html",
  styleUrl: "./worst-lead-time-table.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorstLeadTimeTableComponent {
  data = input<DashboardCostRequest[] | undefined>(undefined);

  protected readonly Icons = Icons;
}

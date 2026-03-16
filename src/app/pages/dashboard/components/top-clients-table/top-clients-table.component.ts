import {
  ChangeDetectionStrategy,
  Component,
  input,
} from "@angular/core";
import {
  DashboardClientOpenVolume,
  DashboardClientActiveVolume,
} from "../../../../../client/costSeiko";
import { Icons } from "../../../../models/enums/icons";

export type TopClientRow = DashboardClientOpenVolume | DashboardClientActiveVolume;

function isOpenVolume(row: TopClientRow): row is DashboardClientOpenVolume {
  return "openCostRequestsCount" in row;
}

@Component({
  selector: "app-top-clients-table",
  imports: [],
  templateUrl: "./top-clients-table.component.html",
  styleUrl: "./top-clients-table.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopClientsTableComponent {
  data = input<TopClientRow[] | undefined>(undefined);
  countLabel = input<string>("Count");

  protected readonly Icons = Icons;

  getCount(row: TopClientRow): number {
    if (isOpenVolume(row)) {
      return row.openCostRequestsCount ?? 0;
    }
    return (row as DashboardClientActiveVolume).activeCostRequestsCount ?? 0;
  }
}

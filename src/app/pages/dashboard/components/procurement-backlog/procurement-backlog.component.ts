import {
  ChangeDetectionStrategy,
  Component,
  input,
} from "@angular/core";
import { DashboardProcurementBacklog } from "../../../../../client/costSeiko";
import { Icons } from "../../../../models/enums/icons";

@Component({
  selector: "app-procurement-backlog",
  imports: [],
  templateUrl: "./procurement-backlog.component.html",
  styleUrl: "./procurement-backlog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcurementBacklogComponent {
  data = input<DashboardProcurementBacklog | undefined>(undefined);

  protected readonly Icons = Icons;
}

import {
  ChangeDetectionStrategy,
  Component,
  input,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { DashboardManagementBacklog } from "../../../../../client/costSeiko";
import { Icons } from "../../../../models/enums/icons";

@Component({
  selector: "app-management-backlog",
  imports: [DatePipe],
  templateUrl: "./management-backlog.component.html",
  styleUrl: "./management-backlog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementBacklogComponent {
  data = input<DashboardManagementBacklog | undefined>(undefined);

  protected readonly Icons = Icons;
}

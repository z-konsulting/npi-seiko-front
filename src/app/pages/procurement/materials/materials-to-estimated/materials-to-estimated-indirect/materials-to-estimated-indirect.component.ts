import { Component } from "@angular/core";
import { MaterialsListComponent } from "../../materials-list/materials-list.component";
import {
  MaterialStatus,
  MaterialType,
} from "../../../../../../client/costSeiko";

@Component({
  selector: "app-materials-to-estimated-indirect",
  imports: [MaterialsListComponent],
  templateUrl: "./materials-to-estimated-indirect.component.html",
  styleUrl: "./materials-to-estimated-indirect.component.scss",
})
export class MaterialsToEstimatedIndirectComponent {
  protected readonly MaterialStatus = MaterialStatus;
  protected readonly MaterialType = MaterialType;
}

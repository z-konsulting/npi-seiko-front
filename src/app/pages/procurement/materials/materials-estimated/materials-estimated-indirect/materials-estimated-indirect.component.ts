import { Component } from "@angular/core";
import { MaterialsListComponent } from "../../materials-list/materials-list.component";
import {
  MaterialStatus,
  MaterialType,
} from "../../../../../../client/costSeiko";

@Component({
  selector: "app-materials-estimated-indirect",
  imports: [MaterialsListComponent],
  templateUrl: "./materials-estimated-indirect.component.html",
  styleUrl: "./materials-estimated-indirect.component.scss",
})
export class MaterialsEstimatedIndirectComponent {
  protected readonly MaterialStatus = MaterialStatus;
  protected readonly MaterialType = MaterialType;
}

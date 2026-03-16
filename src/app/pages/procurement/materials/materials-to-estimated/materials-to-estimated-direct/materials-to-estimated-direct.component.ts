import { Component } from "@angular/core";
import { MaterialsListComponent } from "../../materials-list/materials-list.component";
import {
  MaterialStatus,
  MaterialType,
} from "../../../../../../client/costSeiko";

@Component({
  selector: "app-materials-to-estimated-direct",
  imports: [MaterialsListComponent],
  templateUrl: "./materials-to-estimated-direct.component.html",
  styleUrl: "./materials-to-estimated-direct.component.scss",
})
export class MaterialsToEstimatedDirectComponent {
  protected readonly MaterialStatus = MaterialStatus;
  protected readonly MaterialType = MaterialType;
}

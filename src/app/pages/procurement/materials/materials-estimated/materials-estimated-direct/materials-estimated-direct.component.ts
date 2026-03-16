import { Component } from "@angular/core";
import { MaterialsListComponent } from "../../materials-list/materials-list.component";
import {
  MaterialStatus,
  MaterialType,
} from "../../../../../../client/costSeiko";

@Component({
  selector: "app-materials-estimated-direct",
  imports: [MaterialsListComponent],
  templateUrl: "./materials-estimated-direct.component.html",
  styleUrl: "./materials-estimated-direct.component.scss",
})
export class MaterialsEstimatedDirectComponent {
  protected readonly MaterialStatus = MaterialStatus;
  protected readonly MaterialType = MaterialType;
}

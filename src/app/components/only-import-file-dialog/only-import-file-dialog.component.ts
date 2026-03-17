import { Component, OnInit, ViewChild } from "@angular/core";
import { FileUpload, FileUploadModule } from "primeng/fileupload";
import { PrimeTemplate } from "primeng/api";
import { BaseModal } from "../../models/classes/base-modal";
import { Icons } from "../../models/enums/icons";
import { LoaderService } from "../../services/components/loader.service";
import { CustomErrorCode } from "../../../client/npiSeiko";

@Component({
  selector: "app-only-import-file-dialog",
  imports: [FileUploadModule, PrimeTemplate],
  templateUrl: "./only-import-file-dialog.component.html",
  styleUrl: "./only-import-file-dialog.component.scss",
})
export class OnlyImportFileDialogComponent extends BaseModal implements OnInit {
  @ViewChild("fileUpload") fileUpload!: FileUpload;
  uploadUrl!: string;
  multiple!: boolean;
  importForAllMachining!: boolean;
  protected readonly Icons = Icons;

  constructor(private readonly loaderService: LoaderService) {
    super();
  }

  ngOnInit() {
    this.uploadUrl = this.dataConfig.uploadUrl;
    this.multiple = this.dataConfig.multiple;
    this.importForAllMachining = this.dataConfig.importForAllMachining;
  }

  onSend() {
    this.loaderService.showLoader("File importing..");
  }

  onUpload(event: any) {
    const object: any = {
      ...event.originalEvent.body,
    };
    this.loaderService.hideLoaderAfterTimeOut();
    this.handleMessage.successMessage("Files imported successfully");
    this.closeDialog(true);
  }

  onError(event: any) {
    this.loaderService.hideLoaderAfterTimeOut();
    const errorCode = event?.error?.error?.code ?? null;
    if (
      this.importForAllMachining &&
      errorCode &&
      errorCode === CustomErrorCode.FILE_EXISTS
    ) {
      this.handleMessage.errorMessage(
        "File already exists in one of machining.",
      );
    } else {
      this.handleMessage.handleErrorWithCode(event.error);
    }
  }
}

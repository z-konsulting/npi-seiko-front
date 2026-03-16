import { Component, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { Icons } from "../../models/enums/icons";
import {
  DomSanitizer,
  SafeResourceUrl,
  SafeUrl,
} from "@angular/platform-browser";
import * as XLSX from "xlsx";
import { FileSelected } from "../manage-file/manage-file.component";
import { BaseModal } from "../../models/classes/base-modal";
import { FileService } from "../../services/file.service";
import { FileManageRepo } from "../../repositories/file-manage-repo";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";

@Component({
  selector: "app-manage-preview-file",
  standalone: true,
  imports: [],
  templateUrl: "./manage-preview-file.component.html",
  styleUrl: "./manage-preview-file.component.scss",
})
export class ManagePreviewFileComponent
  extends BaseModal
  implements OnInit, OnDestroy
{
  // Preview properties
  fileSelected!: FileSelected;
  downloadFileUrl!: string;
  previewUrl: SafeUrl | SafeResourceUrl | null = null;
  previewFileName: string = "";
  isPreviewLoading = signal<boolean>(true);
  excelHtmlContent: string = "";
  textContent: string = "";
  protected readonly Icons = Icons;
  private readonly fileService = inject(FileService);
  private readonly fileRepo = inject(FileManageRepo);
  private readonly sanitizer = inject(DomSanitizer);

  constructor() {
    super();
  }

  ngOnInit() {
    this.fileSelected = this.dataConfig.fileSelected;
    this.downloadFileUrl = this.dataConfig.downloadFileUrl;
    this.openPreview();
  }

  ngOnDestroy() {
    this.closePreview();
  }

  /**
   * Open the preview dialog and download the file to preview it
   */
  openPreview(): void {
    const file = this.fileSelected;
    if (!this.fileService.canPreviewFile(file.fileName)) {
      this.handleMessage.errorMessage("This type of file cannot be previewed.");
      return;
    }

    this.isPreviewLoading.set(true);
    this.previewFileName = file.fileName;
    this.excelHtmlContent = "";

    const body: string[] = [file.uid];
    this.fileRepo
      .downloadFileByBlob(this.downloadFileUrl, body)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          setTimeout(() => {
            this.isPreviewLoading.set(false);
          }, 500);
        }),
      )
      .subscribe({
        next: (blob: Blob) => {
          if (this.isExcelFile(file.fileName)) {
            this.handleExcelPreview(blob);
          } else if (this.isTextFile(file.fileName)) {
            this.handleTextPreview(blob);
          } else {
            const mimeType = this.fileService.getMimeType(file.fileName);
            const typedBlob = new Blob([blob], { type: mimeType });
            const objectUrl = URL.createObjectURL(typedBlob);

            if (this.isPdfFile(file.fileName)) {
              this.previewUrl =
                this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
            } else {
              this.previewUrl =
                this.sanitizer.bypassSecurityTrustUrl(objectUrl);
            }
          }
        },
      });
  }

  /**
   * Close the dialog
   */
  closePreview(): void {
    this.cleanupPreview();
    this.closeDialog();
  }

  isExcelFile(fileName: string): boolean {
    const extension = this.fileService.getFileExtension(fileName).toLowerCase();
    return ["xlsx", "xls"].includes(extension);
  }

  isImageFile(fileName: string): boolean {
    const extension = this.fileService.getFileExtension(fileName).toLowerCase();
    return ["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"].includes(
      extension,
    );
  }

  isPdfFile(fileName: string): boolean {
    return this.fileService.getFileExtension(fileName).toLowerCase() === "pdf";
  }

  isTextFile(fileName: string): boolean {
    return this.fileService.getFileExtension(fileName).toLowerCase() === "txt";
  }

  private handleTextPreview(blob: Blob): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.textContent = e.target.result;
      this.isPreviewLoading.set(false);
    };
    reader.readAsText(blob);
  }

  /**
   * Cleanup blob URL to prevent memory leaks
   */
  private cleanupPreview(): void {
    if (this.previewUrl) {
      const urlString = this.previewUrl.toString();
      if (urlString.startsWith("blob:")) {
        URL.revokeObjectURL(urlString);
      }
    }
    this.previewUrl = null;
    this.previewFileName = "";
    this.excelHtmlContent = "";
    this.textContent = "";
  }

  private handleExcelPreview(blob: Blob): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      this.excelHtmlContent = XLSX.utils.sheet_to_html(worksheet, {
        editable: false,
      });
    };
    reader.readAsArrayBuffer(blob);
  }
}

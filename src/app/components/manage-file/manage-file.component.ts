import { TruncateCellComponent } from "../truncate-cell/truncate-cell.component";
import {
  Component,
  effect,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  signal,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import {
  FileSelectEvent,
  FileUpload,
  FileUploadModule,
} from "primeng/fileupload";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { CheckboxModule } from "primeng/checkbox";
import { FormsModule } from "@angular/forms";
import { FieldsetModule } from "primeng/fieldset";
import { HandleToastMessageService } from "../../services/handle-toast-message.service";
import { ConfirmationService } from "primeng/api";
import { Icons } from "../../models/enums/icons";
import { FileService } from "../../services/file.service";
import { Subject, takeUntil } from "rxjs";
import { Button } from "primeng/button";
import { ModalService } from "../../services/components/modal.service";
import { FileInfo } from "../../../client/npiSeiko";

export interface FileSelected extends FileInfo {
  selected: boolean;
}

@Component({
  selector: "app-manage-file",
  standalone: true,
  imports: [
    FileUploadModule,
    CommonModule,
    TableModule,
    TooltipModule,
    ConfirmDialogModule,
    ConfirmPopupModule,
    CheckboxModule,
    TruncateCellComponent,
    FormsModule,
    FieldsetModule,
    Button,
  ],
  providers: [],
  templateUrl: "./manage-file.component.html",
  styleUrl: "./manage-file.component.scss",
})
export class ManageFileComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild("fileUpload") fileUpload!: FileUpload;
  @Input() defaultUrl: string = "";
  @Input() multiple: boolean = true;
  @Input() canDeletion: boolean = true;
  @Input() filesPresent: FileSelected[] = [];
  @Input() userOnlyDownloadAccess: boolean = false;
  @Input() showUploadButton: boolean = true;
  @Input() showDownloadButton: boolean = true;
  @Input() showGlobalDownloadBtn: boolean = true;
  @Output() deletionFileUidsEventEmitter: EventEmitter<string[]> =
    new EventEmitter();
  @Output() downloadableFileUidsEventEmitter: EventEmitter<string[]> =
    new EventEmitter();
  @Output() uploadedEventEmitter: EventEmitter<any> = new EventEmitter();
  @Output() errorFileEventEmitter: EventEmitter<boolean> = new EventEmitter();
  @Output() filePresentButNoUpload: EventEmitter<boolean> = new EventEmitter();

  $destroyed = new Subject<void>();
  allFiles: FileSelected[] = [];
  filesSelected = signal<File[]>([]);
  selectedAll: boolean = false;
  onlyOneFileSelected: boolean = false;
  fileAlreadySelected: string | null = null;
  uploadUrl: string = "";
  downloadUrl: string = "";
  protected readonly Icons = Icons;

  constructor(
    private readonly handleMessage: HandleToastMessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly fileService: FileService,
    private readonly modalService: ModalService,
  ) {
    effect(() => {
      const filesSelected = this.filesSelected();
      this.filePresentButNoUpload.emit(this.hasPendingFiles);
    });
  }

  get hasPendingFiles(): boolean {
    return this.fileUpload?.files?.length > 0;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["filesPresent"]) {
      this.allFiles = structuredClone(this.filesPresent);
      this.selectedAll = false;
    }
    if (changes["defaultUrl"]) {
      this.initUrl();
    }
  }

  ngOnInit() {
    if (this.filesPresent.length > 0) {
      this.allFiles = structuredClone(this.filesPresent);
    }
  }

  ngOnDestroy(): void {
    this.$destroyed.next();
    this.$destroyed.complete();
  }

  initUrl() {
    this.uploadUrl = this.defaultUrl + "/upload";
    this.downloadUrl = this.defaultUrl + "/download";
  }

  onSelect(event: FileSelectEvent) {
    this.filesSelected.set(event.currentFiles ?? []);
    this.checkIfFileSelectedExist();
  }

  fileCanBeVisibleInPreview(fileName: string): boolean {
    return this.fileService.canPreviewFile(fileName);
  }

  openPreview(file: FileSelected) {
    this.modalService
      .showPreviewFileDialog(file, this.downloadUrl)
      .pipe(takeUntil(this.$destroyed))
      .subscribe(() => {});
  }

  onClear(event: any) {
    this.fileAlreadySelected = null;
    this.filesSelected.set([]);
  }

  onRemove(event: any) {
    this.fileAlreadySelected = null;
    const fileRemoved: File = event.file;
    this.filesSelected.update((files) =>
      files.filter((file) => file.name != fileRemoved.name),
    );
    this.checkIfFileSelectedExist();
  }

  onUpload(event: any) {
    for (let file of event.files) {
      this.allFiles.push({
        fileName: file.name,
        selected: false,
        uid: file.uid,
      } as FileSelected);
    }
    const object: any = {
      ...event.originalEvent.body,
    };
    this.handleMessage.successMessage("All files uploaded");
    this.uploadedEventEmitter.emit(object);
  }

  onError(event: any) {
    this.handleMessage.handleErrorWithCode(event.error);
    this.errorFileEventEmitter.emit(true);
  }

  confirmFilesDeletion(event: any, selectedFile?: FileSelected): void {
    const message = selectedFile ? "this file" : "selected files";
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to delete ${message}?`,
      icon: "pi pi-exclamation-triangle warning",
      key: "confirmPopKey",
      rejectButtonProps: {
        label: "No",
        outlined: true,
      },
      accept: () => {
        const files = selectedFile
          ? [selectedFile.uid]
          : this.getSelectedFileUids();
        this.deleteFiles(files);
        this.checkIfFileSelectedExist();
      },
    });
  }

  selectedFiles(selected: any, isGlobal: boolean) {
    if (isGlobal) {
      this.allFiles = this.allFiles.map((file: FileSelected) => ({
        ...file,
        selected: selected,
      }));
    } else {
      this.selectedAll = false;
    }
    this.onlyOneFileSelected = this.allFiles.some((file) => file.selected);
  }

  deleteFiles(selectedFileUids: string[]) {
    this.deletionFileUidsEventEmitter.emit(selectedFileUids);
  }

  downloadFiles(file?: FileSelected) {
    if (file) {
      this.downloadableFileUidsEventEmitter.emit([file.uid]);
    } else {
      this.downloadableFileUidsEventEmitter.emit(this.getSelectedFileUids());
    }
  }

  onFileCheckChange(file: FileSelected, selected: boolean): void {
    file.selected = selected;
    this.selectedAll = false;
    this.onlyOneFileSelected = this.allFiles.some((f) => f.selected);
  }

  private checkIfFileSelectedExist() {
    const existingNames = this.allFiles.map((f) => f.fileName);
    const hasDuplicate = this.filesSelected().some((file) => {
      const isDuplicate = existingNames.includes(file.name);
      if (isDuplicate) {
        this.fileAlreadySelected = `${file.name} is already uploaded`;
        this.handleMessage.warningMessage(this.fileAlreadySelected);
      }
      return isDuplicate;
    });

    if (!hasDuplicate) {
      this.fileAlreadySelected = null;
    }
  }

  private getSelectedFileUids(): string[] {
    return this.getFileUids(this.allFiles.filter((file) => file.selected));
  }

  private getFileNames(files: FileSelected[]): string[] {
    return files.map((file) => file.fileName);
  }

  private getFileUids(files: FileSelected[]): string[] {
    return files.map((file) => file.uid);
  }
}

import { Injectable, OnDestroy } from "@angular/core";
import { map, Observable, Subject, takeUntil } from "rxjs";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { FileService } from "../services/file.service";
import { HandleToastMessageService } from "../services/handle-toast-message.service";

interface FileNames {
  fileNames: string[];
}

@Injectable({
  providedIn: "root",
})
export class FileManageRepo implements OnDestroy {
  $destroyed = new Subject<void>();

  constructor(
    private readonly http: HttpClient,
    private readonly fileService: FileService,
    private readonly handleMessage: HandleToastMessageService,
  ) {}

  ngOnDestroy() {
    this.$destroyed.next();
    this.$destroyed.complete();
  }

  downloadFileByBlob(url: string, filesUids: string[]) {
    return this.http.post(url, filesUids, {
      responseType: "blob",
    });
  }

  downloadFile(url: string, filesUids: string[]) {
    return this.http
      .post(url, filesUids, {
        responseType: "blob",
        observe: "response",
        headers: new HttpHeaders({
          Accept: "application/json",
        }),
      })
      .pipe(takeUntil(this.$destroyed))
      .subscribe((response) => {
        this.fileService.downloadFile(response.body, response, `files.xlsx`);

        this.handleMessage.successMessage(
          `${filesUids.length > 1 ? "Files" : "File"} downloaded`,
        );
      });
  }

  deleteFile(url: string, filesUids: string[]): Observable<any> {
    return this.http
      .post(url, filesUids)
      .pipe(map((response) => response as any));
  }
}

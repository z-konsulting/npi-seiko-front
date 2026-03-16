import { Injectable } from "@angular/core";
import { HttpResponse } from "@angular/common/http";

@Injectable({
  providedIn: "root",
})
export class FileService {
  private readonly previewableExtensions = [
    "pdf",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "bmp",
    "webp",
    "svg",
    "txt",
  ];

  constructor() {}

  getMimeType(fileName: string): string {
    const extension = this.getFileExtension(fileName).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      bmp: "image/bmp",
      webp: "image/webp",
      svg: "image/svg+xml",
      txt: "text/plain",
    };
    return mimeTypes[extension] || "application/octet-stream";
  }

  canPreviewFile(fileName: string): boolean {
    const extension = this.getFileExtension(fileName).toLowerCase();
    return this.previewableExtensions.includes(extension);
  }

  getFileExtension(fileName: string): string {
    const parts = fileName.split(".");
    return parts.length > 1 ? parts[parts.length - 1] : "";
  }

  public downloadFile(
    data: any,
    blobResponse: HttpResponse<Blob>,
    defaultName: string,
  ) {
    const fileName =
      this.getFileNameFromContentDisposition(blobResponse) ?? defaultName;
    const a = document.createElement("a");
    const objectUrl = URL.createObjectURL(data);
    a.href = objectUrl;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }

  private getFileNameFromContentDisposition(
    blobResponse: HttpResponse<Blob>,
  ): string | null {
    const contentDisposition = blobResponse.headers.get("Content-Disposition");
    if (!contentDisposition) {
      return null; // Fallback filename
    }
    // Check for `filename*` (RFC 5987 encoding)
    const utf8FilenameMatch = contentDisposition.match(
      /filename\*=UTF-8''(.+)/,
    );
    if (utf8FilenameMatch && utf8FilenameMatch[1]) {
      return decodeURIComponent(utf8FilenameMatch[1]); // Decode RFC 5987-encoded filename
    }

    // Fallback to regular `filename`
    const simpleFilenameMatch = contentDisposition.match(/filename=(.+)/);
    if (simpleFilenameMatch && simpleFilenameMatch[1]) {
      return simpleFilenameMatch[1];
    }

    return null; // If no valid filename is found
  }
}

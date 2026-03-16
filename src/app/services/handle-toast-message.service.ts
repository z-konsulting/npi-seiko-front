import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomErrorCode } from '../../client/costSeiko';

@Injectable({
  providedIn: 'root',
})
export class HandleToastMessageService {
  constructor(private messageService: MessageService) {}

  handleError(error: HttpErrorResponse) {
    if (error) {
      if (error.status === 0 || error.error instanceof ErrorEvent) {
        // A client-side or network error occurred. Handle it accordingly.
        this.errorMessage(
          'A network error occurred, please retry again later.',
        );
      } else if (error.status === 400) {
        this.errorMessage('Invalid request content.');
      } else if (error.status === 401) {
        this.errorMessage('Authentication information is invalid.');
      } else if (error.status === 403) {
        this.errorMessage(
          'You do not have the necessary authorizations to access this resource.',
        );
      } else if (error.status === 404) {
        this.errorMessage(
          'Sorry, we cannot find the page you are looking for.',
        );
      } else if (error.status === 500) {
        this.errorMessage('Internal server error, please retry again later.');
      } else {
        this.handleErrorWithCodeV2(error);
      }
    }
  }

  handleErrorWithCode(error: HttpErrorResponse) {
    // All custom errors without global errors example : ENTITY_ALREADY_EXISTS ///
    const allErrors = Object.values(CustomErrorCode);
    if (
      error.error &&
      error.error.code &&
      allErrors.includes(error.error.code)
    ) {
      switch (error.error.code) {
        case CustomErrorCode.INVALID_EMAIL_OR_PASSWORD:
          this.errorMessage('Invalid credentials');
          break;
        default:
          this.errorMessage(error.error.message);
          break;
      }
    }
  }

  handleErrorWithCodeV2(error: any) {
    if (error) {
      const code = error.code;
      const message = error.message;
      const allErrors = Object.values(CustomErrorCode);
      if (message && code) {
        switch (code) {
          case CustomErrorCode.INVALID_EMAIL_OR_PASSWORD:
            this.errorMessage('Invalid credentials');
            break;
          default:
            this.errorMessage(message);
            break;
        }
      } else if (code) {
        this.handleErrorWithCode(error);
      } else {
        this.errorMessage(
          'A network error occurred, please retry again later.',
        );
      }
    }
  }

  errorMessage(detail: string) {
    this.messageService.clear();
    this.messageService.add({
      life: 5000,
      severity: 'error',
      summary: '',
      detail: detail,
    });
  }

  warningMessage(detail: string) {
    this.messageService.clear();
    this.messageService.add({
      life: 3500,
      severity: 'warn',
      summary: 'Warning',
      detail: detail,
    });
  }

  successMessage(detail: string) {
    this.messageService.clear();
    this.messageService.add({
      life: 3500,
      severity: 'success',
      summary: 'Success',
      detail: detail,
    });
  }

  infoMessage(detail: string) {
    this.messageService.clear();
    this.messageService.add({
      life: 3500,
      severity: 'info',
      summary: 'Info',
      detail: detail,
    });
  }
}

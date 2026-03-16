import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DestroyRef, inject } from '@angular/core';
import { FormService } from '../../services/components/form.service';
import { HandleToastMessageService } from '../../services/handle-toast-message.service';

export abstract class BaseModal {
  ref = inject(DynamicDialogRef);
  formService = inject(FormService);
  config = inject(DynamicDialogConfig);
  handleMessage = inject(HandleToastMessageService);
  destroyRef = inject(DestroyRef);

  get dataConfig(): any {
    return this.config.data;
  }

  closeDialog(value?: any) {
    this.ref.close(value);
  }
}

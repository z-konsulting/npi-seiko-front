import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { importProvidersFrom } from '@angular/core';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { NgxEchartsModule } from 'ngx-echarts';

export const provideExternal = () => [
  MessageService,
  DialogService,
  ConfirmationService,
  importProvidersFrom(
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
  ),
];

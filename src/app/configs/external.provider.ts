import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { importProvidersFrom } from '@angular/core';
import { DateAdapter, provideCalendar } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { NgxEchartsModule } from 'ngx-echarts';

export const provideExternal = () => [
  MessageService,
  DialogService,
  ConfirmationService,
  ...provideCalendar({
    provide: DateAdapter,
    useFactory: adapterFactory,
  }),
  importProvidersFrom(
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
  ),
];

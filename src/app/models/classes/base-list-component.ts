import { Table, TableLazyLoadEvent } from 'primeng/table';
import { DestroyRef, inject } from '@angular/core';

export abstract class BaseListComponent {
  title!: string;
  totalRecords!: number;
  loading: boolean = false;
  destroyRef = inject(DestroyRef);
  searchText: string = '';
  lastTableLazyLoadEvent!: TableLazyLoadEvent;
  rowsPerPageOptions = [1, 5, 10, 20];
  maxRowDefault = 10;

  loadData(event: TableLazyLoadEvent, primeNgTable?: Table): void {
    this.lastTableLazyLoadEvent = event;
    this.loading = true;
    if (primeNgTable) {
      primeNgTable.first = event?.first ?? 0;
    }
  }

  activateSearch(searchText: string): void {
    this.searchText = searchText;
    this.lastTableLazyLoadEvent.first = 0;
    this.loadData(this.lastTableLazyLoadEvent);
  }
}

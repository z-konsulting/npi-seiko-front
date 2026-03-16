import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.loadingSubject.asObservable();
  private titleSubject = new BehaviorSubject<string>('Loading...');
  title$ = this.titleSubject.asObservable();

  constructor() {}

  showLoader(title: string = 'Loading...') {
    this.titleSubject.next(title);
    this.loadingSubject.next(true);
  }

  hideLoader() {
    this.loadingSubject.next(false);
  }

  hideLoaderAfterTimeOut() {
    setTimeout(() => {
      this.hideLoader();
    }, 1000);
  }
}

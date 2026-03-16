import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';

import { debounceTime, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Icons } from '../../models/enums/icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-search-input',
  imports: [
    InputTextModule,
    FormsModule,
    FloatLabelModule,
    InputIconModule,
    IconFieldModule,
  ],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent implements OnInit {
  defaultValue = input<string>();
  disabled = input<boolean>(false);
  eventSearchValidate = output<string>();
  searchText: string = '';
  enterHasBeenActivated: boolean = false;
  lastSearchValue: string = '';
  protected readonly Icons = Icons;
  private keyUpSubject: Subject<any> = new Subject();
  private destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const defaultValue = this.defaultValue();
      if (defaultValue && defaultValue.trim() !== '') {
        this.searchText = defaultValue;
        this.searchEmitter(this.searchText);
      }
    });
  }

  ngOnInit() {
    this.keyUpSubject
      .pipe(debounceTime(1200), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onStopTyping();
      });
  }

  onKeyUp($event: KeyboardEvent): void {
    if ($event.key !== 'Enter') {
      this.enterHasBeenActivated = false;
      this.keyUpSubject.next(true);
    }
  }

  onEnterPress(): void {
    this.enterHasBeenActivated = true;
    this.searchEmitter(this.searchText);
  }

  onStopTyping(): void {
    if (!this.enterHasBeenActivated) {
      if (this.searchText) {
        this.searchEmitter(this.searchText.trim());
      } else {
        this.searchEmitter('');
      }
    }
  }

  searchEmitter(text: string): void {
    if (text !== this.lastSearchValue) {
      this.eventSearchValidate.emit(text);
      this.lastSearchValue = text;
    }
  }
}

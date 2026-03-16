import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-truncate-cell',
  imports: [TooltipModule],
  templateUrl: './truncate-cell.component.html',
  styleUrl: './truncate-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruncateCellComponent {
  textValue = input<string | null | undefined>('');
  /** CSS max-width applied to the cell (e.g. '100%', '200px'). Defaults to 100%. */
  maxWidth = input<string>('100%');
  textSize = input<string>('1rem');

  isOverflowing = signal<boolean>(false);

  private readonly spanRef = viewChild<ElementRef<HTMLSpanElement>>('textSpan');

  constructor() {
    afterRenderEffect(() => {
      // Read textValue() here so the effect re-runs whenever the text changes.
      // Without this, the effect only tracks spanRef (set once) and would never
      // re-evaluate overflow after the initial render.
      this.textValue();
      const span = this.spanRef()?.nativeElement;
      if (span) {
        this.isOverflowing.set(span.scrollWidth > span.offsetWidth);
      }
    });
  }
}

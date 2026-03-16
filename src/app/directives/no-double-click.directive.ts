import {
  Directive,
  ElementRef,
  inject,
  input,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appNoDoubleClick]',
  host: {
    '(click)': 'handleClick($event)',
  },
})
export class NoDoubleClickDirective {
  delay = input<number>(600);
  private isDisabled = false;

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  handleClick(event: Event) {
    const nativeButton =
      this.el.nativeElement.querySelector('button') || this.el.nativeElement;
    if (this.isDisabled || nativeButton.hasAttribute('disabled')) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
    }
    this.isDisabled = true;
    this.renderer.setAttribute(nativeButton, 'disabled', 'true'); // Disable the button
    setTimeout(() => {
      this.isDisabled = false;
      this.renderer.removeAttribute(nativeButton, 'disabled'); // Re-enable the button
    }, this.delay());
  }
}

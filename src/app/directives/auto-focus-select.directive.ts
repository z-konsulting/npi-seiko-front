import { AfterViewInit, Directive, ElementRef, inject } from "@angular/core";

@Directive({
  selector: "[appAutoFocusSelect]",
  standalone: true,
})
export class AutoFocusSelectDirective implements AfterViewInit {
  private el = inject(ElementRef);

  ngAfterViewInit(): void {
    setTimeout(() => {
      const input: HTMLInputElement | null =
        this.el.nativeElement.querySelector("input") ?? this.el.nativeElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }
}

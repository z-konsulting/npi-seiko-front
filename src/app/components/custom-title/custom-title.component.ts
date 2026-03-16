import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-custom-title',
  imports: [],
  templateUrl: './custom-title.component.html',
  styleUrl: './custom-title.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomTitleComponent {
  title = input.required<string>();
  size = input<string>();
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoaderService } from '../../services/components/loader.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-custom-loader',
  imports: [AsyncPipe],
  templateUrl: './custom-loader.component.html',
  styleUrl: './custom-loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomLoaderComponent {
  protected readonly loaderService = inject(LoaderService);
}

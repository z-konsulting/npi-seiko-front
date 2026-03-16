import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

export type BannerSeverity = "warn" | "danger" | "success" | "info";

const DEFAULT_ICONS: Record<BannerSeverity, string> = {
  warn: "pi pi-exclamation-triangle",
  danger: "pi pi-times-circle",
  success: "pi pi-check-circle",
  info: "pi pi-info-circle",
};

@Component({
  selector: "app-info-banner",
  templateUrl: "./info-banner.component.html",
  styleUrl: "./info-banner.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoBannerComponent {
  severity = input<BannerSeverity>("info");
  icon = input<string>("");
  title = input.required<string>();
  description = input<string | null | undefined>();

  resolvedIcon = computed<string>(
    () => this.icon() || DEFAULT_ICONS[this.severity()],
  );
}

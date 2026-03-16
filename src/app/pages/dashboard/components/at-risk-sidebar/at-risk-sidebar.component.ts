import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from "@angular/core";
import { DatePipe, DecimalPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { DrawerModule } from "primeng/drawer";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { InputTextModule } from "primeng/inputtext";
import { CostRequest } from "../../../../../client/costSeiko";
import { CostRequestStatusPipe } from "../../../../pipes/cost-request-status.pipe";
import { Icons } from "../../../../models/enums/icons";

export type CrListSidebarMode = "at-risk" | "expired";

export interface CrListSidebarConfig {
  title: string;
  dotColor: string;
  badgeColor: string;
  description: string;
  emptyMessage: string;
  footerDateLabel: string;
  footerDateField: "purchaseOrderExpectedDate" | "expirationDate";
  footerAccentColor: string;
}

const SIDEBAR_CONFIGS: Record<CrListSidebarMode, CrListSidebarConfig> = {
  "at-risk": {
    title: "At-Risk Request for quotations",
    dotColor: "#ea580c",
    badgeColor: "#ea580c",
    description:
      "Request for quotations with a purchase order expected date within the next 14 days that are not yet quoted.",
    emptyMessage: "No at-risk request for quotations",
    footerDateLabel: "PO Expected",
    footerDateField: "purchaseOrderExpectedDate",
    footerAccentColor: "#ea580c",
  },
  expired: {
    title: "Expired Request for quotations",
    dotColor: "#dc2626",
    badgeColor: "#dc2626",
    description:
      "Non-archived, non-finalized request for quotations whose quotation expiration date has passed.",
    emptyMessage: "No expired request for quotations",
    footerDateLabel: "Expired on",
    footerDateField: "expirationDate",
    footerAccentColor: "#dc2626",
  },
};

@Component({
  selector: "app-at-risk-sidebar",
  imports: [
    DrawerModule,
    DatePipe,
    DecimalPipe,
    FormsModule,
    ScrollingModule,
    TagModule,
    TooltipModule,
    InputTextModule,
    CostRequestStatusPipe,
  ],
  templateUrl: "./at-risk-sidebar.component.html",
  styleUrl: "./at-risk-sidebar.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CostRequestStatusPipe],
})
export class AtRiskSidebarComponent {
  visible = model<boolean>(false);
  costRequests = input<CostRequest[]>([]);
  mode = input<CrListSidebarMode>("at-risk");

  config = computed<CrListSidebarConfig>(() => SIDEBAR_CONFIGS[this.mode()]);

  searchQuery = signal<string>("");
  protected readonly Icons = Icons;
  private readonly costRequestStatusPipe = inject(CostRequestStatusPipe);

  filteredRequests = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.costRequests();
    return this.costRequests().filter(
      (cr) =>
        cr.costRequestReferenceNumber?.toLowerCase().includes(query) ||
        this.costRequestStatusPipe
          .transform(cr.status)
          ?.toLowerCase()
          .includes(query) ||
        cr.customer?.name?.toLowerCase().includes(query),
    );
  });

  getFooterDate(cr: CostRequest): string | undefined {
    return cr[this.config().footerDateField] as string | undefined;
  }
}

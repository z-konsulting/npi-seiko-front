import { Injectable } from "@angular/core";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { UserCreateEditDialogComponent } from "../../modales/admin/user-create-edit-dialog/user-create-edit-dialog.component";
import { CustomerCreateEditDialogComponent } from "../../modales/admin/customer-create-edit-dialog/customer-create-edit-dialog.component";
import { ProductNameCreateEditDialogComponent } from "../../modales/admin/product-name-create-edit-dialog/product-name-create-edit-dialog.component";
import { MaterialCategoryCreateEditDialogComponent } from "../../modales/admin/material-category-create-edit-dialog/material-category-create-edit-dialog.component";
import { MaterialCreateEditDialogComponent } from "../../modales/materials/material-create-edit-dialog/material-create-edit-dialog.component";
import { CurrencyCreateEditDialogComponent } from "../../modales/admin/currency-create-edit-dialog/currency-create-edit-dialog.component";
import { CostRequestCreateDialogComponent } from "../../modales/cost-request/cost-request-create-dialog/cost-request-create-dialog.component";
import {
  BomConfiguration,
  CostRequest,
  CostRequestLine,
  CostRequestStatus,
  Currency,
  Customer,
  FileInfo,
  GenerateQuotationPdfBody,
  Material,
  MaterialCategory,
  MaterialCostLine,
  MaterialSupplier,
  MaterialType,
  Process,
  ProductName,
  ShipmentLocation,
  ShipmentMethod,
  SupplierAndManufacturer,
  SupplierAndManufacturerType,
  Unit,
  User,
} from "../../../client/costSeiko";
import { Observable, race, take } from "rxjs";
import { map } from "rxjs/operators";
import { CostRequestEditDialogComponent } from "../../modales/cost-request/cost-request-edit-dialog/cost-request-edit-dialog.component";
import { CostRequestLineEditDialogComponent } from "../../modales/cost-request/cost-request-line-edit-dialog/cost-request-line-edit-dialog.component";
import { ProcessCreateEditDialogComponent } from "../../modales/admin/process-create-edit-dialog/process-create-edit-dialog.component";
import { ShipmentMethodCreateEditDialogComponent } from "../../modales/admin/shipment-method-create-edit-dialog/shipment-method-create-edit-dialog.component";
import { UnitCreateEditDialogComponent } from "../../modales/admin/unit-create-edit-dialog/unit-create-edit-dialog.component";
import { CurrencyHistoryDialogComponent } from "../../modales/admin/currency-history-dialog/currency-history-dialog.component";
import { CostRequestLineEstimationDialogComponent } from "../../modales/cost-request/cost-request-line-estimation-dialog/cost-request-line-estimation-dialog.component";
import { CustomerTermsAndConditionsDialogComponent } from "../../modales/admin/customer-terms-and-conditions-dialog/customer-terms-and-conditions-dialog.component";
import { CustomerContactsDialogComponent } from "../../modales/admin/customer-contacts-dialog/customer-contacts-dialog.component";
import { MaterialLinesManageDialogComponent } from "../../modales/cost-request/material-lines-manage-dialog/material-lines-manage-dialog.component";
import { MaterialLineFormDialogComponent } from "../../modales/cost-request/material-lines-manage-dialog/material-line-form-dialog/material-line-form-dialog.component";
import { MaterialSupplierManageDialogComponent } from "../../modales/materials/material-supplier-manage-dialog/material-supplier-manage-dialog.component";
import { MaterialSupplierFormDialogComponent } from "../../modales/materials/material-supplier-form-dialog/material-supplier-form-dialog.component";
import { FormGroup } from "@angular/forms";
import { FileSelected } from "../../components/manage-file/manage-file.component";
import { ManagePreviewFileComponent } from "../../components/manage-preview-file/manage-preview-file.component";
import { CostRequestMessagesDialogComponent } from "../../modales/cost-request/cost-request-messages-dialog/cost-request-messages-dialog.component";
import { CostRequestLineMessagesDialogComponent } from "../../modales/cost-request/cost-request-line-messages-dialog/cost-request-line-messages-dialog.component";
import { ToolingMessagesDialogComponent } from "../../modales/procurement/tooling-messages-dialog/tooling-messages-dialog.component";
import { ToolingRejectDialogComponent } from "../../modales/procurement/tooling-reject-dialog/tooling-reject-dialog.component";
import { ManageFileDialogComponent } from "../../modales/cost-request/manage-file-dialog/manage-file-dialog.component";
import { OnlyImportFileDialogComponent } from "../../components/only-import-file-dialog/only-import-file-dialog.component";
import { GenerateQuotationPdfDialogComponent } from "../../modales/cost-request/generate-quotation-pdf-dialog/generate-quotation-pdf-dialog.component";
import { ArchivedExportDialogComponent } from "../../modales/report/archived-export-dialog/archived-export-dialog.component";
import {
  ArchiveActiveCostRequestDialogComponent,
  ArchiveActiveCostRequestResult,
} from "../../modales/cost-request/archive-active-cost-request-dialog/archive-active-cost-request-dialog.component";
import { ExtendExpirationDialogComponent } from "../../modales/cost-request/extend-expiration-dialog/extend-expiration-dialog.component";
import { BomConfigurationDialogComponent } from "../../modales/admin/bom-configuration-dialog/bom-configuration-dialog.component";
import { CustomBomImportDialogComponent } from "../../modales/cost-request/custom-bom-import-dialog/custom-bom-import-dialog.component";
import { SupplierManufacturerCreateEditDialogComponent } from "../../modales/admin/supplier-manufacturer-create-edit-dialog/supplier-manufacturer-create-edit-dialog.component";
import { ShipmentLocationCreateEditDialogComponent } from "../../modales/admin/shipment-location-create-edit-dialog/shipment-location-create-edit-dialog.component";
import { CustomerShipmentLocationsDialogComponent } from "../../modales/admin/customer-shipment-locations-dialog/customer-shipment-locations-dialog.component";
import { MaterialSupplierSelectDialogComponent } from "../../modales/cost-request/cost-request-line-estimation-dialog/tabs/material-cost-estimation/material-supplier-select-dialog/material-supplier-select-dialog.component";
import { MaterialSubstituteSelectDialogComponent } from "../../modales/cost-request/cost-request-line-estimation-dialog/tabs/material-cost-estimation/material-substitute-select-dialog/material-substitute-select-dialog.component";

@Injectable({
  providedIn: "root",
})
export class ModalService {
  ref: DynamicDialogRef | undefined | null;

  constructor(private dialogService: DialogService) {}

  showUserCreateEditModal(editMode: boolean, user?: User) {
    this.ref = this.dialogService.open(UserCreateEditDialogComponent, {
      header: `${editMode ? "Edit" : "Create"} user`,
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "55%",
      data: {
        editMode: editMode,
        user: user,
      },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showCustomerCreateEditModal(editMode: boolean, customer?: Customer) {
    this.ref = this.dialogService.open(CustomerCreateEditDialogComponent, {
      header: `${editMode ? "Edit" : "Create"} customer`,
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "65%",
      data: {
        editMode: editMode,
        customer: customer,
      },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showProductNameCreateEditModal(editMode: boolean, productName?: ProductName) {
    this.ref = this.dialogService.open(ProductNameCreateEditDialogComponent, {
      header: `${editMode ? "Edit" : "Create"} product name`,
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "55%",
      data: {
        editMode: editMode,
        productName: productName,
      },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showMaterialCreateEditModal(
    editMode: boolean,
    materialType: MaterialType,
    material?: Material,
  ) {
    this.ref = this.dialogService.open(MaterialCreateEditDialogComponent, {
      header: `${editMode ? "Edit" : "Create"} material`,
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "80%",
      data: {
        editMode: editMode,
        material: material,
        materialType: materialType,
      },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showMaterialCategoryCreateEditModal(
    editMode: boolean,
    materialCategory?: MaterialCategory,
    prefill?: { name?: string },
  ) {
    this.ref = this.dialogService.open(
      MaterialCategoryCreateEditDialogComponent,
      {
        header: `${editMode ? "Edit" : "Create"} material category`,
        draggable: false,
        modal: true,
        closable: true,
        resizable: false,
        width: "55%",
        data: {
          editMode: editMode,
          materialCategory: materialCategory,
          prefill: prefill,
        },
      },
    );
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showCurrencyCreateEditModal(editMode: boolean, currency?: Currency) {
    this.ref = this.dialogService.open(CurrencyCreateEditDialogComponent, {
      header: `${editMode ? "Edit" : "Create"} currency`,
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "55%",
      data: {
        editMode: editMode,
        currency: currency,
      },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showCurrencyHistoryModal(currency: Currency) {
    this.ref = this.dialogService.open(CurrencyHistoryDialogComponent, {
      header: "Currency Exchange Rate History",
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "70%",
      data: {
        currency: currency,
      },
    });
    return this.waitForDialogResult<void>(this.ref);
  }

  showProcessCreateEditModal(editMode: boolean, process?: Process) {
    this.ref = this.dialogService.open(ProcessCreateEditDialogComponent, {
      header: `${editMode ? "Edit" : "Create"} process`,
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "55%",
      data: {
        editMode: editMode,
        process: process,
      },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showShipmentMethodCreateEditModal(
    editMode: boolean,
    shipmentMethod?: ShipmentMethod,
  ) {
    this.ref = this.dialogService.open(
      ShipmentMethodCreateEditDialogComponent,
      {
        header: `${editMode ? "Edit" : "Create"} shipment method`,
        draggable: false,
        modal: true,
        closable: true,
        resizable: false,
        width: "55%",
        data: {
          editMode: editMode,
          shipmentMethod: shipmentMethod,
        },
      },
    );
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showSupplierManufacturerCreateEditModal(
    editMode: boolean,
    item?: SupplierAndManufacturer,
    prefill?: { name?: string; type?: SupplierAndManufacturerType },
  ) {
    this.ref = this.dialogService.open(
      SupplierManufacturerCreateEditDialogComponent,
      {
        header: `${editMode ? "Edit" : "Create"} supplier/manufacturer`,
        draggable: false,
        modal: true,
        closable: true,
        resizable: false,
        width: "60%",
        data: {
          editMode: editMode,
          item: item,
          prefill: prefill,
        },
      },
    );
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showUnitCreateEditModal(
    editMode: boolean,
    unit?: Unit,
    prefill?: { name?: string },
  ) {
    this.ref = this.dialogService.open(UnitCreateEditDialogComponent, {
      header: `${editMode ? "Edit" : "Create"} unit`,
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "55%",
      data: {
        editMode: editMode,
        unit: unit,
        prefill: prefill,
      },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showCustomerTermsAndConditionsModal(customer: Customer) {
    this.ref = this.dialogService.open(
      CustomerTermsAndConditionsDialogComponent,
      {
        header: `Terms & Conditions - ${customer.name}`,
        draggable: false,
        modal: true,
        closable: true,
        resizable: false,
        width: "90%",
        data: {
          customer: customer,
        },
      },
    );
    return this.waitForDialogResult<void>(this.ref);
  }

  showCustomerContactsModal(customer: Customer) {
    this.ref = this.dialogService.open(CustomerContactsDialogComponent, {
      header: `Contacts - ${customer.name}`,
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "60%",
      data: {
        customer: customer,
      },
    });
    return this.waitForDialogResult<void>(this.ref);
  }

  showCostRequestCreateModal() {
    this.ref = this.dialogService.open(CostRequestCreateDialogComponent, {
      header: "Create Request For Quotation",
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "90%",
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showCostRequestEditModal(
    costRequest: CostRequest,
    viewOnly: boolean = false,
  ) {
    this.ref = this.dialogService.open(CostRequestEditDialogComponent, {
      header: viewOnly
        ? "View Request For Quotation"
        : "Edit Request For Quotation",
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "90%",
      data: {
        costRequest: costRequest,
        viewOnly: viewOnly,
      },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showCostRequestLineCreateEditModal(
    editMode: boolean,
    costRequestUid: string,
    line?: CostRequestLine,
    viewOnly: boolean = false,
    costRequestStatus?: string,
  ) {
    let header = editMode ? "Edit" : "Create";
    if (viewOnly) {
      header = "View";
    }
    this.ref = this.dialogService.open(CostRequestLineEditDialogComponent, {
      header: `${header} Request For Quotation Line`,
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "90%",
      data: {
        editMode: editMode,
        costRequestUid: costRequestUid,
        line: line,
        viewOnly: viewOnly,
        costRequestStatus: costRequestStatus,
      },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showManageFileModal(
    defaultUrl: string,
    files?: FileInfo[],
    onlyDownloadable: boolean = false,
    showDownloadBtn: boolean = true,
    showGlobalDownloadBtn: boolean = true,
  ) {
    this.ref = this.dialogService.open(ManageFileDialogComponent, {
      header: "Manage Files",
      draggable: false,
      modal: true,
      closable: false,
      resizable: false,
      width: "70%",
      data: {
        defaultUrl: defaultUrl,
        files: files || [],
        onlyDownloadable: onlyDownloadable,
        showDownloadBtn: showDownloadBtn,
        showGlobalDownloadBtn: showGlobalDownloadBtn,
      },
    });
    return this.waitForDialogResult<FileInfo[] | undefined>(this.ref);
  }

  showCostRequestLineEstimationModal(
    costRequest: CostRequest,
    line: CostRequestLine,
    isEngineering: boolean,
  ) {
    this.ref = this.dialogService.open(
      CostRequestLineEstimationDialogComponent,
      {
        header: "Request For Quotation Line Estimation",
        draggable: false,
        modal: true,
        closable: false,
        resizable: false,
        width: "90%",
        data: {
          costRequest: costRequest,
          line: line,
          isEngineering: isEngineering,
        },
      },
    );
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showMaterialLineFormModal(
    data: {
      existingEntries: { manufacturerUid: string; partNumber: string }[];
      materialType: MaterialType;
      initialValues?: Record<string, any>;
      initialManufacturer?: SupplierAndManufacturer | null;
    },
    isEdit: boolean = false,
  ) {
    this.ref = this.dialogService.open(MaterialLineFormDialogComponent, {
      header: isEdit ? "Edit material" : "Add material",
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "65%",
      data,
    });
    return this.waitForDialogResult<FormGroup | null>(this.ref);
  }

  showMaterialLinesManageModal(
    costRequest: CostRequest,
    line: CostRequestLine,
    materialLines: MaterialCostLine[],
    readOnly: boolean = false,
  ) {
    this.ref = this.dialogService.open(MaterialLinesManageDialogComponent, {
      header: `Manage material lines — ${line.customerPartNumber}${line.customerPartNumberRevision ? " Rev. " + line.customerPartNumberRevision : ""}`,
      draggable: true,
      modal: true,
      closable: false,
      resizable: false,
      width: "90%",
      data: {
        line: line,
        costRequestUid: costRequest.uid,
        materialLines: materialLines,
        readOnly: readOnly,
      },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showEstimationDetailModal(costRequest: CostRequest, line: CostRequestLine) {
    this.ref = this.dialogService.open(
      CostRequestLineEstimationDialogComponent,
      {
        header:
          line.status !== CostRequestStatus.PENDING_INFORMATION &&
          line.status !== CostRequestStatus.READY_FOR_REVIEW &&
          line.status !== CostRequestStatus.READY_TO_ESTIMATE
            ? "Estimation details"
            : "Request for quotation line estimation",
        draggable: false,
        modal: true,
        closable: false,
        resizable: false,
        width: "90%",
        data: {
          costRequest: costRequest,
          line: line,
          defaultView: "breakdown",
        },
      },
    );
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showMaterialSupplierManageModal(materialUid: string, materialName: string) {
    this.ref = this.dialogService.open(MaterialSupplierManageDialogComponent, {
      header: `Manage material suppliers — ${materialName}`,
      draggable: true,
      modal: true,
      closable: true,
      resizable: false,
      width: "80%",
      data: {
        materialUid,
      },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showMaterialSupplierSelectModal(
    materialUid: string,
    materialName: string,
    currentSupplierUid?: string,
  ): Observable<string | undefined> {
    this.ref = this.dialogService.open(MaterialSupplierSelectDialogComponent, {
      header: `Select supplier — ${materialName}`,
      draggable: true,
      modal: true,
      closable: true,
      resizable: false,
      width: "60%",
      data: { materialUid, currentSupplierUid },
    });
    return this.waitForDialogResult<string>(this.ref);
  }

  showMaterialSubstituteSelectModal(
    materialName: string,
  ): Observable<
    { materialSubstituteId: string; quantity: number } | undefined
  > {
    this.ref = this.dialogService.open(
      MaterialSubstituteSelectDialogComponent,
      {
        header: `Select substitute — ${materialName}`,
        draggable: true,
        modal: true,
        closable: true,
        resizable: false,
        width: "60%",
        data: {},
      },
    );
    return this.waitForDialogResult<{
      materialSubstituteId: string;
      quantity: number;
    }>(this.ref);
  }

  showMaterialSupplierFormModal(
    materialUid: string,
    materialSupplier: MaterialSupplier | null,
    currencies: Currency[],
    suppliers: SupplierAndManufacturer[],
  ) {
    const editMode = !!materialSupplier;
    this.ref = this.dialogService.open(MaterialSupplierFormDialogComponent, {
      header: editMode ? "Edit Material Supplier" : "Add Material Supplier",
      draggable: true,
      modal: true,
      closable: true,
      resizable: false,
      appendTo: "body",
      width: "70%",
      data: {
        materialUid,
        materialSupplier,
        currencies,
        suppliers,
      },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showPreviewFileDialog(fileSelected: FileSelected, downloadFileUrl: string) {
    this.ref = this.dialogService.open(ManagePreviewFileComponent, {
      header: `Preview: ${fileSelected.fileName}`,
      draggable: false,
      modal: true,
      resizable: false,
      appendTo: "body",
      baseZIndex: 10000,
      maximizable: true,
      closable: true,
      width: "80vw",
      height: "85vh",
      data: {
        fileSelected: fileSelected,
        downloadFileUrl: downloadFileUrl,
      },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showToolingRejectModal(): Observable<string | undefined> {
    this.ref = this.dialogService.open(ToolingRejectDialogComponent, {
      header: "Reject Tooling",
      draggable: false,
      modal: true,
      closable: false,
      resizable: false,
      width: "40rem",
      data: {},
    });
    return this.waitForDialogResult<string>(this.ref);
  }

  showCostRequestLineRejectModal(): Observable<string | undefined> {
    this.ref = this.dialogService.open(ToolingRejectDialogComponent, {
      header: "Reject quotation Line",
      draggable: false,
      modal: true,
      closable: false,
      resizable: false,
      width: "40rem",
      data: {},
    });
    return this.waitForDialogResult<string>(this.ref);
  }

  showRejectPriceModal(): Observable<string | undefined> {
    this.ref = this.dialogService.open(ToolingRejectDialogComponent, {
      header: "Reject Price",
      draggable: false,
      modal: true,
      closable: false,
      resizable: false,
      width: "40rem",
      data: {},
    });
    return this.waitForDialogResult<string>(this.ref);
  }

  showCostRequestLineMessageModal(
    costRequestUid: string,
    lineUid: string,
    readOnly: boolean = false,
  ) {
    this.ref = this.dialogService.open(CostRequestLineMessagesDialogComponent, {
      header: "Messages",
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "48rem",
      data: {
        costRequestUid,
        lineUid,
        readOnly,
      },
    });
    return this.waitForDialogResult<any>(this.ref);
  }

  showToolingMessageModal(toolingUid: string, readOnly: boolean = false) {
    this.ref = this.dialogService.open(ToolingMessagesDialogComponent, {
      header: "Messages",
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "48rem",
      data: {
        toolingUid,
        readOnly,
      },
    });
    return this.waitForDialogResult<any>(this.ref);
  }

  showCostRequestMessageModal(objectId: string, readOnly: boolean = false) {
    this.ref = this.dialogService.open(CostRequestMessagesDialogComponent, {
      header: `Messages`,
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "48rem",
      data: {
        objectId: objectId,
        readOnly: readOnly,
      },
    });
    return this.waitForDialogResult<any>(this.ref);
  }

  showOnlyUploadModal(
    header: string,
    uploadUrl: string,
    multiple: boolean = false,
    importForAllMachining: boolean = false,
  ) {
    this.ref = this.dialogService.open(OnlyImportFileDialogComponent, {
      header: header,
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "50%",
      data: {
        uploadUrl: uploadUrl,
        multiple: multiple,
        importForAllMachining: importForAllMachining,
      },
    });
    return this.waitForDialogResult<any>(this.ref);
  }

  showGenerateQuotationPdfModal(costRequest: CostRequest) {
    this.ref = this.dialogService.open(GenerateQuotationPdfDialogComponent, {
      header: "Generate Quotation PDF",
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "70%",
      data: {
        costRequest: costRequest,
      },
    });
    return this.waitForDialogResult<GenerateQuotationPdfBody>(this.ref);
  }

  showArchiveActiveCostRequestModal(
    costRequest: CostRequest,
  ): Observable<ArchiveActiveCostRequestResult | undefined> {
    this.ref = this.dialogService.open(
      ArchiveActiveCostRequestDialogComponent,
      {
        header: "Archive request for quotation",
        draggable: false,
        modal: true,
        closable: false,
        resizable: false,
        width: "36rem",
        data: { costRequest },
      },
    );
    return this.waitForDialogResult<ArchiveActiveCostRequestResult>(this.ref);
  }

  showExtendExpirationModal(
    costRequest: CostRequest,
  ): Observable<string | undefined> {
    this.ref = this.dialogService.open(ExtendExpirationDialogComponent, {
      header: "Extend Expiration",
      draggable: false,
      modal: true,
      closable: false,
      resizable: false,
      width: "25rem",
      data: { costRequest },
    });
    return this.waitForDialogResult<string>(this.ref);
  }

  showBomConfigurationModal(editMode: boolean, config?: BomConfiguration) {
    this.ref = this.dialogService.open(BomConfigurationDialogComponent, {
      header: `${editMode ? "Edit" : "Create"} BOM Configuration`,
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "70%",
      data: {
        editMode,
        config,
      },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showCustomBomImportModal(costRequestUid: string) {
    this.ref = this.dialogService.open(CustomBomImportDialogComponent, {
      header: "Import Custom BOM",
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "75%",
      data: { costRequestUid },
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showShipmentLocationCreateEditModal(
    editMode: boolean,
    item?: ShipmentLocation,
  ) {
    this.ref = this.dialogService.open(
      ShipmentLocationCreateEditDialogComponent,
      {
        header: `${editMode ? "Edit" : "Create"} shipment location`,
        draggable: false,
        modal: true,
        closable: true,
        resizable: false,
        width: "45%",
        data: {
          editMode,
          item,
        },
      },
    );
    return this.waitForDialogResult<boolean>(this.ref);
  }

  showCustomerShipmentLocationsModal(customer: Customer) {
    this.ref = this.dialogService.open(
      CustomerShipmentLocationsDialogComponent,
      {
        header: `Shipment Locations — ${customer.name}`,
        draggable: false,
        modal: true,
        closable: true,
        resizable: false,
        width: "60%",
        data: { customer },
      },
    );
    return this.waitForDialogResult<void>(this.ref);
  }

  showArchivedExportModal() {
    this.ref = this.dialogService.open(ArchivedExportDialogComponent, {
      header: "Export Archived request for quotations",
      draggable: false,
      modal: true,
      closable: true,
      resizable: false,
      width: "36rem",
    });
    return this.waitForDialogResult<boolean>(this.ref);
  }

  private waitForDialogResult<T>(
    ref: DynamicDialogRef | undefined | null,
  ): Observable<T | undefined> {
    if (!ref) {
      throw new Error("Dialog ref not initialized");
    }
    const close$ = ref.onClose.pipe(
      take(1),
      map((v) => v as T | undefined),
    );

    const destroy$ = ref.onDestroy.pipe(
      take(1),
      map(() => undefined as T | undefined),
    );

    return race(close$, destroy$);
  }
}

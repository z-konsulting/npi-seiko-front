import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  AutoCompleteMaterialBody,
  Material,
  Material2 as MaterialSDK,
  MaterialCreate,
  MaterialsPaginated,
  MaterialStatus,
  MaterialSupplier,
  MaterialSupplierCreate,
  MaterialSuppliersPaginated,
  MaterialSupplierUpdate,
  MaterialType,
  MaterialUpdate,
} from "../../client/costSeiko";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class MaterialRepo {
  constructor(private materialService: MaterialSDK) {}

  searchMaterials(
    offset?: number | undefined,
    limit?: number | undefined | null,
    search?: string,
    statuses?: MaterialStatus[],
    type?: MaterialType,
  ): Observable<MaterialsPaginated> {
    return fromRequest(
      this.materialService.searchMaterials({
        body: {
          searchText: search ?? "",
        },
        query: {
          offset: offset ?? 0,
          limit: limit ?? 10,
          statuses,
          type,
        },
      }),
    );
  }

  retrieveMaterial(materialUid: string): Observable<Material> {
    return fromRequest(
      this.materialService.retrieveMaterial({
        path: {
          uid: materialUid,
        },
      }),
    );
  }

  createMaterial(body: MaterialCreate) {
    return fromRequest(
      this.materialService.createMaterial({
        body,
      }),
    );
  }

  updateMaterial(
    materialUid: string,
    body: MaterialUpdate,
  ): Observable<Material> {
    return fromRequest(
      this.materialService.updateMaterial({
        body,
        path: {
          uid: materialUid,
        },
      }),
    );
  }

  archiveMaterial(materialUid: string): Observable<Material> {
    return fromRequest(
      this.materialService.archiveMaterial({
        path: {
          uid: materialUid,
        },
      }),
    );
  }

  autoCompleteMaterial(body: AutoCompleteMaterialBody): Observable<Material[]> {
    return fromRequest(
      this.materialService.autoCompleteMaterial({
        body,
      }),
    );
  }

  searchMaterialSuppliers(
    materialUid: string,
    offset: number = 0,
    limit: number = 1000,
    search: string = "",
  ): Observable<MaterialSuppliersPaginated> {
    return fromRequest(
      this.materialService.searchMaterialSuppliers({
        path: { uid: materialUid },
        query: { offset, limit },
        body: { searchText: search },
      }),
    );
  }

  createMaterialSupplier(
    materialUid: string,
    body: MaterialSupplierCreate,
  ): Observable<unknown> {
    return fromRequest(
      this.materialService.createMaterialSupplier({
        path: { uid: materialUid },
        body,
      }),
    );
  }

  retrieveMaterialSupplier(
    materialUid: string,
    materialSupplierUid: string,
  ): Observable<MaterialSupplier> {
    return fromRequest(
      this.materialService.retrieveMaterialSupplier({
        path: { uid: materialUid, materialSupplierUid },
      }),
    );
  }

  updateMaterialSupplier(
    materialUid: string,
    materialSupplierUid: string,
    body: MaterialSupplierUpdate,
  ): Observable<MaterialSupplier> {
    return fromRequest(
      this.materialService.updateMaterialSupplier({
        path: { uid: materialUid, materialSupplierUid },
        body,
      }),
    );
  }

  retrieveMaterialSuppliersOfMaterial(
    materialUid: string,
  ): Observable<MaterialSupplier[]> {
    return fromRequest(
      this.materialService.retrieveMaterialSuppliersOfMaterial({
        path: { uid: materialUid },
      }),
    );
  }

  archiveMaterialSupplier(materialUid: string, materialSupplierUid: string) {
    return fromRequest(
      this.materialService.archiveMaterialSupplier({
        path: { uid: materialUid, materialSupplierUid },
      }),
    );
  }
}

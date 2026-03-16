import { Injectable } from "@angular/core";
import {
  MaterialCategoriesPaginated,
  MaterialCategory,
  MaterialCategory2 as MaterialCategorySdk,
  MaterialCategoryCreate,
  MaterialCategoryUpdate,
} from "../../client/costSeiko";
import { Observable } from "rxjs";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class MaterialCategoryRepo {
  constructor(private materialCategoryService: MaterialCategorySdk) {}

  listAllMaterialCategories(): Observable<MaterialCategory[]> {
    return fromRequest(
      this.materialCategoryService.listAllMaterialCategories(),
    ) as Observable<MaterialCategory[]>;
  }

  searchMaterialCategories(
    offset?: number | undefined,
    limit?: number | undefined | null,
    search?: string,
  ): Observable<MaterialCategoriesPaginated> {
    return fromRequest(
      this.materialCategoryService.searchMaterialCategories({
        body: {
          searchText: search ?? "",
        },
        query: {
          offset: offset ?? 0,
          limit: limit ?? 10,
        },
      }),
    );
  }

  getMaterialCategory(
    materialCategoryUid: string,
  ): Observable<MaterialCategory> {
    return fromRequest(
      this.materialCategoryService.retrieveMaterialCategory({
        path: {
          uid: materialCategoryUid,
        },
      }),
    );
  }

  createMaterialCategory(name: string, abbreviation: string) {
    const body: MaterialCategoryCreate = {
      name,
      abbreviation,
    };
    return fromRequest(
      this.materialCategoryService.createMaterialCategory({
        body,
      }),
    );
  }

  updateMaterialCategory(
    materialCategoryUid: string,
    name: string,
    abbreviation: string,
  ): Observable<MaterialCategory> {
    const body: MaterialCategoryUpdate = {
      name,
      abbreviation,
    };
    return fromRequest(
      this.materialCategoryService.updateMaterialCategory({
        body,
        path: {
          uid: materialCategoryUid,
        },
      }),
    );
  }

  archiveMaterialCategory(materialCategoryUid: string) {
    return fromRequest(
      this.materialCategoryService.archiveMaterialCategory({
        path: {
          uid: materialCategoryUid,
        },
      }),
    );
  }

  existMaterialCategoryByName(name: string): Observable<string | null> {
    return fromRequest(
      this.materialCategoryService.existMaterialCategoryByName({
        body: { value: name },
      }),
    ) as Observable<string | null>;
  }
}

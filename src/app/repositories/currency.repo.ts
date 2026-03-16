import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  CurrenciesPaginated,
  Currency,
  Currency2 as CurrencySDK,
  CurrencyCreate,
  CurrencyUpdate,
  ExchangeRateCreate,
  ExchangeRateHistory,
  ExchangeRateUpdate,
} from "../../client/costSeiko";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class CurrencyRepo {
  constructor(private currencyService: CurrencySDK) {}

  listAllCurrencies(): Observable<Currency[]> {
    return fromRequest(this.currencyService.listAllCurrencies()) as Observable<Currency[]>;
  }

  searchCurrencies(
    offset?: number | undefined,
    limit?: number | undefined | null,
    search?: string,
  ): Observable<CurrenciesPaginated> {
    return fromRequest(
      this.currencyService.searchCurrencies({
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

  getCurrency(currencyUid: string): Observable<Currency> {
    return fromRequest(
      this.currencyService.retrieveCurrency({
        path: {
          uid: currencyUid,
        },
      }),
    );
  }

  createCurrency(
    code: string,
    exchangeRates: ExchangeRateCreate[],
  ): Observable<Currency> {
    const body: CurrencyCreate = {
      code,
      exchangeRates,
    };
    return fromRequest(
      this.currencyService.createCurrency({
        body,
      }),
    );
  }

  updateCurrency(
    currencyUid: string,
    code: string,
    exchangeRates: ExchangeRateUpdate[],
  ): Observable<Currency> {
    const body: CurrencyUpdate = {
      code,
      exchangeRates,
    };
    return fromRequest(
      this.currencyService.updateCurrency({
        body,
        path: {
          uid: currencyUid,
        },
      }),
    );
  }

  archiveCurrency(currencyUid: string): Observable<Currency> {
    return fromRequest(
      this.currencyService.archiveCurrency({
        path: {
          uid: currencyUid,
        },
      }),
    );
  }

  getCurrencyHistory(currencyUid: string): Observable<ExchangeRateHistory[]> {
    return fromRequest(
      this.currencyService.getCurrencyHistory({
        path: {
          uid: currencyUid,
        },
      }),
    );
  }
}

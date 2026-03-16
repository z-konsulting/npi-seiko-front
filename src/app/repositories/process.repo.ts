import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  Process,
  Process2 as ProcessSDK,
  ProcessCreate,
  ProcessesPaginated,
  ProcessUpdate,
} from "../../client/costSeiko";
import { fromRequest } from "../services/utils/api-utils";

@Injectable({
  providedIn: "root",
})
export class ProcessRepo {
  constructor(private processService: ProcessSDK) {}

  listAllProcesses(): Observable<Process[]> {
    return fromRequest(this.processService.listAllProcesses()) as Observable<
      Process[]
    >;
  }

  searchProcesses(
    offset?: number | undefined,
    limit?: number | undefined | null,
    search?: string,
  ): Observable<ProcessesPaginated> {
    return fromRequest(
      this.processService.searchProcesses({
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

  getProcess(processUid: string): Observable<Process> {
    return fromRequest(
      this.processService.retrieveProcess({
        path: {
          uid: processUid,
        },
      }),
    );
  }

  createProcess(
    name: string,
    currencyId: string,
    costPerMinute: number,
    dysonCycleTimeInSeconds: number,
    nonDysonCycleTimeInSeconds: number,
    setupProcess: boolean,
  ): Observable<unknown> {
    const body: ProcessCreate = {
      name,
      currencyId,
      costPerMinute,
      dysonCycleTimeInSeconds,
      nonDysonCycleTimeInSeconds,
      setupProcess,
    };
    return fromRequest(
      this.processService.createProcess({
        body,
      }),
    );
  }

  updateProcess(
    processUid: string,
    name: string,
    currencyId: string,
    costPerMinute: number,
    dysonCycleTimeInSeconds: number,
    nonDysonCycleTimeInSeconds: number,
    setupProcess: boolean,
  ): Observable<Process> {
    const body: ProcessUpdate = {
      name,
      currencyId,
      costPerMinute,
      dysonCycleTimeInSeconds,
      nonDysonCycleTimeInSeconds,
      setupProcess,
    };
    return fromRequest(
      this.processService.updateProcess({
        body,
        path: {
          uid: processUid,
        },
      }),
    );
  }

  archiveProcess(processUid: string): Observable<unknown> {
    return fromRequest(
      this.processService.archiveProcess({
        path: {
          uid: processUid,
        },
      }),
    );
  }

  getHighestUsageCountProcesses(): Observable<Process[]> {
    return fromRequest(
      this.processService.retrieveHighestUsageCountProcesses(),
    ) as Observable<Process[]>;
  }
}

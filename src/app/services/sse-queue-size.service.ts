import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthenticationService } from '../security/authentication.service';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class SseQueueSizeService {
  constructor(
    private zone: NgZone,
    private authService: AuthenticationService,
    private configService: ConfigService,
  ) {}

  getQueueSizeStream(): Observable<number> {
    return new Observable((observer) => {
      let eventSource: EventSourcePolyfill | null = null;
      let stopped = false;

      const connect = () => {
        if (stopped) {
          return;
        }

        const token = this.authService.getToken();
        const url = `${environment.backendUrl}/queue/stream`;

        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        console.debug('SSE queue connecting to:', url);

        eventSource = new EventSourcePolyfill(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          heartbeatTimeout: Number.MAX_SAFE_INTEGER,
        });

        eventSource.addEventListener('queue-size', (event: any) => {
          const value = Number(event.data);
          this.zone.run(() => observer.next(value));
        });

        eventSource.onopen = (open: any) => {
          console.debug('SSE queue opened:', open);
          this.zone.run(() => this.configService.updateBackendUp(true));
        };

        eventSource.onerror = (error: any) => {
          console.debug('SSE queue error:', error);
          this.zone.run(() => this.configService.updateBackendUp(false));

          if (stopped) {
            return;
          }

          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }

          const retryDelayMs = 5000; // 5s, à ajuster
          console.debug(
            `SSE queue: will retry connection in ${retryDelayMs} ms`,
          );

          setTimeout(() => {
            if (!stopped) {
              connect();
            }
          }, retryDelayMs);
        };
      };

      connect();

      return () => {
        stopped = true;
        if (eventSource) {
          console.debug('SSE queue closed by unsubscribe:', eventSource);
          eventSource.close();
          eventSource = null;
        }
      };
    });
  }
}

import { APP_INITIALIZER, ApplicationConfig } from "@angular/core";
import {
  PreloadAllModules,
  provideRouter,
  withPreloading,
} from "@angular/router";
import { routes } from "./app.routes";
import { ConfigService } from "./services/config.service";
import { provideHttpCore } from "./configs/http.provider";
import { provideExternal } from "./configs/external.provider";
import { providePrimeNG } from "primeng/config";
import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";
import { provideHeyApiClient as providecostSeikoClient } from "../client/npiSeiko/client/client.gen";
import { client as clientcostSeiko } from "../client/npiSeiko/client.gen";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { environment } from "../environments/environment";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";

function initializeApp(configService: ConfigService) {
  return () =>
    configService.loadConfig().then(() => {
      clientcostSeiko.setConfig({
        baseUrl: environment.backendUrl,
      });
    });
}

export const CustomPreset = definePreset(Aura, {
  semantic: {
    colorScheme: {
      light: {
        primary: {
          // Base
          color: "rgb(10,109,184)", // base
          inverseColor: "#ffffff",

          // Interaction
          hoverColor: "rgb(2,88,153)", // slightly darker
          activeColor: "rgb(1,60,104)", // darker

          // Lighter variants (backgrounds, highlights)
          50: "rgb(235,245,252)", // very light
          100: "rgb(210,232,246)",
          200: "rgb(170,210,235)",
          300: "rgb(120,180,220)",
          400: "rgb(70,145,200)",

          // Darker variants (text, borders, emphasis)
          600: "rgb(8,95,165)",
          700: "rgb(6,75,135)",
          800: "rgb(4,55,105)",
          900: "rgb(2,35,75)",

          // Transparent variants (overlays, hover backgrounds)
          alpha05: "rgba(10,109,184,0.05)",
          alpha10: "rgba(10,109,184,0.1)",
          alpha20: "rgba(10,109,184,0.2)",
          alpha30: "rgba(10,109,184,0.3)",
          alpha50: "rgba(10,109,184,0.5)",
        },

        highlight: {
          focusBackground: "{semantic.primary.50}",
        },
      },
    },
  },
});
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: CustomPreset,
        options: {
          cssLayer: {
            name: "primeng",
          },
          primaryColor: "#007fbe",
        },
      },
    }),
    providecostSeikoClient(clientcostSeiko),
    provideHttpCore(),
    provideExternal(),
    provideHttpClient(withFetch()),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigService],
      multi: true,
    },
  ],
};

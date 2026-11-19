// Pasos de la grabación de la app. Claude los adapta a la app del video en la fase 3.
// Cada paso recibe la página de Playwright y la URL de APP_URL.
// Consejo: pausas cortas (800 a 1500 ms) para que el ojo alcance a leer cada cambio.

import type { Page } from "playwright";

export interface Paso {
  nombre: string;
  ejecutar: (pagina: Page, appUrl: string) => Promise<void>;
}

export const pasos: Paso[] = [
  {
    nombre: "abrir-inicio",
    ejecutar: async (p, url) => {
      await p.goto(url, { waitUntil: "networkidle" });
      await p.waitForTimeout(1500);
    },
  },
  {
    nombre: "accion-principal",
    ejecutar: async (p) => {
      // Ejemplo: reemplaza el selector por el botón real de la app.
      // await p.getByRole("button", { name: "Generar" }).click();
      await p.waitForTimeout(1200);
    },
  },
  {
    nombre: "resultado",
    ejecutar: async (p) => {
      // Ejemplo: espera a que aparezca el resultado.
      // await p.getByText("Listo").waitFor();
      await p.waitForTimeout(1500);
    },
  },
];

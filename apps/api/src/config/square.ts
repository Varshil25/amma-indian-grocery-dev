import { SquareClient, SquareEnvironment } from "square";
import { env } from "./env.js";

let squareClient: SquareClient | null = null;

export function getSquareClient(): SquareClient | null {
  if (!env.SQUARE_ACCESS_TOKEN) return null;

  if (!squareClient) {
    squareClient = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment:
        env.SQUARE_ENVIRONMENT === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    });
  }

  return squareClient;
}

export function getLocationId(): string {
  return env.SQUARE_LOCATION_ID || "";
}

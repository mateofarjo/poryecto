import { counterRepository } from "../repositories/CounterRepository";
import { env } from "../config/env";

export async function getNextOrderNumber(): Promise<string> {
  const value = await counterRepository.getNext("orderNumber");
  return `${env.orderNumberPrefix}-${value.toString().padStart(6, "0")}`;
}

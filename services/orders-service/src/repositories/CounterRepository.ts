import { CounterModel } from "../models/Counter";

class CounterRepository {
  private static instance: CounterRepository;

  static getInstance(): CounterRepository {
    if (!CounterRepository.instance) {
      CounterRepository.instance = new CounterRepository();
    }
    return CounterRepository.instance;
  }

  async getNext(key: string): Promise<number> {
    const counter = await CounterModel.findOneAndUpdate(
      { key },
      { $inc: { value: 1 } },
      { upsert: true, new: true }
    ).exec();

    return counter?.value ?? 1;
  }
}

export const counterRepository = CounterRepository.getInstance();

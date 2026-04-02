export interface IEventProducerPort {
  public<T>(event: string, payload: T): Promise<void>;
}

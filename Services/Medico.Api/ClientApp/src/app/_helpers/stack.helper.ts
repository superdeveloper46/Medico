import { iStack } from "../_interfaces/iStack";

export class StackHelper<T> implements iStack<T> {
  private storage: T[] = [];
  constructor(private capacity: number = 1000) {}

  public push(item: T): void {
    if (this.size() === this.capacity)
      console.log("Stack has reached max capacity, reconsider use & implementation or increase capacity.");
    else
      this.storage.push(item);
  }

  public pop(): T | undefined {
    return this.storage.pop();
  }

  public peek(): T | undefined {
    return this.storage[this.size() - 1];
  }

  public size(): number {
    return this.storage.length;
  }
}
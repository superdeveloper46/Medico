import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CounterService {
  counter = 0;
  constructor() {}
  getCount(): number {
    return this.counter;
  }
  countPlus() {
    this.counter = this.counter + 1;
  }
  resetCount() {
    this.counter = 0;
  }
}

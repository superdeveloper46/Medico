import {
  Directive,
  EventEmitter,
  HostListener,
  OnInit,
  Output,
  OnDestroy,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Directive({
  selector: '[debounceClick]',
})
export class DebounceClickDirective implements OnInit, OnDestroy {
  @Output() debounceClicked = new EventEmitter();
  private clicks = new Subject();
  private subscription: Nullable<Subscription>;

  constructor() {}

  ngOnInit() {
    this.subscription = this.clicks
      .pipe(debounceTime(300))
      .subscribe(e => this.debounceClicked.emit(e));
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  @HostListener('click', ['$event'])
  clickEvent(event: any) {
    event.preventDefault();
    event.stopPropagation();
    this.clicks.next(event);
  }
}

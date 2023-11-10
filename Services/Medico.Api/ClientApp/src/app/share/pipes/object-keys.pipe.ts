import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'keys' })
export class ObjectKeysPipe implements PipeTransform {
  transform(value: any, _args: any[] = []): any {
    return Object.keys(value);
  }
}

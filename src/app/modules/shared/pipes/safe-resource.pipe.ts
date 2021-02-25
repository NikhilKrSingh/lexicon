import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeResource'
})
export class SafeResourcePipe implements PipeTransform {
  constructor(private domSanitizer: DomSanitizer) {}

  transform(value: string): any {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(value);
  }
}

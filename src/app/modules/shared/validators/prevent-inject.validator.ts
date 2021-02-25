import { AbstractControl } from '@angular/forms';

export function PreventInject(control: AbstractControl) {
  if (control.value) {
    const firstChar: string = control.value.charAt(0);
    const pattern = '[a-zA-Z0-9_]';
    if (!firstChar.match(pattern)) {
      return {insecure_input: true};
    }
    return null;
  }
}

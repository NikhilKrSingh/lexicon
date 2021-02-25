import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'secondsTohhmmss',
})
export class SecondsTohhmmssPipe implements PipeTransform {
  /**
   * Value must be in seconds
   */
  transform(value: number): string {
    return this.secondsToHms(value);
  }

  secondsToHms(time: number) {
    let hours = Math.floor(time / 3600);
    let minutes = Math.floor((time - hours * 3600) / 60);
    let seconds = Math.floor(time - hours * 3600 - minutes * 60);

    let hr;
    let min;
    let sec;

    hr = hours < 10 ? '0' + hours.toString() : hours.toString();
    min = minutes < 10 ? '0' + minutes.toString() : minutes.toString();
    sec = seconds < 10 ? '0' + seconds.toString() : seconds.toString();

    return `${hr}:${min}:${sec}`;
  }
}

import { Pipe, PipeTransform } from '@angular/core';
/*
 * Raise the value exponentially
 * Takes an exponent argument that defaults to 1.
 * Usage:
 *   value | exponentialStrength:exponent
 * Example:
 *   {{ 2 | exponentialStrength:10 }}
 *   formats to: 1024
*/
@Pipe({name: 'timezoneLabel'})
export class TimeZoneLabelPipe implements PipeTransform {
  transform(value: string, exponent?: string): string {
    let Label;
      if(value){
        switch(value) { 
            case 'Hawaiian Standard Time': { 
                Label = 'Hawaii Standard Time'
               break; 
            } 
            case 'Alaskan Standard Time': { 
                Label = 'Alaska Standard Time'
               break; 
            } 
            default: { 
              Label = value
               break; 
            } 
         } 

      }
    return Label;
  }
}
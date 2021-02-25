/* tslint:disable */
export interface IOffice  {
  id?:number;
  name?: string;
  checked?: boolean;
  disabled?:boolean;
  colorCode?: string;
}

export interface IEmployeeCreateStepEvent {
  currentStep: string;
  nextStep?: string;
  prevStep?:string;
}

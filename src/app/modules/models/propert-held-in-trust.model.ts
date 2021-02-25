
export class PropertyHeldInTrustModel{
    PropertyHeldInTrustModel(){
        this.PropertyLineItems = new Array<PropertyHeldInLineItemViewModel>();
    }
    Id:number;
    MatterId:number;
    ClientId:number;
    TrustName:string;
    PropertyLineItems:Array<PropertyHeldInLineItemViewModel>;
}

export class PropertyHeldInLineItemViewModel{
    Id: number;
    Description: string;
    Value: number;
}
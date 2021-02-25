export class MatterTrustAccountModel {
    id:number;
    MatterId:number;
    ClientId:number;
    minimumTrustBalance:number;
    trustBalanceGracePeriod:number;
    targetAccountForOverPayment:string;
}
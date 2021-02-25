export interface ISortEvent {
  newValue: string;
  prevValue: string;
  sorts: Array<ISortProp>;
}

export interface ISortProp {
  dir: "asc" | "desc";
  prop: string;
}

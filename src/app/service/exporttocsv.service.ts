import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class ExporttocsvService {
  constructor() {}
  downloadFile(data: any[], Columns: any[], filename = "data") {
    const csvData = this.ConvertToCSV({
      objArray: data,
      headerList: this.GetSelectedColumnsList(Columns),
      columns: Columns
    });
    const blob = new Blob(["\ufeff" + csvData], {
      type: "text/csv;charset=utf-8;"
    });
    const dwldLink = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const isSafariBrowser =
      navigator.userAgent.indexOf("Safari") !== -1 &&
      navigator.userAgent.indexOf("Chrome") === -1;
    if (isSafariBrowser) {
      dwldLink.setAttribute("target", "_blank");
    }
    dwldLink.setAttribute("href", url);
    dwldLink.setAttribute("download", filename + ".csv");
    dwldLink.style.visibility = "hidden";
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
  }

  ConvertToCSV({ objArray, headerList, columns }: { objArray: any; headerList: any, columns: any[] }) {
    const array =
      typeof objArray !== "object" ? JSON.parse(objArray) : objArray;
    let str = "";
    let row = "";
    for (const index in headerList) {
      let column = columns.find(a => a.Name == headerList[index]);
      if(column && column.displayName) {
        row += column.displayName + ",";
      } else {
        row += headerList[index] + ",";
      }
    }

    row = row.slice(0, -1);
    str += row + "\r\n";

    for (let i = 0; i < array.length; i++) {
      let line = "";
      for (const index in headerList) {
        const head = headerList[index];
        line += array[i][head] + ",";
      }
      line = line.slice(0, -1);
      str += line + "\r\n";
    }
    return str;
  }

  GetSelectedColumnsList(columnList: any[]) {
    return columnList
      .filter((obj: { isChecked: any }) => obj.isChecked)
      .map(({ Name }) => Name);
  }

  GetSelectedReportColumnsList(columnList: any[]) {
    return columnList
      .map(({ Name }) => Name);
  }

  downloadReportFile(data: any[], Columns: any[], filename = "data") {
    const csvData = this.ConvertToCSV({
      objArray: data,
      headerList: this.GetSelectedReportColumnsList(Columns),
      columns: Columns
    });
    const blob = new Blob(["\ufeff" + csvData], {
      type: "text/csv;charset=utf-8;"
    });
    const dwldLink = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const isSafariBrowser =
      navigator.userAgent.indexOf("Safari") !== -1 &&
      navigator.userAgent.indexOf("Chrome") === -1;
    if (isSafariBrowser) {
      dwldLink.setAttribute("target", "_blank");
    }
    dwldLink.setAttribute("href", url);
    dwldLink.setAttribute("download", filename + ".csv");
    dwldLink.style.visibility = "hidden";
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
  }
}

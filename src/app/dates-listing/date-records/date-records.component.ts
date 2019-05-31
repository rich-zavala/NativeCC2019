import { Component, OnInit, Input, OnChanges, SimpleChanges } from "@angular/core";

import { ICCDay, ICCRecord } from "../../../models";
import { dynCurrency } from "../../tools/utils";

import * as moment from "moment";
import * as lodash from "lodash";

@Component({
  selector: "app-date-records",
  templateUrl: "./date-records.component.html",
  styleUrls: ["./date-records.component.scss"]
})
export class DateRecordsComponent implements OnInit, OnChanges {
  @Input() date: ICCDay;
  @Input() records: ICCRecord[];
  @Input() filterValue: number;

  recordsCount = 0;
  displayDate = true;
  monthStr: string;
  dayStr: string;
  totalStr: string;

  constructor() {
  }

  ngOnInit() {
    this.monthStr = moment(this.date.date).format("MMM");
    this.dayStr = moment(this.date.date).format("DD");
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((<any[]>lodash.get(changes, "records.currentValue", [])).length > 0) {
      this.filterRecords();
    }
  }

  private filterRecords() {
    let displayRecords = [];
    switch (this.filterValue) {
      case 0:
      default:
        displayRecords = this.records;
        break;

      case 1:
        displayRecords = this.records.filter(r => r.checked);
        break;

      case 2:
        displayRecords = this.records.filter(r => !r.checked);
        break;
    }

    try {
      this.recordsCount = displayRecords.length;
      this.totalStr = dynCurrency(lodash.sum(displayRecords.map(r => r.price)));
      this.displayDate = displayRecords.length > 0;
    } catch (e) {
      console.error("Sepa!", displayRecords, this.records);
    }
  }
}

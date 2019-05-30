import { Component, OnInit, Input, ElementRef, ViewChild } from "@angular/core";

import { CCRecord } from "../../models";
import { CollectionService } from "../services/collection.service";

@Component({
    selector: "app-record-handler",
    template: ""
})
export class RecordHandlerComponent implements OnInit {
    @Input() cc: CCRecord;
    @ViewChild("cb") checkbox: ElementRef;

    public checkState = { checked: false };
    public emmitUpdates = false;
    public priceCurrency: string = "";

    constructor(public db: CollectionService) { }

    ngOnInit() {
        this.checkState.checked = this.cc.checked;
        this.priceCurrency = this.cc.priceCurrency();
    }

    checkUpdate() {
        if (this.checkbox.nativeElement.checked === this.cc.checked) {
            return;
        }

        if (!this.checkState.checked) {
            this.checkState.checked = true;
            this.cc.check();
            this.db.updateRecord(this.cc, this.emmitUpdates);
        } else {
            this.db.uncheck(this.cc, this.emmitUpdates)
                .subscribe(unchecked => {
                    this.checkState.checked = this.cc.checked;
                    if (!unchecked && this.checkbox.nativeElement) {
                        this.checkbox.nativeElement.toggle();
                    }
                });
        }
    }
}

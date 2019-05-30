import { Component, OnInit, Input, ElementRef, ViewChild } from "@angular/core";
import { Switch } from "tns-core-modules/ui/switch";
import { EventData } from "tns-core-modules/data/observable";
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

    initialized = false;

    constructor(public db: CollectionService) { }

    ngOnInit() {
        this.checkState.checked = this.cc.checked;
    }

    checkUpdate() {
        if (this.checkState.checked && !this.initialized) {
            this.initialized = true;
            return;
        }

        if (!this.checkState.checked) {
            this.checkState.checked = true;
            this.cc.check();
            this.db.updateRecord(this.cc, this.emmitUpdates);
        } else {
            this.db.uncheck(this.cc, this.emmitUpdates)
                .subscribe(unchecked => {
                    this.checkState.checked = !unchecked;
                    if (!unchecked) {
                        this.initialized = false; // To avoid double call
                        this.checkbox.nativeElement.toggle();
                    }
                });
        }
    }
}

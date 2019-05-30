import { Component, OnInit, Input } from "@angular/core";
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
    public checkState = { checked: false };
    public emmitUpdates = false;

    private initialized = false;

    constructor(public db: CollectionService) { }

    ngOnInit() {
        this.checkState.checked = this.cc.checked;
    }

    // checkUpdate($event) {
    //     console.log($event);

    //     if (($event.target && $event.target.checked) || ($event.detail && $event.detail.checked)) {
    //         this.cc.check();
    //         this.db.updateRecord(this.cc, this.emmitUpdates);
    //     } else {
    //         this.db.uncheck(this.cc, this.emmitUpdates)
    //             .subscribe(
    //                 unchecked => {
    //                     if (!unchecked) {
    //                         this.checkState.checked = true;
    //                     }
    //                 }
    //             );
    //     }
    // }

    checkUpdate(args: EventData) {
        if (this.checkState.checked && !this.initialized) {
            this.initialized = true;
            return;
        }

        const switchEle = args.object as Switch;
        this.checkState.checked = switchEle.checked;

        if (switchEle.checked) {
            this.cc.check();
            this.db.updateRecord(this.cc, this.emmitUpdates);
        } else {
            this.db.uncheck(this.cc, this.emmitUpdates)
                .subscribe(unchecked => this.checkState.checked = !unchecked);
        }
    }
}

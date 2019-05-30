import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";

import * as Rx from "rxjs";
import * as lodash from "lodash";
import * as moment from "moment";
import { CC_DATA } from "../tools/cc";
import { DATE_FORMAT } from "~/constants/formats";
import { DbHandlingService } from "../services/db-handling.service";

@Component({
    selector: "Featured",
    moduleId: module.id,
    templateUrl: "./featured.component.html"
})
export class FeaturedComponent implements OnInit {

    constructor(private db: DbHandlingService) {
        // Use the component constructor to inject providers.
    }

    ngOnInit(): void {
        // Init your component properties here.
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    load() {
        this.db.db.clear().subscribe(() => {
            let count = 0;
            const sample = lodash.sampleSize(CC_DATA, 800);
            Rx.concat(...sample.map(r => {
                const d = {
                    title: r.titulo,
                    volumen: r.volumen,
                    price: r.precio,
                    checked: r.adquirido === 1,
                    publishDate: moment(r.fecha).format(DATE_FORMAT),
                    checkedDate: moment(r.fecha_adquisicion).valueOf(),
                    recordDate: moment(r.fecha_registro).valueOf()
                };
                return this.db.db.insert(d as any);
            }))
                .subscribe(res => {
                    count++;
                    console.log(`Inserted: ${count}/${lodash.size(sample)}`);
                });
        });
    }
}

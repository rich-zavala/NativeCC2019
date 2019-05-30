import { NgModule } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { RecordDetailsComponent } from "./record-details.component";

import { TranslateModule } from "@ngx-translate/core";

@NgModule({
    imports: [
        NativeScriptRouterModule.forChild([
            { path: "", component: RecordDetailsComponent }
        ]),
        NativeScriptCommonModule,
        TranslateModule
    ],
    declarations: [
        RecordDetailsComponent
    ]
})
export class RecordDetailsModule { }

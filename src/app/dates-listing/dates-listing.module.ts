import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { NativeScriptFormsModule } from "nativescript-angular/forms";

import { DatesListingComponent } from "./dates-listing.component";
import { DateRecordsComponent } from "./date-records/date-records.component";

import { RecordRowModule } from "../record-row/record-row.module";

import { TranslateModule } from "@ngx-translate/core";
import { NativeScriptDateTimePickerModule, } from "nativescript-datetimepicker/angular";
import { NativeScriptUIAutoCompleteTextViewModule } from "nativescript-ui-autocomplete/angular";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        NativeScriptRouterModule.forChild([
            { path: "", component: DatesListingComponent }
        ]),
        NativeScriptFormsModule,
        ReactiveFormsModule,
        TranslateModule,
        NativeScriptDateTimePickerModule,
        NativeScriptUIAutoCompleteTextViewModule,
        RecordRowModule
    ],
    declarations: [
        DatesListingComponent,
        DateRecordsComponent
    ]
})
export class DatesListingModule { }


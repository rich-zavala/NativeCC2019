import { NgModule } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { TNSCheckBoxModule } from "nativescript-checkbox/angular";

import { RecordRowComponent } from "./record-row.component";

import { TranslateModule } from "@ngx-translate/core";
import { NativeScriptDateTimePickerModule, } from "nativescript-datetimepicker/angular";
import { NativeScriptUIAutoCompleteTextViewModule } from "nativescript-ui-autocomplete/angular";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        NativeScriptFormsModule,
        TranslateModule,
        TNSCheckBoxModule,
        NativeScriptDateTimePickerModule,
        NativeScriptUIAutoCompleteTextViewModule
    ],
    declarations: [
        RecordRowComponent
    ],
    exports: [
        RecordRowComponent
    ]
})
export class RecordRowModule { }



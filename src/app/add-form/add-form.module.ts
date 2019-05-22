import { NgModule } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { ReactiveFormsModule } from "@angular/forms";

import { AddFormRoutingModule } from "./add-form-routing.module";
import { AddFormComponent } from "./add-form.component";

import { TranslateModule } from "@ngx-translate/core";
import { NativeScriptDateTimePickerModule, } from "nativescript-datetimepicker/angular";
import { NativeScriptUIAutoCompleteTextViewModule } from "nativescript-ui-autocomplete/angular";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        AddFormRoutingModule,
        NativeScriptFormsModule,
        ReactiveFormsModule,
        TranslateModule,
        NativeScriptDateTimePickerModule,
        NativeScriptUIAutoCompleteTextViewModule
    ],
    declarations: [
        AddFormComponent
    ]
})
export class AddFormModule { }

import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { NativeScriptFormsModule } from "nativescript-angular/forms";

import { AddFormComponent } from "./add-form.component";

import { TranslateModule } from "@ngx-translate/core";
import { NativeScriptDateTimePickerModule, } from "nativescript-datetimepicker/angular";
import { NativeScriptUIAutoCompleteTextViewModule } from "nativescript-ui-autocomplete/angular";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        NativeScriptRouterModule.forChild([
            { path: "", component: AddFormComponent }
        ]),
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

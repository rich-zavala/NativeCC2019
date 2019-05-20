import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { AddFormRoutingModule } from "./add-form-routing.module";
import { AddFormComponent } from "./add-form.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        AddFormRoutingModule,
        FormsModule,
        ReactiveFormsModule
    ],
    declarations: [
        AddFormComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class AddFormModule { }

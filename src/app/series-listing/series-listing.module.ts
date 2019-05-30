import { NgModule } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { ReactiveFormsModule } from "@angular/forms";

import { SeriesListingRoutingModule } from "./series-listing-routing.module";
import { SeriesListingComponent } from "./series-listing.component";
// import { AddFormRoutingModule } from "./add-form-routing.module";
// import { AddFormComponent } from "./add-form.component";
import { RecordRowModule } from "../record-row/record-row.module";

import { TranslateModule } from "@ngx-translate/core";
import { NativeScriptDateTimePickerModule, } from "nativescript-datetimepicker/angular";
import { NativeScriptUIAutoCompleteTextViewModule } from "nativescript-ui-autocomplete/angular";

@NgModule({
  imports: [
    NativeScriptCommonModule,
    SeriesListingRoutingModule,
    NativeScriptFormsModule,
    ReactiveFormsModule,
    TranslateModule,
    NativeScriptDateTimePickerModule,
    NativeScriptUIAutoCompleteTextViewModule,
    RecordRowModule
  ],
  declarations: [
    SeriesListingComponent
  ]
})
export class SeriesListingModule { }

// import { NgModule } from "@angular/core";
// import { FormsModule } from "@angular/forms";
// import { CommonModule } from "@angular/common";
// import { IonicModule } from "@ionic/angular";

// import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
// import { TranslateModule } from "@ngx-translate/core";

// import { RecordRowComponent } from "./record-row.component";
// import { RecordDetailsComponent } from "./record-details/record-details.component";
// import { RecordHandlerComponent } from "./record-handler.component";

// import { library } from "@fortawesome/fontawesome-svg-core";
// import { faCheckSquare } from "@fortawesome/free-solid-svg-icons/faCheckSquare";

// library.add(faCheckSquare);

// @NgModule({
//     imports: [
//         CommonModule,
//         FormsModule,
//         IonicModule,
//         TranslateModule,
//         FontAwesomeModule
//     ],
//     declarations: [
//         RecordRowComponent,
//         RecordDetailsComponent,
//         RecordHandlerComponent
//     ],
//     exports: [
//         RecordRowComponent
//     ],
//     entryComponents: [
//         RecordDetailsComponent
//     ]
// })
// export class RecordRowModule { }


import { NgModule } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
// import { ReactiveFormsModule } from "@angular/forms";

// import { SeriesListingRoutingModule } from "./series-listing-routing.module";
import { RecordRowComponent } from "./record-row.component";
// import { AddFormRoutingModule } from "./add-form-routing.module";
// import { AddFormComponent } from "./add-form.component";

import { TranslateModule } from "@ngx-translate/core";
import { NativeScriptDateTimePickerModule, } from "nativescript-datetimepicker/angular";
import { NativeScriptUIAutoCompleteTextViewModule } from "nativescript-ui-autocomplete/angular";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        // SeriesListingRoutingModule,
        NativeScriptFormsModule,
        // ReactiveFormsModule,
        TranslateModule,
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



import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { SeriesListingComponent } from "./series-listing.component";

const routes: Routes = [
    { path: "", component: SeriesListingComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class SeriesListingRoutingModule { }

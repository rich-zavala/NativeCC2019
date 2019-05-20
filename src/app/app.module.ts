import { NgModule } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptUISideDrawerModule } from "nativescript-ui-sidedrawer/angular";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { knownFolders } from "tns-core-modules/file-system";

import * as Rx from "rxjs";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";

export class NativeScriptLoader extends TranslateLoader {
    prefix = "/assets/i18n/";
    suffix = ".json";

    getTranslation(lang: string): Observable<any> {
        return Rx.from(knownFolders.currentApp().getFile(`${this.prefix}${lang}${this.suffix}`).readText())
            .pipe(map((data: any) => JSON.parse(data)));
    }
}

export function HttpLoaderFactory() {
    return new NativeScriptLoader();
}

@NgModule({
    bootstrap: [
        AppComponent
    ],
    imports: [
        AppRoutingModule,
        NativeScriptModule,
        NativeScriptUISideDrawerModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory
            }
        })
    ],
    declarations: [
        AppComponent
    ]
})
export class AppModule { }

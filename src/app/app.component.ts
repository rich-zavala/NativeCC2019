import { Component, OnInit } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { DrawerTransitionBase, RadSideDrawer, SlideInOnTopTransition } from "nativescript-ui-sidedrawer";
import { device } from "tns-core-modules/platform";
import * as app from "tns-core-modules/application";

import * as Rx from "rxjs";
import { filter } from "rxjs/operators";
import { TranslateService } from "@ngx-translate/core";
import * as moment from "moment";

@Component({
    moduleId: module.id,
    selector: "ns-app",
    templateUrl: "app.component.html"
})
export class AppComponent implements OnInit {
    private _activatedUrl: string;
    private _sideDrawerTransition: DrawerTransitionBase;

    constructor(
        private router: Router,
        private routerExtensions: RouterExtensions,
        private translate: TranslateService) {
        this.initTranslate();
    }

    ngOnInit(): void {
        this._activatedUrl = "/home";
        this._sideDrawerTransition = new SlideInOnTopTransition();

        this.router.events
            .pipe(filter((event: any) => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => this._activatedUrl = event.urlAfterRedirects);
    }

    get sideDrawerTransition(): DrawerTransitionBase {
        return this._sideDrawerTransition;
    }

    isComponentSelected(url: string): boolean {
        return this._activatedUrl === url;
    }

    onNavItemTap(navItemRoute: string): void {
        this.routerExtensions.navigate([navItemRoute], {
            transition: {
                name: "fade"
            }
        });

        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.closeDrawer();
    }

    private initTranslate() {
        this.translate.setDefaultLang("en");
        let UseResolver: Rx.Observable<any>;

        if (device.language) {
            UseResolver = this.translate.use(device.language);
            moment.locale(device.language);
        } else {
            UseResolver = this.translate.use("es");
            moment.locale("es");
        }

        UseResolver.subscribe();
    }
}

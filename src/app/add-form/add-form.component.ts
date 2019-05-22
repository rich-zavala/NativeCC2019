

import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";

import { CollectionService } from "../services/collection.service";
import { CCRecord } from "../../../src/models/record";
import { DATE_FORMAT } from "../../../src/constants/formats";

import { TranslateService } from "@ngx-translate/core";

import * as Rx from "rxjs";
import * as moment from "moment";
import * as lodash from "lodash";

@Component({
    selector: "AddForm",
    moduleId: module.id,
    templateUrl: "./add-form.component.html"
})
export class AddFormComponent implements OnInit {
    // @ViewChild("title") titleField: any;
    // @ViewChild("volumen") volumenField: any;

    ccRecordForm: FormGroup = new FormGroup({
        title: new FormControl("", Validators.required),
        volumen: new FormControl("", Validators.required),
        price: new FormControl("", Validators.required),
        variant: new FormControl(""),
        checked: new FormControl(false),
        publishDate: new FormControl("", Validators.required)
    });

    titles: string[] = [];
    filteredTitles: string[] = [];
    showAutocomplete = false;
    lockAutocompleteHidden = false;

    private backSubs: Rx.Subscription;

    private checkedText = "No";
    private strs;

    constructor(
        private db: CollectionService,
        translate: TranslateService
    ) {
        translate.get("add.dialog").subscribe(val => this.strs = val);

        this.updateTitles();
        this.initForm();
    }

    ngOnInit() {
        // setTimeout(() => this.titleField.setFocus(), 500);

        // console.log("titleField", this.titleField);
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    private updateTitles() {
        return this.db.getSeries().subscribe(titles => {
            console.log("updateTitles", titles);
            this.titles = titles.map(t => t.name);
        });
    }

    private initForm() {
        this.ccRecordForm.reset();
        this.ccRecordForm.controls.publishDate.setValue(moment().format(DATE_FORMAT));


        this.ccRecordForm.controls.title.valueChanges
            .subscribe(
                value => {
                    if (value) {
                        if (value.length < 3) { // Three characters minimum
                            this.filteredTitles = [];
                        } else {
                            const filterValue = value.toLowerCase();
                            this.filteredTitles = this.titles.filter(option => option.toLowerCase().includes(filterValue));
                        }

                        this.showAutocomplete = this.filteredTitles.length > 0;
                    }
                }
            );


        return this.ccRecordForm.controls.checked.valueChanges.subscribe(value => this.checkedText = value ? "Yes" : "No");
    }

    updateTitle() {
        const value = this.ccRecordForm.controls.title.value;
        if (value) {
            this.ccRecordForm.controls.title.setValue(value.toUpperCase());
        }
    }

    private selectTitle(option: string) {
        this.ccRecordForm.controls.title.setValue(option);
        this.ccRecordForm.controls.title.updateValueAndValidity();
        this.hideAutocomplete();
        // this.volumenField.setFocus();
    }

    private hideAutocomplete() {
        this.showAutocomplete = false;
    }

    private hideAutocompleteLock() {
        this.lockAutocompleteHidden = true;
        this.hideAutocomplete();
    }

    save() {
        this.lockAutocompleteHidden = false; // Unlock autocomplete
        for (const i in this.ccRecordForm.value) {
            if (typeof this.ccRecordForm.value[i] === "string") {
                this.ccRecordForm.value[i] = this.ccRecordForm.value[i].trim();
            }
        }

        const ccValue = lodash.cloneDeep(this.ccRecordForm.value);
        ccValue.publishDate = moment(ccValue.publishDate).format(DATE_FORMAT);

        this.db.insert(this.ccRecordForm.value)
            .subscribe(
                res => {
                    if (res.duplicate) {
                        this.showWarnDialog(res.record);
                    } else {
                        this.initForm();
                        this.successToast();
                        this.updateTitles();
                    }
                }
            );
    }

    async successToast() {
        console.log("Success");
        // const toast = await this.toastController.create({
        //     message: this.strs.success,
        //     duration: 2000,
        //     showCloseButton: true
        // });
        // toast.present();
    }

    showWarnDialog(cc: CCRecord) {
        // this.vibration.vibrate(700);

        const header = this.strs.header;
        const variant = cc.variant.length > 0 ? `${this.strs.variant}:\n${cc.variant}\n` : "";
        const nativeMessage = `${cc.title} #${cc.volumen}\n${variant}\n${this.strs.dateRegistered}:\n${cc.detailDates.registry}\n\n${this.strs.message}`;

        alert(nativeMessage);

        // const alternativeDialog = async () => {
        //     const alert = await this.alertController.create({
        //         header,
        //         message: nativeMessage.replace(/\n/ig, "<br>"),
        //         buttons: ["OK"]
        //     });

        //     await alert.present();
        // };

        // try {
        //     Rx.from(this.dialogs.alert(nativeMessage, header))
        //         .subscribe(
        //             () => { },
        //             () => alternativeDialog()
        //         );
        // } catch (e) {
        //     alternativeDialog();
        // }
    }

    close() {
        // this.modalCtrl.getTop();
        // this.modalCtrl.dismiss();
    }
}

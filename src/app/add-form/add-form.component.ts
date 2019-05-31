// tslint:disable: max-line-length
import { Component, ViewChild, ElementRef } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";

import { ObservableArray } from "tns-core-modules/data/observable-array";
import { TokenModel, AutoCompleteEventData, } from "nativescript-ui-autocomplete";

import { CollectionService } from "../services/collection.service";
import { TranslateService } from "@ngx-translate/core";

import { CCRecord } from "../../../src/models/record";
import { DATE_FORMAT } from "../../../src/constants/formats";

import * as moment from "moment";

@Component({
    selector: "AddForm",
    moduleId: module.id,
    templateUrl: "./add-form.component.html"
})
export class AddFormComponent {
    @ViewChild("autocomplete") autocomplete: ElementRef;

    ccRecordForm: FormGroup = new FormGroup({
        title: new FormControl("", Validators.required),
        volumen: new FormControl("", Validators.required),
        price: new FormControl("", Validators.required),
        variant: new FormControl(""),
        checked: new FormControl(false),
        publishDate: new FormControl("", Validators.required)
    });

    titles: ObservableArray<TokenModel>;
    private checkedText = "No";
    private strs;

    constructor(
        private db: CollectionService,
        translate: TranslateService
    ) {
        translate.get("add.dialog").subscribe(val => this.strs = val);

        this.updateTitles();
        this.initForm();
        this.ccRecordForm.controls.checked.valueChanges.subscribe(value => this.checkedText = value ? "Yes" : "No");
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    private fieldInvalid(controlName: string) {
        const control = this.ccRecordForm.controls[controlName];
        return control.touched && control.invalid;
    }

    private updateTitles() {
        this.titles = new ObservableArray<TokenModel>();
        this.db.db.getSeries().subscribe(titles => this.titles.push(...titles.map(t => new TokenModel(t.name, undefined))));
    }

    get dataTitles(): ObservableArray<TokenModel> {
        return this.titles;
    }

    public onAutoCompleteLoad(args: AutoCompleteEventData) {
        const autocomplete = args.object;
        const rad = autocomplete.android;
        const nativeEditText = rad.getTextField();
        nativeEditText.setTextSize(16);
        nativeEditText.setPadding(0, 0, 0, 0);
        this.autoCompleteReset();
    }

    public onTitleTextChanged(args) {
        this.ccRecordForm.controls.title.setValue(args.text);
        this.ccRecordForm.controls.title.updateValueAndValidity();
    }

    public autoCompleteReset() {
        if (this.autocomplete) {
            const natEle = this.autocomplete.nativeElement;
            natEle.android.getTextField().requestFocus();
            natEle.resetAutoComplete();
        }
    }

    private initForm() {
        this.autoCompleteReset();
        this.ccRecordForm.reset();
        this.ccRecordForm.controls.publishDate.setValue(moment().format(DATE_FORMAT));
    }

    updateTitle() {
        const value = this.ccRecordForm.controls.title.value;
        if (value) {
            this.ccRecordForm.controls.title.setValue(value.toUpperCase());
        }
    }

    save() {
        for (const i in this.ccRecordForm.value) {
            if (typeof this.ccRecordForm.value[i] === "string") {
                this.ccRecordForm.value[i] = this.ccRecordForm.value[i].trim();
            }
        }

        const ccRecord = new CCRecord(this.ccRecordForm.value);
        this.db.insert(ccRecord)
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
        const variant = cc.variant && cc.variant.length > 0 ? `${this.strs.variant}:\n${cc.variant}\n` : "";
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

// tslint:disable: max-line-length
import { Component, OnInit, ViewChildren, QueryList } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
// import { ModalController, PopoverController, IonSelect } from "@ionic/angular";

import { ICCYear, ICCDay, CCRecord } from "src/models";

import * as Rx from "rxjs";
import { delay } from "rxjs/operators";
import * as lodash from "lodash";
import * as moment from "moment";

import { CollectionService } from "../services/collection.service";
// import { DateRecordsComponent } from "./date-records/date-records.component";
import { DateRecordsComponent } from "./date-records/date-records.component";
// import { AddFormComponent } from "../add-form/add-form.component";

import { TabView, TabViewItem, SelectedIndexChangedEventData } from "tns-core-modules/ui/tab-view";


interface ITDatesCollection {
    [key: string]: CCRecord[];
}

@Component({
    selector: "DatesListing",
    templateUrl: "./dates-listing.component.html",
    styleUrls: ["./dates-listing.component.scss"]
})
export class DatesListingComponent implements OnInit {
    private static singleton: DatesListingComponent;

    @ViewChildren(DateRecordsComponent) dateChildren: QueryList<DateRecordsComponent>;
    // dateChildren: any;
    //   @ViewChild("filter") filterChild: IonSelect;
    // filterChild: any;

    years: ICCYear[] = [];
    yearsNumbers: number[] = [];
    selectedYear: ICCYear;
    selectedYearDates: ICCDay[] = [];
    records: ITDatesCollection = {};
    // Rrecords: CCRecord[][];

    loadingProgress = 0;
    working = false;
    showEmpty = false;

    filterValue = 0;
    showFilteredEmpty = false;

    constructor(
        private db: CollectionService,
        // private modalCtrl: ModalController,
        // public popoverController: PopoverController
    ) {
        if (DatesListingComponent.singleton) {
            return DatesListingComponent.singleton;
        }
        DatesListingComponent.singleton = this;
        // db.init().subscribe(
        //   (data) => {
        //     console.log("data", data);

        db.years$.subscribe(d => {
            if (!this.years || this.years.length === 0 || !lodash.isEqual(this.years, d)) {
                this.years = d;
                this.yearsNumbers = this.years.map(y => y.year);
                if (!lodash.isEmpty(d) && (!this.selectedYear || !lodash.includes(this.yearsNumbers, this.selectedYear.year))) {
                    this.selectYear(lodash.first(this.years));
                }
            }

            this.showEmpty = this.years.length === 0;
        });

        db.insertedRecord$.subscribe(
            record => {
                if (!this.selectedYear || this.years.length === 0) {
                    this.reset();
                    return;
                }

                const rPublYear = record.getPublishYear();
                const rPublDate = record.publishDate;

                if (rPublYear === this.selectedYear.year && this.records[rPublDate]) {
                    this.records[rPublDate] = lodash.sortBy([...this.records[rPublDate], record], r => r.recordDate).reverse();
                } else if (rPublYear === this.selectedYear.year) {
                    const newDate: ICCDay = {
                        date: rPublDate,
                        records: [record.id],
                        year: moment(rPublDate).year(),
                        total: record.price
                    };
                    this.records[rPublDate] = [record];
                    this.selectedYearDates = lodash.orderBy([...this.selectedYearDates, newDate], ["date"]).reverse();

                }
                this.showFilteredMessage();
            }
        );

        db.deletedRecord$.subscribe(deleteInfo => {
            if (this.selectedYear.year === deleteInfo.recordYear) {
                this.selectedYear.total = deleteInfo.yearTotal;
                if (deleteInfo.yearDeleted) {
                    lodash.remove(this.years, y => y.year === deleteInfo.recordYear);
                    if (this.years.length > 0) {
                        this.selectYear(lodash.first(this.years));
                    } else {
                        this.selectedYear = undefined;
                        this.reset();
                    }
                    this.showEmpty = this.years.length === 0;
                } else if (deleteInfo.dayDeleted) {
                    lodash.remove(this.selectedYearDates, d => d.date === deleteInfo.recordDate);
                } else {
                    const dateChild = this.dateChildren.find(dc => dc.date.date === deleteInfo.recordDate);
                    if (dateChild) {
                        const date = this.selectedYearDates.find(d => d.date === deleteInfo.recordDate);
                        date.total = deleteInfo.dayTotal;
                        lodash.remove(date.records, record => record === deleteInfo.record.id);
                        lodash.remove(this.records[date.date], record => record.id === deleteInfo.record.id);
                        dateChild.ngOnInit();
                    }
                }

                this.showFilteredMessage();
            }
        });


        // }
        // );
        this.db.updateYears();
    }

    ngOnInit() {
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    private reset() {
        this.selectedYearDates = [];
        this.loadingProgress = 0;
    }

    private selectYear(yearData: ICCYear) {
        if (!this.isSelected(yearData.year)) {
            this.reset();
            this.selectedYear = yearData;
            this.updateYearSelected();
        }
    }

    private updateYearSelected() {
        if (this.working) {
            return;
        }

        this.working = true;
        this.showFilteredEmpty = false;
        this.loadingProgress = 0;
        this.records = {};

        // const records = {};

        this.db.getYearDates(this.selectedYear.year)
            .subscribe(days => {
                this.selectedYearDates = days;
                const dateRecordsDbQueries: Rx.Observable<null>[] = days.map(day =>
                    new Rx.Observable(observer => {
                        this.db.getDayRecords(day.date)
                            // .pipe()
                            .subscribe(
                                r => {
                                    // console.log("Date resolved > ", day.date);

                                    this.records[day.date] = r;
                                    // records[day.date] = r;
                                    this.loadingProgress = lodash.size(this.records) / days.length;
                                    // this.loadingProgress = lodash.size(records) / days.length;
                                    if (this.loadingProgress === 1) {
                                        this.working = false;
                                        this.showFilteredMessage();
                                        observer.next(null);
                                    }

                                    observer.complete();
                                },
                                err => observer.error(err)
                            );
                    })
                );
                Rx.merge(...dateRecordsDbQueries).subscribe(
                    () => {
                        // this.records = records;
                        // this.Rrecords = lodash.toArray(this.records);
                        // console.log("XXXX DATA COMPLETED", this.selectedYearDates);
                    },
                    err => console.error("Error", err)
                );
            });
    }

    private isSelected(year: number) {
        return this.selectedYear && this.selectedYear.year === year;
    }

    async openAddForm() {
        // const modal = await this.modalCtrl.create({
        //   component: AddFormComponent
        // });
        // return await modal.present();
    }

    // showFilter() {
    //     this.filterChild.open();
    //     this.filterChild.value = this.filterValue.toString();
    // }

    filterRecords($event: CustomEvent) {
        this.filterValue = parseInt($event.detail.value, 10);
        this.showFilteredMessage();
    }

    showFilteredMessage() {
        this.showFilteredEmpty = false;
        // setTimeout(
        //     () => this.showFilteredEmpty = !this.showEmpty && this.dateChildren.filter(dateRow => dateRow.displayDate).length === 0,
        //     100
        // );
    }

    tabIndexChanged(args: SelectedIndexChangedEventData) {
        // console.log("New index", args.newIndex, this.years[args.newIndex]);
        this.selectYear(this.years[args.newIndex]);
    }
}

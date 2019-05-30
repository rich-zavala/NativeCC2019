
// tslint:disable: max-line-length
import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { Page } from "tns-core-modules/ui/page/page";
import { SearchBar } from "tns-core-modules/ui/search-bar";
import * as app from "tns-core-modules/application";


import { ObservableArray } from "tns-core-modules/data/observable-array";
import { TokenModel, AutoCompleteEventData, } from "nativescript-ui-autocomplete";

// import { CollectionService } from "../services/collection.service";
// import { CCRecord } from "../../../src/models/record";
import { DATE_FORMAT } from "../../../src/constants/formats";

import { TranslateService } from "@ngx-translate/core";


// import { Component, OnInit } from "@angular/core";
// import { ModalController } from "@ionic/angular";
import { toArray } from "rxjs/operators";

import { ICCSerie, CCRecord } from "../../models";
import { CollectionService } from "../services/collection.service";
import { AddFormComponent } from "../add-form/add-form.component";

import * as Rx from "rxjs";
import * as lodash from "lodash";
import { dynCurrency } from "../tools/utils";

interface IListState {
  expanded: boolean;
  records: CCRecord[];
}

@Component({
  selector: "SeriesListing",
  templateUrl: "./series-listing.component.html",
  styleUrls: ["./series-listing.page.scss"]
})
export class SeriesListingComponent implements OnInit {
  working = true;
  series: ICCSerie[] = [];
  seriesFiltered: ICCSerie[] = [];
  states: { [key: string]: IListState } = {};

  searching = false;
  showEmpty = false;
  filterEmpty = false;
  filterValue = "";

  constructor(
    private db: CollectionService,
    private page: Page
    // private modalCtrl: ModalController
  ) {
    // db.updateSeries();
  }

  ngOnInit() {
    this.db.series$.subscribe(d => {
      this.series = d;
      this.series.forEach(serie => {
        if (!this.states[serie.name]) {
          this.states[serie.name] = { expanded: false, records: [] };
        }
      });
      this.filter();
      this.showEmpty = this.series.length === 0;
    });

    this.db.insertedRecord$.subscribe(
      record => {
        if (this.states[record.title]) {
          this.states[record.title].records = lodash.orderBy([...this.states[record.title].records, record], ["volumen"]);
        } else {
          this.db.updateSeries();
        }
      }
    );

    this.db.deletedRecord$.subscribe(deleteInfo => {
      if (deleteInfo.serieDeleted) {
        this.series = this.series.filter(s => s.name !== deleteInfo.record.title);
        this.filter();
      } else {
        lodash.remove(this.states[deleteInfo.record.title].records, r => r.id === deleteInfo.record.id);
      }

      this.showEmpty = this.series.length === 0;
    });

    this.db.updateSeries();
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }

  private filter() {
    if (this.filterValue === "") {
      this.seriesFiltered = this.series;
      this.filterEmpty = false;
    } else {
      this.seriesFiltered = this.series.filter(s => s.name.toLocaleLowerCase().includes(this.filterValue));
      this.filterEmpty = this.seriesFiltered.length === 0;
    }

    this.working = false;
  }

  private filterBar(args) {
    const searchBar = args.object;
    this.filterValue = searchBar.text.toLowerCase();
    this.filter();
  }

  private clearFilter() {
    this.filterValue = "";
    this.filter();
    this.unfocusSearch();
    this.searching = false;
  }

  private unfocusSearch() {
    if (this.searching) {
      const searchbar: SearchBar = this.page.getViewById("searchbar");
      searchbar.dismissSoftInput();
    }
  }

  private expandToggle(serie: ICCSerie) {
    if (this.states[serie.name].expanded) {
      this.states[serie.name].expanded = false;
    } else {
      if (this.states[serie.name].records.length === 0) {
        this.loadRecords(serie);
      }

      this.states[serie.name].expanded = true;
    }
  }

  private loadRecords(serie: ICCSerie) {
    Rx.merge(...serie.records.map(recordTitle => Rx.from(this.db.getRecord(recordTitle))))
      .pipe(toArray())
      .subscribe(
        d => this.states[serie.name].records = lodash.orderBy(d, ["volumen"])
      );
  }

  private dynCurrency(total: string) {
    return dynCurrency(parseFloat(total));
  }

  async openAddForm() {
    // const modal = await this.modalCtrl.create({
    //   component: AddFormComponent
    // });
    // return await modal.present();
  }

  // Rows contructors
  get filteredRows() {
    return this.seriesFiltered.map(s => "auto").join(" ");
  }
}

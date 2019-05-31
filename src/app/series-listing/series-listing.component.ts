import { Component, OnInit } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { Page } from "tns-core-modules/ui/page/page";
import { SearchBar } from "tns-core-modules/ui/search-bar";
import * as app from "tns-core-modules/application";

import { toArray } from "rxjs/operators";

import { ICCSerie, CCRecord } from "../../models";
import { CollectionService } from "../services/collection.service";

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
    private page: Page,
    private routerExtensions: RouterExtensions
  ) { }

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
        const addRecordToState = () =>
          this.states[record.title].records = lodash.orderBy([...this.states[record.title].records, record], ["volumen"]);

        if (this.states[record.title]) {
          addRecordToState();
        } else {
          this.db.updateSeries()
            .add(() => addRecordToState());
        }
      }
    );

    this.db.deletedRecord$.subscribe(deleteInfo => {
      lodash.remove(this.states[deleteInfo.record.title].records, r => r.id === deleteInfo.record.id);

      if (deleteInfo.serieDeleted) {
        this.series = this.series.filter(s => s.name !== deleteInfo.record.title);
        this.filter();
      }

      this.showEmpty = this.series.length === 0;
      this.db.updateSeries();
    });

    this.db.updateSeries();
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }

  private toggleFilter() {
    if (this.searching) {
      this.clearFilter();
    } else {
      this.searching = !this.searching;
    }
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

  private openAddForm() {
    this.routerExtensions.navigate(["addForm"]);
  }

  // Rows contructors
  // TODO: THIS MUST BE OPTIMIZED!!!
  get filteredRows() {
    return [...this.seriesFiltered, null].map(s => "auto").join(" ");
  }
}

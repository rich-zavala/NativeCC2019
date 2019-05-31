// tslint:disable: no-unused-expression
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
  private static singleton: SeriesListingComponent;

  series: ICCSerie[] = [];
  seriesFiltered: ICCSerie[] = [];
  states: { [key: string]: IListState } = {};

  searching = false;
  showEmpty = false;

  filterValue = "";
  filteredRows = "";
  filteredKeys: string;

  constructor(
    private db: CollectionService,
    private page: Page,
    private routerExtensions: RouterExtensions
  ) {
    if (SeriesListingComponent.singleton) {
      return SeriesListingComponent.singleton;
    }
    SeriesListingComponent.singleton = this;
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
        // this.filter();
        this.db.updateSeries();
      }

      this.showEmpty = this.series.length === 0;
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
    let seriesFiltered: ICCSerie[];

    const getFilteredKeys = (): string => seriesFiltered.map(s => s.name).join();

    const setFilterValues = (filteredKeys: string) => {
      this.filteredKeys = filteredKeys;
      this.seriesFiltered = seriesFiltered;
      this.filteredRows = "auto ".repeat(seriesFiltered.length + 1);
      console.log("Filtered!");
    };

    if (this.filterValue === "") {
      seriesFiltered = this.series;
    } else {
      seriesFiltered = this.series.filter(s => s.name.toLocaleLowerCase().includes(this.filterValue));
    }

    if (!this.filteredKeys) {
      setFilterValues(getFilteredKeys());
    } else {
      const filteredKeys = getFilteredKeys();
      if (filteredKeys !== this.filteredKeys) {
        setFilterValues(filteredKeys);
      } else {
        console.log(">>>> No need to update");
      }
    }
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
      searchbar && searchbar.dismissSoftInput();
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
}

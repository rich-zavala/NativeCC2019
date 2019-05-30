import { Component, Input } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";

import { CollectionService } from "../services/collection.service";
import { RecordHandlerComponent } from "../common/record-handler.component";

@Component({
  selector: "app-record-row",
  templateUrl: "./record-row.component.html",
  styleUrls: ["./record-row.component.scss"]
})
export class RecordRowComponent extends RecordHandlerComponent {
  @Input() odd: any;
  updatingCheckFromDetails = false;

  constructor(
    public db: CollectionService,
    private routerExtensions: RouterExtensions
  ) {
    super(db);

    db.updatedRecord$.subscribe(
      updatedRecord => {
        if (updatedRecord.id === this.cc.id) {
          this.cc = updatedRecord;
          this.checkState.checked = this.cc.checked;
          if (this.checkbox.nativeElement) {
            this.checkbox.nativeElement.toggle();
          }
        }
      }
    );
  }

  showDetails() {
    this.db.selectedRecord = this.cc;
    this.routerExtensions.navigate(["recordDetail"]);
  }
}

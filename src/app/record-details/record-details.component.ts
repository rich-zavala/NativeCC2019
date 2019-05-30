import { Component } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";

import { TranslateService } from "@ngx-translate/core";

import { RecordHandlerComponent } from "../common/record-handler.component";
import { CollectionService } from "../services/collection.service";

import * as dialogs from "tns-core-modules/ui/dialogs";
import * as Rx from "rxjs";

@Component({
  selector: "app-record-details",
  templateUrl: "./record-details.component.html",
  styleUrls: ["./record-details.component.scss"]
})
export class RecordDetailsComponent extends RecordHandlerComponent {
  public emmitUpdates = true;
  private dialogStr;

  constructor(
    public db: CollectionService,
    private router: RouterExtensions,
    translate: TranslateService
  ) {
    super(db);

    translate.get("details.dialog").subscribe(val => this.dialogStr = val);
    this.cc = this.db.selectedRecord;
  }

  close() {
    this.db.selectedRecord = undefined;
    this.router.back();
  }

  delete() {
    const title = this.dialogStr.header;
    const message = this.dialogStr.subHeader;
    const okButtonText = this.dialogStr.btns[0];
    const cancelButtonText = this.dialogStr.btns[1];

    Rx.from(dialogs.confirm({
      title,
      message,
      okButtonText,
      cancelButtonText
    })).subscribe(result => {
      if (result) {
        this.db.deleteRecord(this.cc)
          .add(() => this.close());
      }
    });
  }
}

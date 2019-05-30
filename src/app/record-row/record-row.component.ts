import { Component, Input } from "@angular/core";
// import { ModalController } from "@ionic/angular";

import { RecordHandlerComponent } from "./record-handler.component";
// import { RecordDetailsComponent } from "./record-details/record-details.component";
import { CollectionService } from "../services/collection.service";

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
    // private modalController: ModalController
  ) {
    super(db);

    db.updatedRecord$.subscribe(
      updatedRecord => {
        if (updatedRecord.id === this.cc.id) {
          this.updatingCheckFromDetails = true;
          setTimeout(() => { // To avoid double reaction
            this.cc = updatedRecord;
            this.checkState.checked = this.cc.checked;
            this.updatingCheckFromDetails = false;
          });
        }
      }
    );
  }

  async showDetails($event) {
    // if (!["i", "path", "svg", "input", "label"].includes($event.target.localName)) {
    //   const modal = await this.modalController.create({
    //     component: RecordDetailsComponent,
    //     componentProps: { cc: this.cc }
    //   });
    //   return await modal.present();
    // }
  }
}

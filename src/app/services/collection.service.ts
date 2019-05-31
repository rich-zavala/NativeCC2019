import { Injectable } from "@angular/core";

import { DbHandlingService } from "./db-handling.service";

import { ICCYear, CCRecord, ICCSerie } from "../../../src/models";
import { IDeleteRecordResponse, IInsertRecordResponse, ICCDBHandler } from "../../../src/dbHandlers/dbHandler";

import * as dialogs from "tns-core-modules/ui/dialogs";
import * as Rx from "rxjs";

@Injectable({
    providedIn: "root"
})
export class CollectionService {
    db: ICCDBHandler;

    years$: Rx.Subject<ICCYear[]> = new Rx.Subject();
    series$: Rx.Subject<ICCSerie[]> = new Rx.Subject();
    insertedRecord$: Rx.Subject<CCRecord> = new Rx.Subject();
    updatedRecord$: Rx.Subject<CCRecord> = new Rx.Subject();
    deletedRecord$: Rx.Subject<IDeleteRecordResponse> = new Rx.Subject();

    selectedRecord: CCRecord;

    constructor(private dbService: DbHandlingService) {
        this.db = dbService.db;
    }

    updateYears() {
        this.db.getYears().subscribe(d => this.years$.next(d));
    }

    getDayRecords(day: string) {
        return this.db.getRecordsByDay(day);
    }

    getYearDates(year: number) {
        return this.db.getYearDays(year);
    }

    updateSeries() {
        return this.db.getSeries().subscribe(d => this.series$.next(d));
    }

    getRecord(id: string) {
        return this.db.getRecord(id);
    }

    insert(cc: CCRecord): Rx.Observable<IInsertRecordResponse> {
        return new Rx.Observable(observer => {
            this.db.insert(cc).subscribe(
                insertResult => {
                    if (!insertResult.duplicate) {
                        this.updateYears();
                        this.updateSeries();
                        this.insertedRecord$.next(new CCRecord(insertResult.record));
                    }
                    observer.next(insertResult);
                    observer.complete();
                }
            );
        });
    }

    uncheck(cc: CCRecord, emmit: boolean): Rx.Observable<boolean> {
        return new Rx.Observable(observer => {
            const resolve = (value: boolean) => {
                observer.next(value);
                observer.complete();
            };

            const title = "Are you sure?";
            const message = "Please confirm this action";
            const okButtonText = "Uncheck it";
            const cancelButtonText = "Keep it";

            const uncheck = () => {
                cc.uncheck();
                this.updateRecord(cc, emmit)
                    .add(() => resolve(true));
            };
            const revert = () => resolve(false);

            Rx.from(dialogs.confirm({
                title,
                message,
                okButtonText,
                cancelButtonText
            })).subscribe(result => {
                if (result) {
                    uncheck();
                } else {
                    revert();
                }
            });
        });
    }

    updateRecord(cc: CCRecord, emmit: boolean) {
        return this.db.update(cc)
            .subscribe(() => {
                if (emmit) {
                    this.updatedRecord$.next(cc);
                }
            });
    }

    deleteRecord(cc: CCRecord) {
        return this.db.delete(cc)
            .subscribe(
                data => {
                    if (data.yearDeleted) {
                        this.updateYears();
                    }
                    this.deletedRecord$.next(data);
                }
            );
    }

    clear(): Rx.Observable<boolean> {
        return this.db.clear();
    }
}

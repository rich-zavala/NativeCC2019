import { ICCDBHandler, IInsertRecordResponse, IDeleteRecordResponse } from "./dbHandler";
import { ICCRecord, CCRecord, ICCDay, ICCYear, ICCSerie } from "src/models";

import * as Rx from "rxjs";
import { finalize, toArray } from "rxjs/operators";
import * as lodash from "lodash";
import * as moment from "moment";
import Dexie from "dexie";

export class DexieHandler implements ICCDBHandler {
    private dexie: Dexie;
    dbYears: Dexie.Table<ICCYear, string>;
    dbDays: Dexie.Table<ICCDay, string>;
    dbRecords: Dexie.Table<ICCRecord, string>;
    dbSeries: Dexie.Table<ICCSerie, string>;

    constructor() {
        this.dexie = new Dexie("ContaComics");
        this.dexie.version(1).stores({
            records: "id,title,publishDate",
            series: "name",
            days: "date, year",
            years: "year"
        });

        this.dbRecords = (this.dexie as any).records;
        this.dbSeries = (this.dexie as any).series;
        this.dbDays = (this.dexie as any).days;
        this.dbYears = (this.dexie as any).years;
    }

    insert(cc: ICCRecord): Rx.Observable<IInsertRecordResponse> {
        const resp: IInsertRecordResponse = { duplicate: false, record: null };
        const ccInst = new CCRecord(cc);
        return new Rx.Observable(observer => {
            this.insertRecord(ccInst)
                .pipe(
                    finalize(() => {
                        observer.next(resp);
                        observer.complete();
                    })
                )
                .subscribe(
                    () => resp.record = ccInst,
                    dbData => {
                        resp.duplicate = true;
                        resp.record = new CCRecord(dbData);
                    }
                );
        });
    }

    private insertRecord(cc: CCRecord): Rx.Observable<CCRecord> {
        return new Rx.Observable(observer => {
            Rx.from(this.dbRecords.get(cc.id))
                .subscribe(
                    record => {
                        if (record) { // Already in!
                            observer.error(record);
                            observer.complete();
                        } else {
                            Rx.from(this.dbRecords.put(cc.insertable()))
                                .subscribe(
                                    () => {
                                        const dataHandlers = [
                                            this.insertYear(cc),
                                            this.insertDay(cc),
                                            this.insertSerie(cc)
                                        ];
                                        Rx.merge(...dataHandlers)
                                            .pipe(
                                                finalize(() => {
                                                    observer.next(cc);
                                                    observer.complete();
                                                })
                                            )
                                            .subscribe();
                                    }
                                );
                        }
                    }
                );
        });
    }

    private insertSerie(cc: CCRecord): Rx.Observable<ICCSerie> {
        return new Rx.Observable(observer => {
            Rx.from(this.dbSeries.get(cc.title)).subscribe(
                serieData => {
                    if (serieData) {
                        serieData.records.push(cc.id);
                        serieData.records = lodash.uniq(serieData.records);
                        serieData.total += cc.price;
                    } else {
                        serieData = {
                            name: cc.title,
                            records: [cc.id],
                            total: cc.price
                        };
                    }

                    Rx.from(this.dbSeries.put(serieData)).subscribe(() => {
                        observer.next(serieData);
                        observer.complete();
                    });
                }
            );
        });
    }

    private insertDay(cc: CCRecord): Rx.Observable<ICCDay> {
        return new Rx.Observable(observer => {
            const day = cc.publishDate;
            this.getDay(day).subscribe(dayData => {
                if (dayData) {
                    dayData.records.push(cc.id);
                    dayData.records = lodash.uniq(dayData.records);
                    dayData.total += cc.price;
                } else {
                    dayData = {
                        date: day,
                        year: moment(day).year(),
                        records: [cc.id],
                        total: cc.price
                    };
                }

                // dayData.records = lodash.orderBy(dayData.records.map(r => r.insertable()), ["recordDate"]).reverse();
                Rx.from(this.dbDays.put(dayData)).subscribe(() => {
                    observer.next(dayData);
                    observer.complete();
                });
            });
        });
    }

    getDay(day: string): Rx.Observable<ICCDay> {
        return Rx.from(this.dbDays.get(day));
    }

    private insertYear(cc: CCRecord): Rx.Observable<ICCYear> {
        const year = cc.getPublishYear();
        const day = cc.publishDate;
        return new Rx.Observable(observer => {
            this.getYear(year).subscribe(
                yearData => {
                    if (yearData) {
                        yearData.days.push(day);
                        yearData.days = lodash.uniq(yearData.days);
                        yearData.total += cc.price;
                    } else {
                        yearData = {
                            year,
                            days: [day],
                            total: cc.price
                        };
                    }
                    Rx.from(this.dbYears.put(yearData)).subscribe(() => {
                        observer.next(yearData);
                        observer.complete();
                    });
                }
            );
        });
    }

    private getYear(year: number): Rx.Observable<ICCYear> {
        return new Rx.Observable(observer => {
            Rx.from(this.dbYears.get(year as any)).subscribe(yearData => {
                observer.next(yearData);
                observer.complete();
            });
        });
    }

    update(data: CCRecord): Rx.Observable<CCRecord> {
        const recordData = data.insertable();
        return new Rx.Observable(observer => {
            this.getDay(data.publishDate).subscribe(
                dayData => {
                    Rx.from(this.dbRecords.update(recordData.id, recordData)).subscribe(() => {
                        observer.next(data);
                        observer.complete();
                    });
                });
        });
    }

    delete(cc: CCRecord): Rx.Observable<IDeleteRecordResponse> {
        const resp: IDeleteRecordResponse = {
            record: cc.insertable(),
            recordDeleted: false,
            dayDeleted: false,
            yearDeleted: false,
            serieDeleted: false,
            dayTotal: 0,
            yearTotal: 0,
            serieTotal: 0,
            recordYear: cc.getPublishYear(),
            recordDate: cc.publishDate
        };

        const sequentialUpdates: Rx.Observable<any>[] = [];
        return new Rx.Observable(observer => {
            Rx.from(this.dbRecords.delete(cc.id)).subscribe(() => {
                resp.recordDeleted = true;
                const subjSerie = new Rx.Observable(obsSerie => {
                    Rx.from(this.dbSeries.get(cc.title)).subscribe(serieData => {
                        serieData.records.splice(serieData.records.indexOf(cc.id), 1);
                        if (serieData.records.length > 0) {
                            serieData.total -= cc.price;
                            resp.serieTotal = serieData.total;
                            sequentialUpdates.push(Rx.from(this.dbSeries.put(serieData)));
                        } else {
                            resp.serieDeleted = true;
                            sequentialUpdates.push(Rx.from(this.dbSeries.delete(serieData.name)));
                        }
                        obsSerie.next(null);
                        obsSerie.complete();
                    });
                });

                const subjDates = new Rx.Observable(obsDates => {
                    const dayStr = cc.publishDate;
                    Rx.from(this.dbDays.get(dayStr)).subscribe(dayData => {
                        dayData.records.splice(dayData.records.findIndex(rId => rId === cc.id), 1);
                        if (dayData.records.length > 0) {
                            dayData.total -= cc.price;
                            resp.dayTotal = dayData.total;
                            sequentialUpdates.push(Rx.from(this.dbDays.put(dayData)));
                        } else {
                            resp.dayDeleted = true;
                            sequentialUpdates.push(Rx.from(this.dbDays.delete(dayStr)));

                            const year = cc.getPublishYear();
                            Rx.from(this.dbYears.get(year as any)).subscribe(yearData => {
                                yearData.days.splice(yearData.days.indexOf(dayStr), 1);
                                if (yearData.days.length > 0) {
                                    yearData.total -= cc.price;
                                    resp.yearTotal = yearData.total;
                                    sequentialUpdates.push(Rx.from(this.dbYears.put(yearData)));
                                } else {
                                    resp.yearDeleted = true;
                                    sequentialUpdates.push(Rx.from(this.dbYears.delete(year as any)));
                                }
                            });
                        }
                    });
                    obsDates.next(null);
                    obsDates.complete();
                });

                Rx.merge(subjSerie, subjDates)
                    .pipe(
                        toArray(),
                        finalize(() => {
                            Rx.merge(...sequentialUpdates)
                                .subscribe(
                                    () => {
                                        observer.next(resp);
                                        observer.complete();
                                    }
                                );
                        }))
                    .subscribe();
            });
        });
    }

    getYears(): Rx.Observable<ICCYear[]> {
        return Rx.from(this.dbYears.toCollection().reverse().toArray());
    }

    getYearDays(year: number): Rx.Observable<ICCDay[]> {
        return Rx.from(this.dbDays.where({ year }).reverse().toArray());
    }

    getSeries(): Rx.Observable<ICCSerie[]> {
        return Rx.from(this.dbSeries.toArray());
    }

    getRecord(id: string): Rx.Observable<CCRecord> {
        return new Rx.Observable(observer => {
            Rx.from(this.dbRecords.get(id)).subscribe(recordData => {
                if (recordData) {
                    observer.next(new CCRecord(recordData));
                } else {
                    observer.error();
                }
                observer.complete();
            });
        });
    }

    getRecordsByDay(day: string): Rx.Observable<CCRecord[]> {
        return new Rx.Observable(observer => {
            Rx.from(this.dbRecords.where({ publishDate: day }).toArray()).subscribe(records => {
                const recordInstances = lodash.sortBy(records.map(r => new CCRecord(r)), r => r.recordDate).reverse();
                observer.next(recordInstances);
                observer.complete();
            });
        });
    }

    clear(): Rx.Observable<boolean> {
        return new Rx.Observable(observer => {
            Rx.merge(
                this.dbDays.clear(),
                this.dbRecords.clear(),
                this.dbYears.clear(),
                this.dbSeries.clear()
            )
                .pipe(toArray())
                .subscribe(
                    () => observer.next(true),
                    () => observer.error()
                );
        });
    }

    // countRecords(): Rx.Observable<number> {
    //     return Rx.from(this.dbRecords.count());
    // }

    // countYears(): Rx.Observable<number> {
    //     return Rx.from(this.dbYears.count());
    // }

    // countDays(): Rx.Observable<number> {
    //     return Rx.from(this.dbDays.count());
    // }

    // countSeries(): Rx.Observable<number> {
    //     return Rx.from(this.dbSeries.count());
    // }
}

// tslint:disable: max-line-length
import { ICCDBHandler, IInsertRecordResponse, IDeleteRecordResponse } from "./dbHandler";
import { ICCRecord, CCRecord, ICCDay, ICCYear, ICCSerie } from "../../src/models";

import * as lodash from "lodash";
import * as moment from "moment";

import * as Rx from "rxjs";
import { finalize, toArray, map } from "rxjs/operators";

const Sqlite = require("nativescript-sqlite");
let DBInstance;

const dbName = "ccdatabase.sqlite";
if (!Sqlite.exists(dbName)) {
    Sqlite.copyDatabase(dbName);
    console.log("No exists so Copy");
}

Rx.from(new Sqlite(dbName)).subscribe(
    db => {
        DBInstance = db;
        DBInstance.resultType(Sqlite.RESULTSASOBJECT);
    },
    error => console.log("OPEN DB ERROR", error)
);

export class SQLiteHandler implements ICCDBHandler {
    private db: any;

    constructor() {
        this.db = DBInstance;
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
            this.getRecord(cc.id).subscribe(
                record => {
                    if (record) { // Already in!
                        observer.error(record);
                        observer.complete();
                    } else {
                        Rx.from(this.db.execSQL(`INSERT INTO records (id, publishDate, value) VALUES (?, ?, ?)`, [cc.id, cc.publishDate, JSON.stringify(cc.insertable())]))
                            .subscribe(
                                () => {
                                    const dataHandlers = [
                                        this.insertSerie(cc),
                                        this.insertDay(cc),
                                        this.insertYear(cc),
                                    ];
                                    Rx.merge(...dataHandlers)
                                        .pipe(
                                            finalize(() => {
                                                observer.next(cc);
                                                observer.complete();
                                            })
                                        )
                                        .subscribe();
                                },
                                err => console.warn(err)
                            );
                    }
                }
            );
        });
    }

    private insertSerie(cc: CCRecord): Rx.Observable<ICCSerie> {
        return new Rx.Observable(observer => {
            Rx.from(this.db.get(`SELECT value FROM series WHERE name=?`, [cc.title]))
                .subscribe(
                    (serieDbData: any) => {
                        let serieData: ICCSerie;
                        let returnObs: Rx.Observable<any>;

                        if (serieDbData) {
                            serieData = JSON.parse(serieDbData.value);
                            serieData.records.push(cc.id);
                            serieData.records = lodash.uniq(serieData.records);
                            serieData.total += cc.price;

                            returnObs = Rx.from(this.db.execSQL(`UPDATE series SET value=? WHERE name=?`, [JSON.stringify(serieData), serieData.name]));
                        } else {
                            serieData = {
                                name: cc.title,
                                records: [cc.id],
                                total: cc.price
                            };

                            returnObs = Rx.from(this.db.execSQL(`INSERT INTO series (name, value) VALUES (?, ?)`, [serieData.name, JSON.stringify(serieData)]));
                        }

                        returnObs.subscribe(() => {
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
                let returnObs: Rx.Observable<any>;
                if (dayData) {
                    dayData.records.push(cc.id);
                    dayData.records = lodash.uniq(dayData.records);
                    dayData.total += cc.price;

                    returnObs = Rx.from(this.db.execSQL(`UPDATE days SET value=? WHERE date=?`, [JSON.stringify(dayData), dayData.date]));
                } else {
                    dayData = {
                        date: day,
                        year: moment(day).year(),
                        records: [cc.id],
                        total: cc.price
                    };

                    returnObs = Rx.from(this.db.execSQL(`INSERT INTO days (date, year, value) VALUES (?, ?, ?)`, [dayData.date, dayData.year, JSON.stringify(dayData)]));
                }

                returnObs.subscribe(() => {
                    observer.next(dayData);
                    observer.complete();
                });
            });
        });
    }

    private insertYear(cc: CCRecord): Rx.Observable<ICCYear> {
        const year = cc.getPublishYear();
        const day = cc.publishDate;
        return new Rx.Observable(observer => {
            this.getYear(year).subscribe(
                yearData => {
                    let returnObs: Rx.Observable<any>;
                    if (yearData) {
                        yearData.days.push(day);
                        yearData.days = lodash.uniq(yearData.days).sort().reverse();
                        yearData.total += cc.price;
                        returnObs = Rx.from(this.db.execSQL(`UPDATE years SET value=? WHERE year=?`, [JSON.stringify(yearData), yearData.year]));
                    } else {
                        yearData = {
                            year,
                            days: [day],
                            total: cc.price
                        };

                        returnObs = Rx.from(this.db.execSQL(`INSERT INTO years (year, value) VALUES (?, ?)`, [yearData.year, JSON.stringify(yearData)]));
                    }

                    returnObs.subscribe(() => {
                        observer.next(yearData);
                        observer.complete();
                    });
                }
            );
        });
    }

    private getYear(year: number): Rx.Observable<ICCYear> {
        return new Rx.Observable(observer =>
            Rx.from(this.db.get(`SELECT value FROM years WHERE year=?`, [year]))
                .subscribe(
                    (yearDbData: any) => {
                        if (yearDbData) {
                            observer.next(JSON.parse(yearDbData.value));
                        } else {
                            observer.next(null);
                        }
                        observer.complete();
                    }
                )
        );
    }

    update(data: CCRecord): Rx.Observable<CCRecord> {
        const recordData = JSON.stringify(data.insertable());
        return new Rx.Observable(observer =>
            Rx.from(this.db.execSQL(`UPDATE records SET value=? WHERE id=?`, [recordData, data.id]))
                .subscribe(() => {
                    observer.next(data);
                    observer.complete();
                }));
    }

    getRecord(id: string): Rx.Observable<CCRecord> {
        return new Rx.Observable(observer =>
            Rx.from(this.db.get(`SELECT value FROM records WHERE id=?`, [id]))
                .subscribe(
                    (recordData: any) => {
                        if (recordData) {
                            observer.next(new CCRecord(JSON.parse(recordData.value)));
                        } else {
                            observer.next(null);
                        }
                        observer.complete();
                    }
                )
        );
    }

    getDay(day: string): Rx.Observable<ICCDay> {
        return new Rx.Observable(observer =>
            Rx.from(this.db.get(`SELECT value FROM days WHERE date=?`, [day]))
                .subscribe(
                    (dayDbData: any) => {
                        if (dayDbData) {
                            observer.next(JSON.parse(dayDbData.value));
                        } else {
                            observer.next(null);
                        }
                        observer.complete();
                    }
                )
        );
    }

    getYears(): Rx.Observable<ICCYear[]> {
        return new Rx.Observable(observer =>
            Rx.from(this.db.all("SELECT value FROM years ORDER BY year DESC"))
                .subscribe(
                    (yearsDbData: any[]) => {
                        if (yearsDbData) {
                            const yearsData = yearsDbData.map(ydb => JSON.parse(ydb.value));
                            observer.next(yearsData);
                        } else {
                            observer.next([]);
                        }
                        observer.complete();
                    }
                )
        );
    }

    getYearDays(year: number): Rx.Observable<ICCDay[]> {
        return Rx.from(this.db.all("SELECT value FROM days WHERE year=? ORDER BY date DESC", [year]))
            .pipe(map((data: any[]) => data.map(d => JSON.parse(d.value))));
    }

    getSeries(): Rx.Observable<ICCSerie[]> {
        return new Rx.Observable(observer =>
            Rx.from(this.db.all("SELECT value FROM series ORDER BY name"))
                .subscribe(
                    (seriesDbData: any[]) => {
                        if (seriesDbData) {
                            const seriesData = seriesDbData.map(sdb => JSON.parse(sdb.value));
                            observer.next(seriesData);
                        } else {
                            observer.next([]);
                        }
                        observer.complete();
                    }
                )
        );
    }

    getRecordsByDay(day: string): Rx.Observable<CCRecord[]> {
        return Rx.from(this.db.all("SELECT value FROM records WHERE publishDate=?", [day]))
            .pipe(map((data: any[]) => data.map(d => new CCRecord(JSON.parse(d.value)))));
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
            Rx.from(this.db.execSQL(`DELETE FROM records WHERE id=?`, [cc.id]))
                .subscribe(() => {
                    resp.recordDeleted = true;
                    const subjSerie = new Rx.Observable(obsSerie => {
                        Rx.from(this.db.get(`SELECT value FROM series WHERE name=?`, [cc.title]))
                            .pipe(map((d: any) => JSON.parse(d.value)))
                            .subscribe(serieData => {
                                serieData.records.splice(serieData.records.indexOf(cc.id), 1);
                                if (serieData.records.length > 0) {
                                    serieData.total -= cc.price;
                                    resp.serieTotal = serieData.total;
                                    sequentialUpdates.push(Rx.from(this.db.execSQL(`UPDATE series SET value=? WHERE name=?`, [JSON.stringify(serieData), cc.title])));
                                } else {
                                    resp.serieDeleted = true;
                                    sequentialUpdates.push(Rx.from(this.db.execSQL(`DELETE FROM series WHERE name=?`, [cc.title])));
                                }
                                obsSerie.next(null);
                                obsSerie.complete();
                            });
                    });

                    const subjDates = new Rx.Observable(obsDates => {
                        const dayStr = cc.publishDate;
                        Rx.from(this.db.get(`SELECT value FROM days WHERE date=?`, [dayStr]))
                            .pipe(map((d: any) => JSON.parse(d.value)))
                            .subscribe(dayData => {
                                dayData.records.splice(dayData.records.findIndex(rId => rId === cc.id), 1);
                                if (dayData.records.length > 0) {
                                    dayData.total -= cc.price;
                                    resp.dayTotal = dayData.total;
                                    sequentialUpdates.push(Rx.from(this.db.execSQL(`UPDATE days SET value=? WHERE date=?`, [JSON.stringify(dayData), dayStr])));
                                } else {
                                    resp.dayDeleted = true;
                                    sequentialUpdates.push(Rx.from(this.db.execSQL(`DELETE FROM days WHERE date=?`, [dayStr])));

                                    const year = cc.getPublishYear();
                                    Rx.from(this.db.get(`SELECT value FROM years WHERE year=?`, [year]))
                                        .pipe(map((d: any) => JSON.parse(d.value)))
                                        .subscribe(yearData => {
                                            yearData.days.splice(yearData.days.indexOf(dayStr), 1);
                                            if (yearData.days.length > 0) {
                                                yearData.total -= cc.price;
                                                resp.yearTotal = yearData.total;
                                                sequentialUpdates.push(Rx.from(this.db.execSQL(`UPDATE years SET value=? WHERE year=?`, [JSON.stringify(yearData), year])));
                                            } else {
                                                resp.yearDeleted = true;
                                                sequentialUpdates.push(Rx.from(this.db.execSQL(`DELETE FROM years WHERE year=?`, [year])));
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

    clear(): Rx.Observable<boolean> {
        return new Rx.Observable(observer => {
            Rx.merge(
                Rx.from(this.db.execSQL("DELETE FROM days")),
                Rx.from(this.db.execSQL("DELETE FROM records")),
                Rx.from(this.db.execSQL("DELETE FROM series")),
                Rx.from(this.db.execSQL("DELETE FROM years"))
            )
                .pipe(toArray())
                .subscribe(
                    () => observer.next(true),
                    () => observer.error()
                );
        });
    }
}

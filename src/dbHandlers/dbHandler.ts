import { Observable } from "rxjs";
import { ICCRecord, CCRecord, ICCDay, ICCYear, ICCSerie } from "../models";

export interface IInsertRecordResponse {
    duplicate: boolean;
    record: CCRecord;
}

export interface IDeleteRecordResponse {
    record: ICCRecord;
    recordDeleted: boolean;
    dayDeleted: boolean;
    yearDeleted: boolean;
    serieDeleted: boolean;
    dayTotal: number;
    yearTotal: number;
    serieTotal: number;
    recordYear: number;
    recordDate: string;
}
export interface ICCDBHandler {
    insert(data: ICCRecord): Observable<IInsertRecordResponse>;
    update(data: CCRecord): Observable<CCRecord>;
    delete(data: ICCRecord): Observable<IDeleteRecordResponse>;
    getYears(): Observable<ICCYear[]>;
    getYearDays(year: number): Observable<ICCDay[]>;
    getDay(day: string): Observable<ICCDay>;
    getSeries(): Observable<ICCSerie[]>;
    getRecord(id: string): Observable<CCRecord>;
    getRecordsByDay(day: string): Observable<CCRecord[]>;
    clear(): Observable<boolean>;
}

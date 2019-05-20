import * as moment from "moment";
import { DATE_FORMAT_READ, DATE_FORMAT_READ_TIME } from "src/constants/formats";
import { dynCurrency } from "src/app/tools/utils";

export interface ICCRecord {
    id?: string;
    title: string;
    volumen: number;
    price: number;
    variant?: string;
    checked?: boolean;
    publishDate: string;
    checkedDate?: number;
    recordDate?: number;
}

export class CCRecord implements ICCRecord {
    id: string;
    title: string;
    volumen: number;
    price: number;
    variant: string;
    checked: boolean;
    publishDate: string;
    checkedDate: number;
    recordDate: number;

    private publishDateMoment: moment.Moment;

    constructor(data: ICCRecord) {
        this.title = data.title;
        this.volumen = data.volumen;
        this.price = data.price;
        this.variant = data.variant;
        this.checked = data.checked || false;
        this.publishDate = data.publishDate;
        this.checkedDate = data.checkedDate;
        this.recordDate = data.recordDate || Date.now();

        this.id = [data.title, data.volumen, data.variant]
            .filter(d => d)
            .join("_")
            .replace(/[^a-zA-Z0-9]/g, "");

        this.publishDateMoment = moment(this.publishDate);
    }

    public check() {
        if (!this.checked) {
            this.checked = true;
            this.checkedDate = Date.now();
        }
    }

    public uncheck() {
        this.checked = false;
        this.checkedDate = undefined;
    }

    public getPublishYear() {
        return this.publishDateMoment.year();
    }

    public insertable() {
        return JSON.parse(JSON.stringify(this));
    }

    public priceCurrency() {
        return dynCurrency(this.price);
    }

    get detailDates() {
        return {
            published: this.publishDateMoment.format(DATE_FORMAT_READ),
            registry: moment(this.recordDate).format(DATE_FORMAT_READ_TIME),
            checked: moment(this.checkedDate).format(DATE_FORMAT_READ_TIME),
        };
    }
}

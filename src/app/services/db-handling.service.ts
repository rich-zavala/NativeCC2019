import { Injectable } from "@angular/core";
import { ICCDBHandler } from "../../../src/dbHandlers/dbHandler";
import { SQLiteHandler } from "../../../src/dbHandlers/sqlite";

@Injectable({
  providedIn: "root"
})
export class DbHandlingService {
  db: ICCDBHandler = new SQLiteHandler();
}

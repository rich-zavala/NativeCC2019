import { Injectable } from "@angular/core";
import { ICCDBHandler } from "src/dbHandlers/dbHandler";
import { DexieHandler } from "src/dbHandlers/dexieHandler";

@Injectable({
  providedIn: "root"
})
export class DbHandlingService {
  db: ICCDBHandler = new DexieHandler();
}

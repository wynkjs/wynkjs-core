import type { WynkPipe, PipeTransform } from "wynkjs";
import { Injectable } from "wynkjs";

@Injectable()
export class DemoTransformPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === "string") {
      return value.trim().toLowerCase().replace(/\s+/g, "-");
    }
    return value;
  }
}

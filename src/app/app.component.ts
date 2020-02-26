import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  min;
  max;

  valuesChanged(data) {
    this.min = data.min;
    this.max = data.max;
  }
}

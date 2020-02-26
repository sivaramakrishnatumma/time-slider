import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  SimpleChanges,
  SimpleChange
} from "@angular/core";
import { timer } from "rxjs";

@Component({
  selector: "app-time-slider",
  templateUrl: "./time-slider.component.html",
  styleUrls: ["./time-slider.component.scss"],
  providers: [{ provide: Window, useValue: window }]
})
export class TimeSliderComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  public labels: { time: number; left: string }[] = [];
  public minHandler: { percentage: number; time: number } = {
    percentage: 0,
    time: 0
  };
  public maxHandler: { percentage: number; time: number } = {
    percentage: 100,
    time: 0
  };
  public containerWidthInPixels: number;

  public initialMinTime;
  public initialMaxTime;
  public view;
  public refresh;

  @Input() selectedTimeView: string;
  @Output() sliderChange = new EventEmitter();

  @ViewChild("minSlider", { static: false }) minHandleEl: ElementRef;
  @ViewChild("maxSlider", { static: false }) maxHandleEl: ElementRef;
  @ViewChild("sliderContainer", { static: false }) sliderContainer: ElementRef;

  constructor(private window: Window, private cdref: ChangeDetectorRef) {}

  ngOnInit() {
    this.refresh = timer(1000, 60000).subscribe(() => {
      if (
        this.initialMinTime === this.minHandler.time &&
        this.initialMaxTime === this.maxHandler.time
      ) {
        const currentTime = new Date().setSeconds(0, 0);
        if (this.initialMaxTime !== currentTime) {
          this.setTimes();
          this.createLabels();
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    const selectedTimeView: SimpleChange = changes.selectedTimeView;
    if (!selectedTimeView.firstChange) {
      this.minHandler = {
        percentage: 0,
        time: 0
      };
      this.maxHandler = {
        percentage: 100,
        time: 0
      };
      this.placeHandles();
    }
    if (selectedTimeView && selectedTimeView.currentValue) {
      this.view = selectedTimeView.currentValue === "Last 1 Day" ? "1d" : "7d";
      this.setTimes();
      this.createLabels();
    }
  }

  ngAfterViewInit() {
    this.placeHandles();
    this.cdref.detectChanges();
  }

  public ngOnDestroy() {
    this.refresh.unsubscribe();
  }

  public setTimes() {
    const currentDate: Date = new Date();
    currentDate.setSeconds(0, 0);
    this.initialMaxTime = currentDate.getTime();

    this.initialMinTime =
      this.view === "1d"
        ? currentDate.setDate(currentDate.getDate() - 1)
        : currentDate.setDate(currentDate.getDate() - 7);
    this.minHandler.time = this.initialMinTime;
    this.maxHandler.time = this.initialMaxTime;

    this.sliderChange.emit({
      min: this.minHandler.time,
      max: this.maxHandler.time
    });
  }

  public createLabels() {
    const maxDate = new Date(this.maxHandler.time);
    if (this.view === "1d") {
      maxDate.setMinutes(0, 0);
      this.labels = [];
      for (let i = 0; i < 24; i++) {
        const date = this.removeHours(maxDate, i).getTime();
        this.labels.unshift({
          time: date,
          left: this.getPercentageFromTime(date)
        });
      }
    } else {
      const hours = maxDate.getHours();
      maxDate.setHours(hours - (hours % 12));
      maxDate.setMinutes(0, 0);
      this.labels = [];
      for (let i = 0; i < 14; i++) {
        const date = this.removeHours(maxDate, i * 12).getTime();
        this.labels.unshift({
          time: date,
          left: this.getPercentageFromTime(date)
        });
      }
      console.log("labels", this.labels);
    }
  }

  public placeHandles() {
    this.containerWidthInPixels = this.sliderContainer.nativeElement.offsetWidth;
    this.minHandleEl.nativeElement.style.left =
      this.minHandler.percentage + "%";
    this.maxHandleEl.nativeElement.style.left =
      this.maxHandler.percentage + "%";
  }

  public minHandleMouseDown(e: any) {
    e.preventDefault();
    let clientX = e.clientX;
    this.window.document.onmouseup = () => {
      this.window.document.onmouseup = null;
      this.window.document.onmousemove = null;
      this.minHandler.time =
        this.maxHandler.time - this.minHandler.time >= 3600000
          ? this.minHandler.time
          : this.maxHandler.time - 3600000;
      this.minHandler.time = this.getCloserTime(this.minHandler.time);
      this.minHandleEl.nativeElement.style.left =
        this.getPercentageFromTime(this.minHandler.time) + "%";

      this.sliderChange.emit({
        min: this.minHandler.time,
        max: this.maxHandler.time
      });
    };
    this.window.document.onmousemove = moveEvent => {
      moveEvent.preventDefault();
      const diff = clientX - moveEvent.clientX;
      const newPosition = this.percentageToPixel(this.minHandleEl) - diff;
      if (
        this.maxHandler.time - this.minHandler.time >= 3600000 &&
        newPosition <= this.containerWidthInPixels &&
        newPosition >= 0
      ) {
        clientX = moveEvent.clientX;
        this.minHandler.percentage = Number(
          ((newPosition * 100) / this.containerWidthInPixels).toFixed(2)
        );
        this.minHandler.time = this.getTime(this.minHandler.percentage);
        this.minHandleEl.nativeElement.style.left =
          this.minHandler.percentage + "%";
      }
    };
  }

  public maxHandleMouseDown(e: any) {
    e.preventDefault();
    let clientX = e.clientX;
    this.window.document.onmouseup = () => {
      this.window.document.onmouseup = null;
      this.window.document.onmousemove = null;

      this.maxHandler.time =
        this.maxHandler.time - this.minHandler.time >= 3600000
          ? this.maxHandler.time
          : this.minHandler.time + 3600000;
      this.maxHandler.time = this.getCloserTime(this.maxHandler.time);
      this.maxHandleEl.nativeElement.style.left =
        this.getPercentageFromTime(this.maxHandler.time) + "%";

      this.sliderChange.emit({
        min: this.minHandler.time,
        max: this.maxHandler.time
      });
    };
    this.window.document.onmousemove = moveEvent => {
      moveEvent.preventDefault();
      const diff = clientX - moveEvent.clientX;
      const newPosition = this.percentageToPixel(this.maxHandleEl) - diff;
      if (
        this.maxHandler.time - this.minHandler.time >= 3600000 &&
        newPosition <= this.containerWidthInPixels &&
        newPosition >= 0
      ) {
        clientX = moveEvent.clientX;
        this.maxHandler.percentage = Number(
          ((newPosition * 100) / this.containerWidthInPixels).toFixed(2)
        );
        this.maxHandler.time = this.getTime(this.maxHandler.percentage);
        this.maxHandleEl.nativeElement.style.left =
          this.maxHandler.percentage + "%";
      } else {
        this.maxHandler.time = this.getCloserTime(this.maxHandler.time);
      }
    };
  }

  public removeHours(date: Date, h: number): Date {
    const temp: Date = new Date(date);
    temp.setTime(temp.getTime() - h * 60 * 60 * 1000);
    return temp;
  }

  public getPercentageFromTime(time) {
    return (
      ((time - this.initialMinTime) * 100) /
      (this.initialMaxTime - this.initialMinTime)
    ).toFixed(2);
  }

  percentageToPixel(el) {
    return Number(
      (el.nativeElement.style.left.split("%")[0] *
        this.containerWidthInPixels) /
        100
    );
  }

  getTime(perc) {
    return (
      (perc * (this.initialMaxTime - this.initialMinTime)) / 100 +
      this.initialMinTime
    );
  }

  getCloserTime(time) {
    const date = new Date(time);

    if (Math.abs(this.initialMaxTime - date.getTime()) < 300000) {
      return this.initialMaxTime;
    }

    if (Math.abs(this.initialMinTime - date.getTime()) < 300000) {
      return this.initialMinTime;
    }

    const currentmMinutes = date.getMinutes();
    const remainder = currentmMinutes % 5;
    const newMinutes =
      remainder > 2
        ? currentmMinutes + (5 - remainder)
        : currentmMinutes - remainder;
    date.setMinutes(newMinutes);
    return date.setSeconds(0, 0);
  }
}

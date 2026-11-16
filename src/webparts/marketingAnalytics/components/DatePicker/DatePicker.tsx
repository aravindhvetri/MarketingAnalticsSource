import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./DatePicker.module.scss";

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  maxDate?: Date;
  minDate?: Date;
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmtDisplay(dt: Date): string {
  return dt.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtInput(dt: Date): string {
  const pad = (n: number): string => (n < 10 ? "0" + n : n.toString());
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}

function parseInput(val: string): Date | null {
  const parts = val.split("/");
  if (parts.length === 3) {
    const d = parseInt(parts[0]),
      m = parseInt(parts[1]) - 1,
      y = parseInt(parts[2]);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) return dt;
  }
  return null;
}

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function buildPreset(key: string): DateRange {
  const t = today();
  switch (key) {
    case "today":
      return { startDate: t, endDate: t, label: "Today" };
    case "yesterday": {
      const y = new Date(t);
      y.setDate(y.getDate() - 1);
      return { startDate: y, endDate: y, label: "Yesterday" };
    }
    case "7d": {
      const s = new Date(t);
      s.setDate(s.getDate() - 6);
      return { startDate: s, endDate: t, label: "Last 7 Days" };
    }
    case "this_month": {
      const s = new Date(t.getFullYear(), t.getMonth(), 1);
      return { startDate: s, endDate: t, label: "This Month" };
    }
    case "last_month": {
      const s = new Date(t.getFullYear(), t.getMonth() - 1, 1);
      const e = new Date(t.getFullYear(), t.getMonth(), 0);
      return { startDate: s, endDate: e, label: "Last Month" };
    }
    default:
      return buildPreset("this_month");
  }
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  maxDate,
  minDate,
}) => {
  const defaultRange = buildPreset("this_month");
  const [range, setRange] = useState<DateRange>(value ?? defaultRange);
  const [open, setOpen] = useState(false);

  const [viewYear, setViewYear] = useState(range.startDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(range.startDate.getMonth());

  const [tempStart, setTempStart] = useState<Date>(range.startDate);
  const [tempEnd, setTempEnd] = useState<Date>(range.endDate);

  // ✅ FIX: Use a single clear step: "start" = waiting for first click, "end" = waiting for second
  const [step, setStep] = useState<"start" | "end">("start");

  const [startInput, setStartInput] = useState(fmtInput(range.startDate));
  const [endInput, setEndInput] = useState(fmtInput(range.endDate));
  const [activePreset, setActivePreset] = useState("this_month");

  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setRange(value);
      setTempStart(value.startDate);
      setTempEnd(value.endDate);
      setStartInput(fmtInput(value.startDate));
      setEndInput(fmtInput(value.endDate));
    }
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = () => {
    if (!open) {
      setTempStart(range.startDate);
      setTempEnd(range.endDate);
      setStartInput(fmtInput(range.startDate));
      setEndInput(fmtInput(range.endDate));
      setViewYear(range.startDate.getFullYear());
      setViewMonth(range.startDate.getMonth());
      setStep("start"); // ✅ Always reset to "start" when opening
    }
    setOpen((p) => !p);
  };

  const applyPreset = (key: string) => {
    const preset = buildPreset(key);
    setTempStart(preset.startDate);
    setTempEnd(preset.endDate);
    setStartInput(fmtInput(preset.startDate));
    setEndInput(fmtInput(preset.endDate));
    setViewYear(preset.startDate.getFullYear());
    setViewMonth(preset.startDate.getMonth());
    setActivePreset(key);
    setStep("start"); // ✅ Reset step after preset
  };

  // ✅ FIX: Wrap in useCallback with ALL dependencies listed
  const onDayClick = useCallback(
    (day: Date) => {
      if (step === "start") {
        // First click → set both start and end to same day, wait for end
        setTempStart(day);
        setTempEnd(day);
        setStartInput(fmtInput(day));
        setEndInput(fmtInput(day));
        setActivePreset("");
        setStep("end");
      } else {
        // Second click → finalize the range
        if (day < tempStart) {
          // Clicked before start → swap
          setTempStart(day);
          setTempEnd(tempStart);
          setStartInput(fmtInput(day));
          setEndInput(fmtInput(tempStart));
        } else {
          setTempEnd(day);
          setEndInput(fmtInput(day));
        }
        setActivePreset("");
        setStep("start"); // ✅ Reset back to "start" for next interaction
      }
    },
    [step, tempStart] // ✅ Correct dependencies — no stale closures
  );

  const onStartInput = (val: string) => {
    setStartInput(val);
    setActivePreset("");
    const parsed = parseInput(val);
    if (parsed) {
      setTempStart(parsed);
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  };

  const onEndInput = (val: string) => {
    setEndInput(val);
    setActivePreset("");
    const parsed = parseInput(val);
    if (parsed) setTempEnd(parsed);
  };

  const apply = () => {
    const start = tempStart;
    const end = tempEnd ?? tempStart;

    const isSingleDay = sameDay(start, end);

    const newRange: DateRange = {
      startDate: start,
      endDate: end,
      label: activePreset
        ? buildPreset(activePreset).label
        : isSingleDay
        ? fmtDisplay(start)
        : `${fmtDisplay(start)} – ${fmtDisplay(end)}`,
    };

    setRange(newRange);
    onChange?.(newRange);
    setOpen(false);
    setStep("start"); // ✅ Reset step on apply
  };

  const cancel = () => {
    setOpen(false);
    setStep("start"); // ✅ Reset step on cancel
  };

  const shiftMonth = (dir: number) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  // ✅ FIX: onDayClick is now in the dependency array
  const buildDays = useCallback((): React.ReactNode[] => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
    const cells: React.ReactNode[] = [];
    const t = today();

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, daysInPrev - i);
      cells.push(
        <div key={`prev-${i}`} className={`${styles.drDay} ${styles.otherMonth}`}>
          {d.getDate()}
        </div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      const isStart = sameDay(d, tempStart);
      const isEnd = sameDay(d, tempEnd);
      const inRange = d >= tempStart && d <= tempEnd;
      const isToday = sameDay(d, t);
      const isDisabled =
        (maxDate && d > maxDate) || (minDate && d < minDate);

      let cls = styles.drDay;
      if (isStart) cls += ` ${styles.selectedStart}`;
      if (isEnd) cls += ` ${styles.selectedEnd}`;
      if (inRange && !isStart && !isEnd) cls += ` ${styles.inRange}`;
      if (isToday) cls += ` ${styles.todayDay}`;
      if (isDisabled) cls += ` ${styles.disabled}`;

      cells.push(
        <div
          key={day}
          className={cls}
          onClick={() => !isDisabled && onDayClick(d)}
        >
          {day}
        </div>
      );
    }

    return cells;
  }, [viewYear, viewMonth, tempStart, tempEnd, maxDate, minDate, onDayClick]); // ✅ onDayClick added

  const displayLabel = range.label || "Select Range";
  const displayRange = sameDay(range.startDate, range.endDate)
    ? fmtDisplay(range.startDate)
    : `${fmtDisplay(range.startDate)} – ${fmtDisplay(range.endDate)}`;

  return (
    <div className={styles.drPicker} ref={pickerRef}>
      <div
        className={`${styles.drTrigger} ${open ? styles.open : ""}`}
        onClick={toggle}
        role="button"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className={styles.drCalIcon}>📅</span>
        <div className={styles.drLabel}>
          <div className={styles.drLabelText}>{displayLabel}</div>
          <div className={styles.drRangeDisplay}>{displayRange}</div>
        </div>
        <span className={styles.drChevron}>▼</span>
      </div>

      {open && (
        <div className={`${styles.drDropdown} ${styles.open}`}>
          <div className={styles.drLayout}>
            <div className={styles.drPresets}>
              <div className={styles.drPresetGroup}>Quick Select</div>
              {[
                { key: "today", label: "Today" },
                { key: "yesterday", label: "Yesterday" },
                { key: "7d", label: "Last 7 Days" },
              ].map((p) => (
                <button
                  key={p.key}
                  className={`${styles.drPresetItem} ${activePreset === p.key ? styles.active : ""}`}
                  onClick={() => applyPreset(p.key)}
                >
                  {p.label}
                </button>
              ))}

              <div className={styles.drPresetGroup}>Month</div>
              {[
                { key: "this_month", label: "This Month" },
                { key: "last_month", label: "Last Month" },
              ].map((p) => (
                <button
                  key={p.key}
                  className={`${styles.drPresetItem} ${activePreset === p.key ? styles.active : ""}`}
                  onClick={() => applyPreset(p.key)}
                >
                  {p.label}
                </button>
              ))}

              <div className={styles.drPresetGroup}>Custom</div>
              <button
                className={`${styles.drPresetItem} ${activePreset === "" && step === "end" ? styles.active : ""}`}
                onClick={() => {
                  setActivePreset("");
                  setStep("start"); // ✅ Reset to start when clicking Custom Range
                }}
              >
                Custom Range
              </button>
            </div>

            <div className={styles.drCalendars}>
              <div className={styles.drCalHeader}>
                <div className={styles.drMonthNav}>
                  <button className={styles.drNavBtn} onClick={() => shiftMonth(-1)}>‹</button>
                  <div className={styles.drMonthLabel}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </div>
                  <button className={styles.drNavBtn} onClick={() => shiftMonth(1)}>›</button>
                </div>
                {/* ✅ Clear hint message using new step state */}
                <span className={styles.selectHint}>
                  {step === "start" ? "Pick start date" : "Pick end date"}
                </span>
              </div>

              <div className={styles.drCalGrid}>
                {DAY_NAMES.map((d) => (
                  <div key={d} className={styles.drDayName}>{d}</div>
                ))}
                {buildDays()}
              </div>
            </div>
          </div>

          <div className={styles.drFooter}>
            <div className={styles.drRangeInputs}>
              <div className={styles.drInputWrap}>
                <div className={styles.drInputLabel}>Start Date</div>
                <input
                  className={styles.drInput}
                  type="text"
                  value={startInput}
                  placeholder="DD/MM/YYYY"
                  onChange={(e) => onStartInput(e.target.value)}
                />
              </div>
              <div className={styles.drArrow}>→</div>
              <div className={styles.drInputWrap}>
                <div className={styles.drInputLabel}>End Date</div>
                <input
                  className={styles.drInput}
                  type="text"
                  value={endInput}
                  placeholder="DD/MM/YYYY"
                  onChange={(e) => onEndInput(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.drFooterBtns}>
              <button className={styles.drCancel} onClick={cancel}>Cancel</button>
              <button className={styles.drApply} onClick={apply}>Apply Range</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
# KY-040 Rotary Encoder MakeCode Package

This is a MakeCode extension for the KY-040 rotary encoder, supporting up to 3 encoders simultaneously.

- Supports 1–3 encoders at the same time
- Supports bare KY-040 component without PCB (uses internal microbit pull ups)
- Added debouncing to avoid common errors with low quality KY-040 parts
- Added basic usage connect blocks to avoid pins with other jobs, like LED, which can confuse new users
- Advanced option is in ... more menu, with all pins
- Removed noisy serial debug messages that interfered with student code

## Hardware Setup

Connect each encoder's CLK, DT, and SW pins to available digital pins on the micro:bit. Connect GND to GND.
Rotary Encoders are simple switches, can work on 3.3v.

### Recommended pin assignments (micro:bit v2)

| Encoder | CLK | DT  | SW  |
| ------- | --- | --- | --- |
| E1      | P0  | P1  | P2  |
| E2      | P8  | P9  | P16 |
| E3      | P13 | P14 | P15 |

Avoid P3, P4, P6, P7, P10 — these are shared with the LED matrix and will conflict unless you call `led.enable(false)` first. Avoid P12 (reserved for accessibility).

**micro:bit v1 note:** P9 is LED row 3 on v1. If using a v1 board, replace P9 with P16 and find an alternative SW pin. All other pins in the table above are safe on both versions.

## Blocks

### Connect rotary encoder

Must be called before any other blocks. Repeat for each encoder you use.

```sig
RotaryEncoder.initE1()
RotaryEncoder.initE2()
RotaryEncoder.initE3()
```

### On event (rotate or button press)

```sig
RotaryEncoder.onEvent(EncoderID.E1, EncoderEvent.Clockwise, () => {})
RotaryEncoder.onEvent(EncoderID.E1, EncoderEvent.CounterClockwise, () => {})
RotaryEncoder.onEvent(EncoderID.E1, EncoderEvent.ButtonPress, () => {})
```

## Example: Single encoder number input

```blocks
basic.pause(1000); // --- Setup ---
basic.showIcon(IconNames.Chessboard);
RotaryEncoder.initE1()
let count = 13;
led.plotBarGraph(count, 25);

RotaryEncoder.onEvent(EncoderID.E1, EncoderEvent.CounterClockwise, () => {
    count -= 1
  serial.writeValue("count", count);
  led.plotBarGraph(count, 25);
})
RotaryEncoder.onEvent(EncoderID.E1, EncoderEvent.Clockwise, () => {
    count += 1
    serial.writeValue("count", count);
    basic.showNumber(count);
})
RotaryEncoder.onEvent(EncoderID.E1, EncoderEvent.ButtonPress, () => {
    basic.showIcon(IconNames.Yes);
    basic.pause(1000);
    led.plotBarGraph(count, 25);
})
```

## Example: Three Encoders

```blocks
RotaryEncoder.onEvent(EncoderID.E1, EncoderEvent.CounterClockwise, function () {
    basic.showNumber(1)
    basic.showArrow(ArrowNames.West)
})
RotaryEncoder.onEvent(EncoderID.E3, EncoderEvent.CounterClockwise, function () {
    basic.showNumber(3)
    basic.showArrow(ArrowNames.West)
})
RotaryEncoder.onEvent(EncoderID.E2, EncoderEvent.Clockwise, function () {
    basic.showNumber(2)
    basic.showArrow(ArrowNames.East)
})
RotaryEncoder.onEvent(EncoderID.E2, EncoderEvent.CounterClockwise, function () {
    basic.showNumber(2)
    basic.showArrow(ArrowNames.West)
})
RotaryEncoder.onEvent(EncoderID.E3, EncoderEvent.Clockwise, function () {
    basic.showNumber(3)
    basic.showArrow(ArrowNames.East)
})
RotaryEncoder.onEvent(EncoderID.E2, EncoderEvent.ButtonPress, function () {
    basic.showNumber(2)
    basic.showArrow(ArrowNames.South)
})
RotaryEncoder.onEvent(EncoderID.E1, EncoderEvent.ButtonPress, function () {
    basic.showNumber(1)
    basic.showArrow(ArrowNames.South)
})
RotaryEncoder.onEvent(EncoderID.E1, EncoderEvent.Clockwise, function () {
    basic.showNumber(1)
    basic.showArrow(ArrowNames.East)
})
RotaryEncoder.onEvent(EncoderID.E3, EncoderEvent.ButtonPress, function () {
    basic.showNumber(3)
    basic.showArrow(ArrowNames.South)
})
RotaryEncoder.initE1()
RotaryEncoder.initE2()
RotaryEncoder.initE3()

```

## Acknowledgements

Forked from [Tinkertanker/pxt-rotary-encoder-ky040](https://github.com/tinkertanker/pxt-rotary-encoder-ky040) with the following changes:

## Supported targets

- for PXT/microbit

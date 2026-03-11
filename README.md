# KY040 Rotary Encoder MakeCode Package

This is the MakeCode package for the KY-040 rotary encoder, supporting up to 4 encoders simultaneously.

Forked from [Tinkertanker/pxt-rotary-encoder-ky040](https://github.com/tinkertanker/pxt-rotary-encoder-ky040) with the following changes:
- Supports 1–4 encoders at the same time
- Removed noisy serial debug messages that interfered with student code

## Hardware Setup
Connect each encoder's CLK, DT, and SW pins to available digital pins on the micro:bit. GND to GND.

## Blocks

### Connect rotary encoder
Must be called before any other blocks. Repeat for each encoder you use.

```sig
RotaryEncoder.init(EncoderID.E1, DigitalPin.P0, DigitalPin.P1, DigitalPin.P2)
```

### On button pressed

```sig
RotaryEncoder.onPressEvent(EncoderID.E1, () => {})
```

### On rotate (left/right)

```sig
RotaryEncoder.onRotateEvent(EncoderID.E1, RotationDirection.Left, () => {})
RotaryEncoder.onRotateEvent(EncoderID.E1, RotationDirection.Right, () => {})
```

## Example: Single encoder number input

```blocks
RotaryEncoder.init(EncoderID.E1, DigitalPin.P8, DigitalPin.P9, DigitalPin.P11)
let item = 0
basic.showNumber(item)
RotaryEncoder.onRotateEvent(EncoderID.E1, RotationDirection.Left, () => {
    item -= 1
    basic.showNumber(item)
})
RotaryEncoder.onRotateEvent(EncoderID.E1, RotationDirection.Right, () => {
    item += 1
    basic.showNumber(item)
})
RotaryEncoder.onPressEvent(EncoderID.E1, () => {
    basic.showString("selected!")
})
```

## Example: Two encoders

```blocks
RotaryEncoder.init(EncoderID.E1, DigitalPin.P8, DigitalPin.P9, DigitalPin.P11)
RotaryEncoder.init(EncoderID.E2, DigitalPin.P12, DigitalPin.P13, DigitalPin.P14)
let val1 = 0
let val2 = 0
RotaryEncoder.onRotateEvent(EncoderID.E1, RotationDirection.Right, () => { val1++ })
RotaryEncoder.onRotateEvent(EncoderID.E1, RotationDirection.Left, () => { val1-- })
RotaryEncoder.onRotateEvent(EncoderID.E2, RotationDirection.Right, () => { val2++ })
RotaryEncoder.onRotateEvent(EncoderID.E2, RotationDirection.Left, () => { val2-- })
```

## Supported targets

* for PXT/microbit

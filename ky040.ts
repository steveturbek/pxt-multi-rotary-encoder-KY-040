enum EncoderEvent {
  //% block="clockwise"
  Clockwise = 0,
  //% block="counter clockwise"
  CounterClockwise = 1,
  //% block="button pressed"
  ButtonPress = 2,
}

enum EncoderID {
  //% block="RotaryEncoder 1"
  E1 = 1,
  //% block="RotaryEncoder 2"
  E2 = 2,
  //% block="RotaryEncoder 3"
  E3 = 3,
}

//% color=50 weight=80
//% icon="\uf01e"
namespace RotaryEncoder {
  class EncoderState {
    clkPin: number;
    dtPin: number;
    swPin: number;
    lastPressed: number;
    rotateReady: boolean;
    pressedID: number;
    rotatedClockwiseID: number;
    rotatedCounterClockwiseID: number;

    constructor(id: EncoderID) {
      this.lastPressed = 1;
      this.rotateReady = true;
      const base = 5600 + (id - 1) * 3;
      this.pressedID = base;
      this.rotatedClockwiseID = base + 1;
      this.rotatedCounterClockwiseID = base + 2;
    }
  }

  let encoders: EncoderState[] = [];

  function getEncoder(id: EncoderID): EncoderState {
    const idx = id - 1;
    if (!encoders[idx]) encoders[idx] = new EncoderState(id);
    return encoders[idx];
  }

  function setup(id: EncoderID, clk: number, dt: number, sw: number): void {
    const enc = getEncoder(id);
    enc.clkPin = clk;
    enc.dtPin = dt;
    enc.swPin = sw;

    pins.setPull(clk as DigitalPin, PinPullMode.PullUp);
    pins.setPull(dt as DigitalPin, PinPullMode.PullUp);
    pins.setPull(sw as DigitalPin, PinPullMode.PullUp);

    control.inBackground(() => {
      while (true) {
        const riValue = pins.digitalReadPin(enc.clkPin as DigitalPin);
        const dvValue = pins.digitalReadPin(enc.dtPin as DigitalPin);
        if (riValue == 1 && dvValue == 1) enc.rotateReady = true;
        else if (enc.rotateReady) {
          if (riValue == 1 && dvValue == 0) {
            enc.rotateReady = false;
            control.raiseEvent(enc.rotatedCounterClockwiseID, EncoderEvent.CounterClockwise);
          } else if (riValue == 0 && dvValue == 1) {
            enc.rotateReady = false;
            control.raiseEvent(enc.rotatedClockwiseID, EncoderEvent.Clockwise);
          }
        }
        basic.pause(5);
      }
    });

    control.inBackground(() => {
      while (true) {
        const pressed = pins.digitalReadPin(enc.swPin as DigitalPin);
        if (pressed != enc.lastPressed) {
          enc.lastPressed = pressed;
          if (pressed == 0) control.raiseEvent(enc.pressedID, 0);
        }
        basic.pause(50);
      }
    });
  }

  /**
   * Connect RotaryEncoder 1: CLK=P0, DT=P1, SW=P2
   */
  //% blockId=rotary_ky_init1
  //% block="connect RotaryEncoder 1  CLK=P0 DT=P1 SW=P2"
  //% help=github:steveturbek/pxt-rotary-encoder-KY-040-multi
  //% weight=90
  export function initE1(): void {
    setup(EncoderID.E1, DigitalPin.P0, DigitalPin.P1, DigitalPin.P2);
  }

  /**
   * Connect RotaryEncoder 2: CLK=P8, DT=P9, SW=P16
   */
  //% blockId=rotary_ky_init2
  //% block="connect RotaryEncoder 2  CLK=P8 DT=P9 SW=P13"
  //% help=github:steveturbek/pxt-rotary-encoder-KY-040-multi
  //% weight=80
  export function initE2(): void {
    setup(EncoderID.E2, DigitalPin.P8, DigitalPin.P9, DigitalPin.P13);
  }

  /**
   * Connect RotaryEncoder 3: CLK=P14, DT=P15, SW=P16
   */
  //% blockId=rotary_ky_init3
  //% block="connect RotaryEncoder 3  CLK=P13 DT=P14 SW=P15"
  //% help=github:steveturbek/pxt-rotary-encoder-KY-040-multi
  //% weight=70
  export function initE3(): void {
    setup(EncoderID.E3, DigitalPin.P14, DigitalPin.P15, DigitalPin.P16);
  }

  /**
   * Run code when the rotary encoder rotates or the button is pressed.
   */
  //% blockId=rotary_ky_event
  //% block="on %id %event"
  //% help=github:steveturbek/pxt-rotary-encoder-KY-040-multi
  //% weight=60
  export function onEvent(id: EncoderID, event: EncoderEvent, body: () => void): void {
    const enc = getEncoder(id);
    if (event == EncoderEvent.Clockwise) control.onEvent(enc.rotatedClockwiseID, EncoderEvent.Clockwise, body);
    if (event == EncoderEvent.CounterClockwise) control.onEvent(enc.rotatedCounterClockwiseID, EncoderEvent.CounterClockwise, body);
    if (event == EncoderEvent.ButtonPress) control.onEvent(enc.pressedID, 0, body);
  }

  /**
   * Connect a rotary encoder using any digital pin.
   * Avoid LED pins P3 P4 P6 P7 P10 and accessibility pin P12.
   * See https://github.com/steveturbek/pxt-rotary-encoder-KY-040-multi#recommended-pin-assignments-microbit-v2
   */
  //% blockId=rotary_ky_init_advanced
  //% block="connect %id clk %clk|dt %dt|sw %sw "
  //% help=github:steveturbek/pxt-rotary-encoder-KY-040-multi
  //% advanced=true
  //% clk.defl=DigitalPin.P0 dt.defl=DigitalPin.P1 sw.defl=DigitalPin.P2
  export function initAdvanced(id: EncoderID, clk: DigitalPin, dt: DigitalPin, sw: DigitalPin): void {
    setup(id, clk, dt, sw);
  }
}

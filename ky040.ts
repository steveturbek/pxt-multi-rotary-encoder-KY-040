// @ts-nocheck  // hide microbit specific code errors when developing in VS Code

// Events that a rotary encoder can fire
enum EncoderEvent {
  //% block="clockwise"
  Clockwise = 0,
  //% block="counter clockwise"
  CounterClockwise = 1,
  //% block="button pressed"
  ButtonPress = 2,
}

// Which physical encoder we're referring to (supports up to 3)
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
namespace RotaryEncoderPlus {

  // Holds all runtime state for one encoder instance
  class EncoderState {
    clkPin: number;       // CLK pin — the primary rotation signal
    dtPin: number;        // DT pin — direction signal, read when CLK changes
    swPin: number;        // SW pin — the push-button switch

    // true for active-high switches (e.g. RGB encoder button connects to 3.3V when pressed).
    // false (default) for standard active-low switches (connects to GND when pressed).
    activeHigh: boolean;

    // Last pin reading from SW. Used to detect changes and debounce.
    // Initialized to 1 (not pressed) for active-low, 0 (not pressed) for active-high.
    lastPressed: number;

    // true when CLK and DT are both HIGH — the encoder is at rest and ready to detect the next click.
    // Prevents firing multiple events during a single detent transition.
    rotateReady: boolean;

    // Unique event IDs used with control.raiseEvent / control.onEvent.
    // Each encoder gets 3 consecutive IDs starting at 5600 + (id-1)*3.
    pressedID: number;
    rotatedClockwiseID: number;
    rotatedCounterClockwiseID: number;

    constructor(id: EncoderID) {
      this.activeHigh = false;
      this.lastPressed = 1;   // will be overridden by setup() based on activeHigh
      this.rotateReady = true;
      // Assign unique event IDs for this encoder so multiple encoders don't collide
      const base = 5600 + (id - 1) * 3;
      this.pressedID = base;
      this.rotatedClockwiseID = base + 1;
      this.rotatedCounterClockwiseID = base + 2;
    }
  }

  // One entry per EncoderID (index 0 = E1, 1 = E2, 2 = E3)
  let encoders: EncoderState[] = [];

  // Lazily creates the EncoderState for an ID the first time it's needed
  function getEncoder(id: EncoderID): EncoderState {
    const idx = id - 1;
    if (!encoders[idx]) encoders[idx] = new EncoderState(id);
    return encoders[idx];
  }

  // Core setup: configures pins and starts two background polling loops
  function setup(id: EncoderID, clk: number, dt: number, sw: number, activeHigh: boolean = false): void {
    const enc = getEncoder(id);
    enc.clkPin = clk;
    enc.dtPin = dt;
    enc.swPin = sw;
    enc.activeHigh = activeHigh;
    // "Not pressed" idle state depends on wiring:
    //   active-low  (PullUp):   idle = HIGH = 1
    //   active-high (PullDown): idle = LOW  = 0
    enc.lastPressed = activeHigh ? 0 : 1;

    // CLK and DT always use PullUp — standard KY-040 wiring
    pins.setPull(clk as DigitalPin, PinPullMode.PullUp);
    pins.setPull(dt as DigitalPin, PinPullMode.PullUp);
    // SW pull mode depends on switch type:
    //   standard encoder button → PullUp  (idles HIGH, LOW when pressed)
    //   RGB encoder button      → PullDown (idles LOW, HIGH when pressed)
    pins.setPull(sw as DigitalPin, activeHigh ? PinPullMode.PullDown : PinPullMode.PullUp);

    // --- Background loop 1: rotation detection ---
    // Polls CLK and DT every 5ms to detect rotation direction.
    // KY-040 direction encoding:
    //   CLK=1, DT=0  → counter-clockwise
    //   CLK=0, DT=1  → clockwise
    // rotateReady prevents re-firing until both pins return HIGH (detent position)
    control.inBackground(() => {
      while (true) {
        const riValue = pins.digitalReadPin(enc.clkPin as DigitalPin);
        const dvValue = pins.digitalReadPin(enc.dtPin as DigitalPin);
        if (riValue == 1 && dvValue == 1) enc.rotateReady = true;  // back at rest
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

    // --- Background loop 2: button press detection ---
    // Polls SW every 50ms. Fires ButtonPress only on the press edge (not release).
    // Press edge = transition TO the "active" level:
    //   active-low:  pressed == 0 (pin pulled LOW by button)
    //   active-high: pressed == 1 (pin pulled HIGH by button)
    control.inBackground(() => {
      while (true) {
        const pressed = pins.digitalReadPin(enc.swPin as DigitalPin);
        if (pressed != enc.lastPressed) {
          enc.lastPressed = pressed;
          if (pressed == (enc.activeHigh ? 1 : 0)) control.raiseEvent(enc.pressedID, 0);
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
   * Connect RotaryEncoder 2: CLK=P8, DT=P9, SW=P13
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
  //% block="connect RotaryEncoder 3  CLK=P14 DT=P15 SW=P16"
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
   * Set activeHigh=true for switches that connect to 3.3V when pressed (e.g. RGB rotary encoder).
   */
  //% blockId=rotary_ky_init_advanced
  //% block="connect %id clk %clk|dt %dt|sw %sw|active high %activeHigh"
  //% help=github:steveturbek/pxt-rotary-encoder-KY-040-multi
  //% advanced=false
  //% clk.defl=DigitalPin.P0 dt.defl=DigitalPin.P1 sw.defl=DigitalPin.P2 activeHigh.defl=false
  export function initAdvanced(id: EncoderID, clk: DigitalPin, dt: DigitalPin, sw: DigitalPin, activeHigh: boolean = false): void {
    setup(id, clk, dt, sw, activeHigh);
  }
}

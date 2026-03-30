// @ts-nocheck  // hide microbit specific code errors when developing in VS Code

/**
 * Blocks for KY-040 and compatible rotary encoders. Supports up to 3 encoders.
 */
//% color="#a5995b" weight=80
//% icon="\uf01e"
//% block="Rotary Encoder"
namespace rotaryEncoderPlus {

  // Events that a rotary encoder can fire
  export enum EncoderEvent {
    //% block="clockwise"
    Clockwise = 0,
    //% block="counter clockwise"
    CounterClockwise = 1,
    //% block="button pressed"
    ButtonPress = 2,
  }

  // Switch wiring type — most encoders are Standard (active-low, pull-up)
  export enum SwitchType {
    //% block="standard"
    Standard = 0,   // button connects to GND when pressed (KY-040 and most encoders)
    //% block="active high"
    ActiveHigh = 1, // button connects to 3.3V when pressed (e.g. RGB rotary encoder)
  }

  // Which physical encoder we're referring to (supports up to 3)
  export enum EncoderID {
    //% block="rotary encoder 1"
    E1 = 1,
    //% block="rotary encoder 2"
    E2 = 2,
    //% block="rotary encoder 3"
    E3 = 3,
  }

  // Holds all runtime state for one encoder instance
  class EncoderState {
    clkPin: number; // CLK pin — the primary rotation signal
    dtPin: number;  // DT pin — direction signal, read when CLK changes
    swPin: number;  // SW pin — the push-button switch

    // Whether the switch is standard (active-low) or active-high — determines pull mode and press level
    switchType: SwitchType;

    // Last pin reading from SW. Used to detect changes and debounce.
    // Initialized to 1 (not pressed) for active-low, 0 (not pressed) for active-high.
    lastPressed: number;

    // true when CLK and DT are both HIGH — the encoder is at rest and ready to detect the next click.
    // Prevents firing multiple events during a single detent transition.
    rotateReady: boolean;

    // true after setup() has launched background loops — prevents duplicate loops if called again.
    initialized: boolean;

    // Unique event IDs used with control.raiseEvent / control.onEvent.
    // Each encoder gets 3 consecutive IDs starting at 5600 + (id-1)*3.
    pressedID: number;
    rotatedClockwiseID: number;
    rotatedCounterClockwiseID: number;

    constructor(id: EncoderID) {
      this.switchType = SwitchType.Standard;
      this.lastPressed = 1; // will be overridden by setup() based on switchType
      this.rotateReady = true;
      this.initialized = false;
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

  // Core setup: configures pins and starts two background polling loops.
  // Safe to call multiple times — background loops are only created once per encoder.
  function setup(id: EncoderID, clk: number, dt: number, sw: number, switchType: SwitchType = SwitchType.Standard): void {
    const enc = getEncoder(id);
    enc.clkPin = clk;
    enc.dtPin = dt;
    enc.swPin = sw;
    enc.switchType = switchType;
    // "Not pressed" idle state depends on wiring:
    //   Standard  (PullUp):   idle = HIGH = 1
    //   ActiveHigh (PullDown): idle = LOW  = 0
    enc.lastPressed = switchType == SwitchType.ActiveHigh ? 0 : 1;

    // CLK and DT always use PullUp — standard KY-040 wiring
    pins.setPull(clk as DigitalPin, PinPullMode.PullUp);
    pins.setPull(dt as DigitalPin, PinPullMode.PullUp);
    // SW pull mode depends on switch type:
    //   Standard   → PullUp  (idles HIGH, LOW when pressed)
    //   ActiveHigh → PullDown (idles LOW, HIGH when pressed)
    pins.setPull(sw as DigitalPin, switchType == SwitchType.ActiveHigh ? PinPullMode.PullDown : PinPullMode.PullUp);

    if (enc.initialized) return; // prevent duplicate background loops if called more than once
    enc.initialized = true;

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
        if (riValue == 1 && dvValue == 1)
          enc.rotateReady = true; // back at rest
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
          if (pressed == (enc.switchType == SwitchType.ActiveHigh ? 1 : 0)) control.raiseEvent(enc.pressedID, 0);
        }
        basic.pause(50);
      }
    });
  }

  /**
   * Connect rotary encoder 1 using default pins: CLK=P0, DT=P1, SW=P2.
   */
  //% blockId=rotaryencoderplus_connect1
  //% block="connect rotary encoder 1 CLK=P0 DT=P1 SW=P2"
  //% weight=90
  //% tooltip="Connect rotary encoder 1 to default pins: CLK=P0, DT=P1, SW=P2"
  //% helpUrl="https://github.com/steveturbek/pxt-rotary-encoder-KY-040-plus"
  export function connectEncoder1(): void {
    setup(EncoderID.E1, DigitalPin.P0, DigitalPin.P1, DigitalPin.P2);
  }

  /**
   * Connect rotary encoder 2 using default pins: CLK=P8, DT=P9, SW=P13.
   */
  //% blockId=rotaryencoderplus_connect2
  //% block="connect rotary encoder 2 CLK=P8 DT=P9 SW=P13"
  //% weight=80
  //% tooltip="Connect rotary encoder 2 to default pins: CLK=P8, DT=P9, SW=P13"
  //% helpUrl="https://github.com/steveturbek/pxt-rotary-encoder-KY-040-plus"
  export function connectEncoder2(): void {
    setup(EncoderID.E2, DigitalPin.P8, DigitalPin.P9, DigitalPin.P13);
  }

  /**
   * Connect rotary encoder 3 using default pins: CLK=P14, DT=P15, SW=P16.
   */
  //% blockId=rotaryencoderplus_connect3
  //% block="connect rotary encoder 3 CLK=P14 DT=P15 SW=P16"
  //% weight=70
  //% tooltip="Connect rotary encoder 3 to default pins: CLK=P14, DT=P15, SW=P16"
  //% helpUrl="https://github.com/steveturbek/pxt-rotary-encoder-KY-040-plus"
  export function connectEncoder3(): void {
    setup(EncoderID.E3, DigitalPin.P14, DigitalPin.P15, DigitalPin.P16);
  }

  /**
   * Run code when the rotary encoder rotates or the button is pressed.
   * @param id which encoder to listen to
   * @param event the event to respond to (clockwise, counter clockwise, or button pressed)
   * @param body code to run when the event fires
   */
  //% blockId=rotaryencoderplus_event
  //% block="on %id %event"
  //% weight=60
  //% tooltip="Run code when the rotary encoder is rotated or its button is pressed"
  //% helpUrl="https://github.com/steveturbek/pxt-rotary-encoder-KY-040-plus"
  export function onEvent(id: EncoderID, event: EncoderEvent, body: () => void): void {
    const enc = getEncoder(id);
    if (event == EncoderEvent.Clockwise) control.onEvent(enc.rotatedClockwiseID, EncoderEvent.Clockwise, body);
    if (event == EncoderEvent.CounterClockwise) control.onEvent(enc.rotatedCounterClockwiseID, EncoderEvent.CounterClockwise, body);
    if (event == EncoderEvent.ButtonPress) control.onEvent(enc.pressedID, 0, body);
  }

  /**
   * Connect a rotary encoder using any available digital pin.
   * You may need to turn off LEDs to use all pins.
   * @param id which encoder slot to use (E1, E2, or E3)
   * @param clk CLK pin on the encoder
   * @param dt DT pin on the encoder
   * @param sw SW (button) pin on the encoder
   * @param switchType Standard (default, connects to GND when pressed) or ActiveHigh (connects to 3.3V when pressed, e.g. RGB rotary encoder)
   */
  //% blockId=rotaryencoderplus_connect_advanced
  //% block="connect %id CLK %clk|DT %dt|SW %sw|switch type %switchType"
  //% advanced=false
  //% tooltip="Connect a rotary encoder to any pins, with optional active-high button support"
  //% helpUrl="https://github.com/steveturbek/pxt-rotary-encoder-KY-040-plus"
  //% id.defl=rotaryEncoderPlus.EncoderID.E1 clk.defl=DigitalPin.P0 dt.defl=DigitalPin.P1 sw.defl=DigitalPin.P2 switchType.defl=rotaryEncoderPlus.SwitchType.Standard
  export function connectAdvanced(id: EncoderID, clk: DigitalPin, dt: DigitalPin, sw: DigitalPin, switchType: SwitchType = SwitchType.Standard): void {
    setup(id, clk, dt, sw, switchType);
  }
}

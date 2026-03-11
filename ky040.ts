enum RotationDirection {
    Left = 0,
    Right = 1
}

enum EncoderID {
    //% block="encoder 1"
    E1 = 1,
    //% block="encoder 2"
    E2 = 2,
    //% block="encoder 3"
    E3 = 3,
    //% block="encoder 4"
    E4 = 4
}

//% color=50 weight=80
//% icon="\uf01e"
namespace RotaryEncoder {

    class EncoderState {
        clkPin: DigitalPin;
        dtPin: DigitalPin;
        swPin: DigitalPin;
        lastPressed: number;
        rotateReady: boolean;
        pressedID: number;
        rotatedLeftID: number;
        rotatedRightID: number;

        constructor(id: EncoderID) {
            this.lastPressed = 1;
            this.rotateReady = true;
            const base = 5600 + (id - 1) * 3;
            this.pressedID = base;
            this.rotatedLeftID = base + 1;
            this.rotatedRightID = base + 2;
        }
    }

    let encoders: EncoderState[] = [];

    function getEncoder(id: EncoderID): EncoderState {
        const idx = id - 1;
        if (!encoders[idx]) encoders[idx] = new EncoderState(id);
        return encoders[idx];
    }

    /**
     * Initialises the rotary encoder and starts polling its pins.
     */
    //% blockId=rotary_ky_init
    //% block="connect %id clk %clk|dt %dt|sw %sw"
    //% icon="\uf1ec"
    export function init(id: EncoderID, clk: DigitalPin, dt: DigitalPin, sw: DigitalPin): void {
        const enc = getEncoder(id);
        enc.clkPin = clk;
        enc.dtPin = dt;
        enc.swPin = sw;

        control.inBackground(() => {
            while (true) {
                const riValue = pins.digitalReadPin(enc.clkPin);
                const dvValue = pins.digitalReadPin(enc.dtPin);
                if (riValue == 1 && dvValue == 1) enc.rotateReady = true;
                else if (enc.rotateReady) {
                    if (riValue == 1 && dvValue == 0) {
                        enc.rotateReady = false;
                        control.raiseEvent(enc.rotatedRightID, RotationDirection.Right);
                    } else if (riValue == 0 && dvValue == 1) {
                        enc.rotateReady = false;
                        control.raiseEvent(enc.rotatedLeftID, RotationDirection.Left);
                    }
                }
                basic.pause(5);
            }
        });

        control.inBackground(() => {
            while (true) {
                const pressed = pins.digitalReadPin(enc.swPin);
                if (pressed != enc.lastPressed) {
                    enc.lastPressed = pressed;
                    if (pressed == 0) control.raiseEvent(enc.pressedID, 0);
                }
                basic.pause(50);
            }
        });
    }

    /**
     * Run code when the rotary encoder is rotated.
     */
    //% blockId=rotary_ky_rotated_event
    //% block="on %id rotated |%dir"
    export function onRotateEvent(id: EncoderID, dir: RotationDirection, body: () => void): void {
        const enc = getEncoder(id);
        if (dir == RotationDirection.Left) control.onEvent(enc.rotatedLeftID, dir, body);
        if (dir == RotationDirection.Right) control.onEvent(enc.rotatedRightID, dir, body);
    }

    /**
     * Run code when the rotary encoder button is pressed.
     */
    //% blockId=rotary_ky_pressed_event
    //% block="on %id button pressed"
    export function onPressEvent(id: EncoderID, body: () => void): void {
        const enc = getEncoder(id);
        control.onEvent(enc.pressedID, 0, body);
    }
}

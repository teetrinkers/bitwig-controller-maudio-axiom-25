loadAPI(1);

load("rotaries.js");

host.defineController("M-Audio", "Axiom 25", "1.0", "436eb006-523d-4fd4-adf1-431af7803e53");
host.defineMidiPorts(1, 0);
host.addDeviceNameBasedDiscoveryPair(["USB Axiom 25 Port 1"], ["USB Axiom 25 Port 1"]);

var CC_MIN = 1;
var CC_MAX = 119;

var DEVICE_MACRO_COUNT = 8
var ccToUserIndex = []

var CC = {
    LOOP: 20,
    REW: 21,
    FF: 22,
    STOP: 23,
    PLAY: 24,
    REC: 25
}

var PADS = {
    C14: 36,
    C15: 38,
    C16: 46,
    C17: 42,
    C18: 50,
    C19: 45,
    C20: 51,
    C21: 49
}

function init() {
    host.getMidiInPort(0).setMidiCallback(onMidi);
    noteInput = host.getMidiInPort(0).createNoteInput("Axiom 25",
        "80????", "90????", "B001??", "B002??", "B00B??", "B040??", "C0????", "D0????", "E0????");
    noteInput.setShouldConsumeEvents(false);

    transport = host.createTransport();
    cursorTrack = host.createCursorTrack(2, 0);

    rotaries = new Rotaries(cursorTrack);

    // Init user controls.
    userControls = host.createUserControls(CC_MAX - CC_MIN + 1 - DEVICE_MACRO_COUNT);
    var index = 0;
    for (var cc = CC_MIN; cc < CC_MAX; cc++) {
        if (!rotaries.isRotary(cc) && !withinRange(cc, CC.LOOP, CC.REC)) {
            ccToUserIndex[cc] = index;
            userControls.getControl(index).setLabel("CC" + cc);
            index++;
        }
    }
}

function isUserControlCC(cc) {
    return cc < ccToUserIndex.length && ccToUserIndex[cc] != undefined;
}

function onMidi(status, data1, data2) {
    printMidi(status, data1, data2)

    if (isChannelController(status)) {

        // Transport buttons
        switch (data1) {
            case CC.LOOP:
                cursorTrack.getPrimaryDevice().isWindowOpen().toggle();
                break;
            case CC.REW:
                cursorTrack.selectPrevious();
                break;
            case CC.FF:
                cursorTrack.selectNext();
                break;
            case CC.STOP:
                transport.stop();
                break;
            case CC.PLAY:
                transport.play();
                break;
            case CC.REC:
                transport.record();
                break;
        }

        if (rotaries.isRotary(data1)) {
            rotaries.onMidi(status, data1, data2);
        } else if (isUserControlCC(data1)) {
            var index = ccToUserIndex[data1];
            userControls.getControl(index).set(data2, 128);
        }
    }

    // Pads
    if (MIDIChannel(status) == 9 && isNoteOn(status) && data2 > 10) {
        switch (data1) {
            case PADS.C14:
                rotaries.toggleMode();
                break;
            case PADS.C15:
                break;
            case PADS.C16:
                break;
            case PADS.C17:
                break;
            case PADS.C18:
                break;
            case PADS.C19:
                break;
            case PADS.C20:
                break;
            case PADS.C21:
                break;
        }
    }
}

function exit()
{
}

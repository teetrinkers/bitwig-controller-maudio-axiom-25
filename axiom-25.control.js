loadAPI(1);

host.defineController("M-Audio", "Axiom 25", "1.0", "69cb6728-002b-4546-b9a9-6ffb19d58281");
host.defineMidiPorts(1, 0);
host.addDeviceNameBasedDiscoveryPair(["USB Axiom 25 Port 1"], ["USB Axiom 25 Port 1"]);

var CC_MIN = 1;
var CC_MAX = 119;

var DEVICE_MACRO_COUNT = 8

// Map the CCs of the rotaries to device macros.
var rotaryCCToMacroIndex = []
rotaryCCToMacroIndex[71] = 0
rotaryCCToMacroIndex[74] = 1
rotaryCCToMacroIndex[84] = 2
rotaryCCToMacroIndex[7]  = 3
rotaryCCToMacroIndex[91] = 4
rotaryCCToMacroIndex[93] = 5
rotaryCCToMacroIndex[5]  = 6
rotaryCCToMacroIndex[10] = 7

var ccToUserIndex = []

var CC = {
	LOOP: 20,
	REW: 21,
	FF: 22,
	STOP: 23,
	PLAY: 24,
	REC: 25
}

function init()
{
	host.getMidiInPort(0).setMidiCallback(onMidi);
    noteInput = host.getMidiInPort(0).createNoteInput("Axiom 25");
    noteInput.setShouldConsumeEvents(false);

	transport = host.createTransport();
	cursorTrack = host.createCursorTrack(2, 0);

	// Init device macros.
	cursorTrack = host.createCursorTrack(3, 0);
	primaryDevice = cursorTrack.getPrimaryDevice();
	for (var i = 0; i < DEVICE_MACRO_COUNT; i++)
	{
		var p = primaryDevice.getMacro(i).getAmount();
		p.setIndication(true);
	}

    // Init user controls.
	userControls = host.createUserControls(CC_MAX - CC_MIN + 1 - DEVICE_MACRO_COUNT);
	var index = 0;
	for (var cc = CC_MIN; cc < CC_MAX; cc++)
	{
		if (!isDeviceParameterCC(cc) && !withinRange(cc, CC.LOOP, CC.REC))
		{
			ccToUserIndex[cc] = index;
			userControls.getControl(index).setLabel("CC" + cc);
			index++;
		}
	}
}

function isDeviceParameterCC(cc)
{
	return cc < rotaryCCToMacroIndex.length && rotaryCCToMacroIndex[cc] != undefined;
}

function isUserControlCC(cc)
{
	return cc < ccToUserIndex.length && ccToUserIndex[cc] != undefined;
}

function onMidi(status, data1, data2)
{
	if (isChannelController(status))
	{
		printMidi(status, data1, data2)

		switch (data1) {
			case CC.LOOP:
				transport.toggleLoop();
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

		if (isDeviceParameterCC(data1))
		{
			var index = rotaryCCToMacroIndex[data1]
			primaryDevice.getMacro(index).getAmount().set(data2, 128);
		}
		else if (isUserControlCC(data1))
		{
			var index = ccToUserIndex[data1];
			userControls.getControl(index).set(data2, 128);
		}
	}
}

function exit()
{
}

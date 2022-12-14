loadAPI(1);

host.defineController("Steev", "Arturia Beatstep Pro", "1.0", "9694E601-0A0E-4535-8A7A-2F935A1BB285");
//host.addDeviceNameBasedDiscoveryPair(["Arturia Beatstep Pro","Arturia Beatstep Pro Arturia BeatstepPro"],["Arturia Beatstep Pro","Arturia Beatstep Pro Arturia BeatstepPro"]);
host.defineMidiPorts(1, 1);

var bsp = {
  encoderCCs: [10,74,71,76,77,93,73,75,114,18,19,16,17,91,79,72]
};

var bitwig = {
  primaryDevice: null,
  cursorTrack: null,
  cursorDevice: null
};

function init() {
    var mo = host.getMidiOutPort(0);

    var mi = host.getMidiInPort(0);
    mi.setMidiCallback(onMidi);
    mi.setSysexCallback(onSysex);

    // channels 1, 2, and 10 for the Arturia Beatstep Pro's sequencers
    mi.createNoteInput("s1", "?0????").setShouldConsumeEvents(false);
    mi.createNoteInput("s2", "?1????").setShouldConsumeEvents(false);
    mi.createNoteInput("drum", "?9????").setShouldConsumeEvents(false);

    bitwig.primaryDevice = host.createArrangerCursorTrack(2, 0).getPrimaryDevice();
  
    for (var i = 0; i < 8; i++) {
        var deviceParam = bitwig.primaryDevice.getParameter(i);
        deviceParam.setIndication(true);

        var macro = bitwig.primaryDevice.getMacro(i).getAmount();
        macro.setIndication(true);
    }

    bitwig.cursorTrack = host.createArrangerCursorTrack(8, 8);
    bitwig.cursorDevice = host.createEditorCursorDevice();
    bitwig.deviceBrowser = bitwig.cursorDevice.createDeviceBrowser(8,8);
    
    println("done init");
}

function onMidi(status, data1, data2) {
   var command = status & 0xf0;
   var channel = (status & 0x0f) + 1;
   //println("channel=" + channel + ", command=" + command + ", data1=" + data1 + ", data2=" + data2);

   if (status == 146) {
      switch (data1) {
        case 44:
          doActionOnGateOpen(data2, function() {
            bitwig.cursorTrack.getArm().toggle();
          });
          break;
        case 45:
          doActionOnGateOpen(data2, function() {
            bitwig.cursorTrack.getSolo().toggle(false);
          });
          break;
        case 46:
          doActionOnGateOpen(data2, function() {
            bitwig.cursorTrack.getMute().toggle();
          });
          break;
        case 36:
          doActionOnGateOpen(data2, function() {
            bitwig.cursorTrack.getVolume().inc(-5, 128);
          });
          break;
        case 37:
          doActionOnGateOpen(data2, function() {
            bitwig.cursorTrack.getVolume().inc(5, 128);
          });
          break;
        default:
          break;
      }
   }

   if (status == 178) { // expect messages in control mode to come over channel 3
     var encoderCCIdx = bsp.encoderCCs.indexOf(data1);

     if (encoderCCIdx != -1) {
         if (encoderCCIdx < 8) {
             handleEncoderChange(data2, bitwig.cursorDevice.getParameter(encoderCCIdx));
         } else {
             handleEncoderChange(data2, bitwig.cursorDevice.getMacro(encoderCCIdx - 8).getAmount());
         }
     } else {
        switch (data1) {
          case 20:
            doActionOnGateOpen(data2, function() {
              bitwig.cursorTrack.selectPrevious();
            });
            break;
          case 21:
            doActionOnGateOpen(data2, function() {
              bitwig.cursorTrack.selectNext();
            });
            break;
          case 22:
            doActionOnGateOpen(data2, function() {
              bitwig.cursorDevice.selectPrevious();
            });
            break;
          case 23:
            doActionOnGateOpen(data2, function() {
              bitwig.cursorDevice.selectNext();
            });
            break;
          case 24:
            doActionOnGateOpen(data2, function() {
              bitwig.deviceBrowser.startBrowsing();
              bitwig.cursorBrowingSession = bitwig.deviceBrowser.createCursorSession();
            });
            break;
          case 25:
            doActionOnGateOpen(data2, function() {
              bitwig.deviceBrowser.commitSelectedResult();
            });
            break;
          case 26:
            doActionOnGateOpen(data2, function() {
              bitwig.cursorBrowingSession.getCursorResult().selectPrevious();
            });
            break;
          case 27:
            doActionOnGateOpen(data2, function() {
              bitwig.cursorBrowingSession.getCursorResult().selectNext();
            });
            break;
          case 28:
            doActionOnGateOpen(data2, function() {
              bitwig.cursorDevice.toggleEnabledState();
            });
            break;
          default:
            break;
        }
     }
   }
}

function doActionOnGateOpen(data2, f) {
  if (data2 > 0) {
    f();
  }
}

function handleEncoderChange(value, paramOrMacro) {
    if (value == 64) { return; }
    // -1 for knob turn left, +1 for knob turn right
    paramOrMacro.inc(value - 64, 128);
}

function onSysex(sysex) { }

function exit() { }


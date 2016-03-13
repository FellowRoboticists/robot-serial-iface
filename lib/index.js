module.exports = (() => {
  const util = require('util');
  const SerialPort = require("serialport").SerialPort;
  const EventEmitter = require('events');
  const parser = require('packet-buffer-parser');

  const RobotSerialInterface = function() {
    EventEmitter.call(this);
  };

  // Set the interface to become an EventEmitter
  util.inherits(RobotSerialInterface, EventEmitter);

  // Add the necessary methods to the serial interface
  RobotSerialInterface.prototype.start = function(serialPort, serialOptions, sensorValueTypes, initializer) {
    this.__initializer = initializer;
    this.__sensorValueTypes = sensorValueTypes;
    this.__initSerial(serialPort, serialOptions);
  };

  RobotSerialInterface.prototype.__initSerial = function(serialPort, serialOptions) {
    this.serial = new SerialPort(serialPort, serialOptions);
    var rsi = this; // Alias for below

    this.serial.on('open', function() {
      console.log("Serial Port opened successfully");
      if (rsi.__initializer) {
        rsi.__initializer(rsi.serial);
      }
    });

    this.serial.on('error', function(err) {
      console.error("Error opening serial port: %j", err);
    });

    this.serial.on('close', function() {
      console.log("Serial Port closed");
    });

    this.serial.on('data', function(data) {
      var sensorValues = parser.parseAndExtract(data, rsi.__sensorValueTypes);
      while (sensorValues) {
      // if (!sensorValues) { return } // Nothing to do

        // Got some values: emit events for each of them
        for (var i=0; i<sensorValues.length; i++) {
          rsi.emit(sensorValues[i].name, sensorValues[i].value);
        }

        // See if there's more of the current buffer to process
        sensorValues = parser.parseAndExtract(null, rsi.__sensorValueTypes);
      }
    });
  };

  RobotSerialInterface.prototype.sendCommand = function(cmd, payload) {
    if (typeof payload === "undefined") {
      this.serial.write(new Buffer([cmd]));
    } else {
      this.serial.write(new Buffer([cmd].concat(payload)));
    }
    this.serial.flush();
  };

  var mod = {
    RobotSerialInterface: RobotSerialInterface
  };

  return mod;

}());
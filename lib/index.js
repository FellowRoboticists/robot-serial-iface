'use strict'

module.exports = (function () {
  const util = require('util')
  const SerialPort = require('serialport').SerialPort
  const EventEmitter = require('events')
  const parser = require('packet-buffer-parser')

  const RobotSerialInterface = function () {
    EventEmitter.call(this)
  }

  // Set the interface to become an EventEmitter
  util.inherits(RobotSerialInterface, EventEmitter)

  // Add the necessary methods to the serial interface
  RobotSerialInterface.prototype.start = function (serialPort, serialOptions, sensorValueTypes, initializer) {
    this.__initializer = initializer
    this.__sensorValueTypes = sensorValueTypes
    this.__initSerial(serialPort, serialOptions)
  }

  RobotSerialInterface.prototype.__meetsThreshold = function (sensorName, value) {
    let sensorType = null
    for (let i = 0; i < this.__sensorValueTypes.length; i++) {
      if (this.__sensorValueTypes[i].name === sensorName) {
        sensorType = this.__sensorValueTypes[i]
        break
      }
    }

    if (!sensorType || !sensorType.meetsThreshold) return true

    return sensorType.meetsThreshold(value)
  }

  RobotSerialInterface.prototype.__initSerial = function (serialPort, serialOptions) {
    this.serial = new SerialPort(serialPort, serialOptions)
    let rsi = this // Alias for below

    this.serial.on('open', function () {
      console.log('Serial Port opened successfully')
      if (rsi.__initializer) {
        rsi.__initializer(rsi)
      } else {
        rsi.ready()
      }
    })

    this.serial.on('error', function (err) {
      console.error('Error opening serial port: %j', err)
    })

    this.serial.on('close', function () {
      console.log('Serial Port closed')
    })

    this.serial.on('data', function (data) {
      let sensorValues = parser.parseAndExtract(data, rsi.__sensorValueTypes)
      while (sensorValues) {
        // Got some values: emit events for each of them
        for (let i = 0; i < sensorValues.length; i++) {
          if (rsi.__meetsThreshold(sensorValues[i].name, sensorValues[i].value)) {
            rsi.emit(sensorValues[i].name, sensorValues[i].value)
          }
        }

        // See if there's more of the current buffer to process
        sensorValues = parser.parseAndExtract(null, rsi.__sensorValueTypes)
      }
    })
  }

  RobotSerialInterface.prototype.sendCommand = function (cmd, payload) {
    if (typeof payload === 'undefined') {
      this.serial.write(new Buffer([cmd]))
    } else {
      this.serial.write(new Buffer([cmd].concat(payload)))
    }
    this.serial.flush()
  }

  /**
   * Returned promise is resolved after waiting the
   * specified amount of time.
   */
  RobotSerialInterface.prototype.wait = function (ms) {
    return new Promise((resolve, reject) => setTimeout(resolve, ms))
  }

  RobotSerialInterface.prototype.ready = function () {
    this.emit('ready')
  }

  var mod = {
    RobotSerialInterface: RobotSerialInterface
  }

  return mod
}())

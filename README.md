robot-serial-iface
==================

This library is an attempt to create a serial interface that can be used
to send and receive communications to/from an iRobot Create and an Arduino-based
robot.

The primary element of the interface is an object that provides an EventEmitter
interface for receipt of messages from the robot and a 'sendCommand()' function
to send commands to the robot.

The events supported by the interface are determined by the user of the interface
rather than being predefined by the interface. This is important when attempting
to use the same interface code for both the Create and Arduino robots.

See the 'packet-buffer-parser' library for the format of the sensor packet 
values.

Usage
-----

When interfacing to an Arduino-based robot:

    const RobotSerialInterface = require('robot-serial-iface').RobotSerialInterface;

    const SENSORS = [
      {
        name: 'temperature',
        startByte: 0x03,
        numBytes: 2
        // No thresold function, so all events
        // are emitted
      },
      {
        name: 'humidity',
        startByte: 0x02,
        numBytes: 2,
        // Emit events for a humidity value
        // less than 50
        meetsThreshold: (value) => value < 50
      }
    ];

    var robot = new RobotSerialInterface();

    robot.start(SERIAL_PORT, SERIAL_OPTIONS, SENSORS);

    robot.on('temperature', function(temp) {
      console.log("Temperature: %d", temp);
    });

    robot.on('humidity', function(hum) {
      console.log("Humidity: %d", hum);
    });

The primary difference between interfacing with an Arduino-based
robot and an iRobot Create is that one would pass a function as 
the third parameter of the 'robot.start(...)' method. This function
will be invoked to specify the initialization commands to the Create.

Copyright
=========

Copyright (c) 2016 Naive Roboticist

See LICENSE.txt for details.

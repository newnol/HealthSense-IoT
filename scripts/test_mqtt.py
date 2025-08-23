#!/usr/bin/env python3
"""
MQTT Test Script for HiveMQ integration
This script tests both subscription and publishing to verify MQTT functionality
"""

import time
import ssl
import paho.mqtt.client as mqtt
import logging
import random

# Configure logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MQTT Configuration
MQTT_BROKER = "70030b8b8dc741c79d6ab7ffa586f461.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USERNAME = "phamngocthai"
MQTT_PASSWORD = "Thai2005"
TEST_DEVICE_ID = f"test_device_{random.randint(1000, 9999)}"

# Global flags
connected = False
message_received = False
received_messages = []

def on_connect(client, userdata, flags, rc):
    """Callback when client connects to the broker"""
    global connected
    if rc == 0:
        logger.info(f"Connected successfully to {MQTT_BROKER}")
        connected = True
        # Subscribe to our test device topic
        client.subscribe(TEST_DEVICE_ID, qos=1)
        logger.info(f"Subscribed to topic: {TEST_DEVICE_ID}")
    else:
        logger.error(f"Connection failed with code {rc}")

def on_disconnect(client, userdata, rc):
    """Callback when client disconnects"""
    global connected
    connected = False
    if rc != 0:
        logger.warning(f"Unexpected disconnect with code {rc}")
    else:
        logger.info("Disconnected from broker")

def on_message(client, userdata, message):
    """Callback when message is received"""
    global message_received, received_messages
    payload = message.payload.decode()
    logger.info(f"Message received on topic {message.topic}: {payload}")
    received_messages.append({
        "topic": message.topic,
        "payload": payload,
        "qos": message.qos,
        "timestamp": time.time()
    })
    message_received = True

def on_publish(client, userdata, mid):
    """Callback when message is published"""
    logger.info(f"Message published successfully, mid: {mid}")

def on_subscribe(client, userdata, mid, granted_qos):
    """Callback when subscription is confirmed"""
    logger.info(f"Subscription confirmed, mid: {mid}, QoS: {granted_qos}")

def create_client():
    """Create and configure MQTT client"""
    client = mqtt.Client(protocol=mqtt.MQTTv311)
    
    # Configure TLS
    context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
    context.check_hostname = False
    context.verify_mode = ssl.CERT_REQUIRED
    client.tls_set_context(context)
    
    # Set credentials
    if MQTT_USERNAME and MQTT_PASSWORD:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    
    # Set callbacks
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    client.on_publish = on_publish
    client.on_subscribe = on_subscribe
    
    return client

def main():
    """Main test function"""
    logger.info("Starting MQTT test...")
    
    # Create and connect client
    client = create_client()
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
    
    # Wait for connection
    timeout = 5
    start = time.time()
    while not connected and time.time() - start < timeout:
        time.sleep(0.1)
    
    if not connected:
        logger.error("Failed to connect within timeout period")
        client.loop_stop()
        client.disconnect()
        return
    
    try:
        # Test publish
        current_timestamp = int(time.time() * 1000)
        message = str(current_timestamp)
        logger.info(f"Publishing to topic {TEST_DEVICE_ID}: {message}")
        
        result = client.publish(TEST_DEVICE_ID, message, qos=1)
        if result.rc != mqtt.MQTT_ERR_SUCCESS:
            logger.error(f"Failed to publish message, rc: {result.rc}")
        
        # Wait for message to be received (should be received by our own subscription)
        timeout = 5
        start = time.time()
        while not message_received and time.time() - start < timeout:
            time.sleep(0.1)
        
        if message_received:
            logger.info("✓ Successfully published and received message")
        else:
            logger.warning("✗ Message not received within timeout period")
            
        # Test multiple messages
        logger.info("Testing multiple messages...")
        for i in range(3):
            test_message = f"Test message {i+1}"
            logger.info(f"Publishing: {test_message}")
            client.publish(TEST_DEVICE_ID, test_message, qos=1)
            time.sleep(1)
            
        # Wait for all messages
        time.sleep(3)
        
        logger.info(f"Received {len(received_messages)} messages in total:")
        for idx, msg in enumerate(received_messages):
            logger.info(f"  {idx+1}. Topic: {msg['topic']}, Message: {msg['payload']}")
            
        logger.info("MQTT test completed successfully!")
        
    finally:
        # Clean up
        client.loop_stop()
        client.disconnect()
        logger.info("MQTT client disconnected")

if __name__ == "__main__":
    main()

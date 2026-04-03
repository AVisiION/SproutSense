import React, { useState } from 'react';
import './BleProvisioning.css';

const PROV_SERVICE_UUID     = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const PROV_CHAR_SSID_UUID   = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const PROV_CHAR_PASS_UUID   = '1cce1ea8-bd34-4813-a00a-c676ef9d107b';
const PROV_CHAR_STATUS_UUID = '190bf8c3-3765-4f32-bbec-9dcd61a6b0c2';

export default function BleProvisioning() {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);

  const startProvisioning = async () => {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    
    if (!ssid || !password) {
      alert('Please enter both SSID and Password.');
      return;
    }

    setIsProvisioning(true);
    setStatus('Requesting Bluetooth Device...');

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [PROV_SERVICE_UUID] }],
        optionalServices: [PROV_SERVICE_UUID]
      });

      setStatus('Connecting to GATT Server...');
      const server = await device.gatt.connect();
      setDeviceConnected(true);

      setStatus('Getting Service...');
      const service = await server.getPrimaryService(PROV_SERVICE_UUID);

      setStatus('Getting Characteristics...');
      const ssidChar = await service.getCharacteristic(PROV_CHAR_SSID_UUID);
      const passChar = await service.getCharacteristic(PROV_CHAR_PASS_UUID);
      const statusChar = await service.getCharacteristic(PROV_CHAR_STATUS_UUID);

      setStatus('Writing SSID...');
      await ssidChar.writeValue(new TextEncoder().encode(ssid));

      setStatus('Writing Password...');
      await passChar.writeValue(new TextEncoder().encode(password));

      setStatus('Waiting for device connection status...');
      
      // Start listening for notifications on the status characteristic
      await statusChar.startNotifications();
      statusChar.addEventListener('characteristicvaluechanged', (event) => {
        const value = new TextDecoder().decode(event.target.value);
        setStatus(`Device Status: ${value}`);
        if (value === 'CONNECTED') {
          setStatus('Provisioning Successful! Device is connected to WiFi.');
          setTimeout(() => {
            device.gatt.disconnect();
            setDeviceConnected(false);
            setIsProvisioning(false);
          }, 3000);
        }
      });
      
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
      setIsProvisioning(false);
      setDeviceConnected(false);
    }
  };

  return (
    <div className="ble-provisioning-container">
      <h3>Bluetooth Device Provisioning</h3>
      <p className="help-text">
        If your device cannot connect to WiFi, put it in provisioning mode and use Bluetooth to send new credentials.
      </p>

      <div className="form-group">
        <label>WiFi SSID</label>
        <input 
          type="text" 
          value={ssid} 
          onChange={(e) => setSsid(e.target.value)} 
          placeholder="Network Name"
          disabled={isProvisioning} 
        />
      </div>

      <div className="form-group">
        <label>WiFi Password</label>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Network Password"
          disabled={isProvisioning} 
        />
      </div>

      <button 
        className="btn-primary btn-provision" 
        onClick={startProvisioning} 
        disabled={isProvisioning}
      >
        {isProvisioning ? 'Provisioning...' : 'Provision via Bluetooth'}
      </button>

      {status && (
        <div className={`status-message ${deviceConnected ? 'active' : ''}`}>
          {status}
        </div>
      )}
    </div>
  );
}
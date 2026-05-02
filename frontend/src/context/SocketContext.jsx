import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { socketUrl } from '../config';

const SocketContext = createContext();
const HARDWARE_OFFLINE_THRESHOLD_MS = 15000;

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [alerts, setAlerts] = useState([]);
  const [locations, setLocations] = useState({});
  const [helmetFeed, setHelmetFeed] = useState([]);
  const [lastTelemetryAt, setLastTelemetryAt] = useState(null);
  const [lastHeartbeat, setLastHeartbeat] = useState(null);
  const [hardwareStatus, setHardwareStatus] = useState('NO_DATA');

  useEffect(() => {
    const updateHardwareStatus = () => {
      if (!lastTelemetryAt) {
        setHardwareStatus('NO_DATA');
        return;
      }

      const age = Date.now() - new Date(lastTelemetryAt).getTime();
      setHardwareStatus(age <= HARDWARE_OFFLINE_THRESHOLD_MS ? 'CONNECTED' : 'DISCONNECTED');
    };

    updateHardwareStatus();
    const interval = window.setInterval(updateHardwareStatus, 1000);
    return () => window.clearInterval(interval);
  }, [lastTelemetryAt]);

  useEffect(() => {
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnectionStatus('ONLINE');
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection failed:', error.message);
      setConnectionStatus('DEGRADED');
    });

    newSocket.on('helmet-update', (data) => {
      setLiveData(data);
      setLastTelemetryAt(data?.timestamp || new Date().toISOString());
    });

    newSocket.on('helmet:update', ({ record }) => {
      setLiveData(record);
      setLastTelemetryAt(record?.timestamp || new Date().toISOString());
      setLastHeartbeat({
        helmet_id: record?.helmet_id,
        timestamp: record?.timestamp || new Date().toISOString(),
        communication_mode: record?.communication_mode || 'HTTP',
      });
      setHelmetFeed((current) => [record, ...current.filter((item) => item.helmet_id !== record.helmet_id)].slice(0, 10));
    });

    newSocket.on('helmet:heartbeat', (heartbeat) => {
      setLastTelemetryAt(heartbeat?.timestamp || new Date().toISOString());
      setLastHeartbeat(heartbeat || null);
    });

    newSocket.on('alert:new', (alert) => {
      setAlerts((current) => [alert, ...current].slice(0, 20));
    });

    newSocket.on('helmet:location', (location) => {
      setLocations((current) => ({
        ...current,
        [location.helmet_id]: location,
      }));
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('OFFLINE');
    });

    return () => newSocket.close();
  }, []);

  const value = useMemo(
    () => ({
      socket,
      liveData,
      connectionStatus,
      hardwareStatus,
      lastTelemetryAt,
      lastHeartbeat,
      alerts,
      locations,
      helmetFeed,
    }),
    [alerts, connectionStatus, hardwareStatus, helmetFeed, lastHeartbeat, lastTelemetryAt, liveData, locations, socket]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

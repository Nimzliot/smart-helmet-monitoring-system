import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { socketUrl } from '../config';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [alerts, setAlerts] = useState([]);
  const [locations, setLocations] = useState({});
  const [helmetFeed, setHelmetFeed] = useState([]);

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
    });

    newSocket.on('helmet:update', ({ record }) => {
      setLiveData(record);
      setHelmetFeed((current) => [record, ...current.filter((item) => item.helmet_id !== record.helmet_id)].slice(0, 10));
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
      alerts,
      locations,
      helmetFeed,
    }),
    [alerts, connectionStatus, helmetFeed, liveData, locations, socket]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

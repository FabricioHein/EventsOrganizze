import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getEvents, getPayments, getClients, getProducts } from '../services/firebaseService';
import { Event, Payment, Client, Product } from '../types';

interface DataContextType {
  events: Event[];
  payments: Payment[];
  clients: Client[];
  products: Product[];
  loading: boolean;
  refreshData: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  refreshPayments: () => Promise<void>;
  refreshClients: () => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshEvents = async () => {
    if (!user) return;
    try {
      const eventsData = await getEvents(user.uid);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const refreshPayments = async () => {
    if (!user) return;
    try {
      const paymentsData = await getPayments(user.uid);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const refreshClients = async () => {
    if (!user) return;
    try {
      const clientsData = await getClients(user.uid);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const refreshProducts = async () => {
    if (!user) return;
    try {
      const productsData = await getProducts(user.uid);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const refreshData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await Promise.all([
        refreshEvents(),
        refreshPayments(),
        refreshClients(),
        refreshProducts(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setEvents([]);
      setPayments([]);
      setClients([]);
      setProducts([]);
      setLoading(false);
    }
  }, [user]);

  const value = {
    events,
    payments,
    clients,
    products,
    loading,
    refreshData,
    refreshEvents,
    refreshPayments,
    refreshClients,
    refreshProducts,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
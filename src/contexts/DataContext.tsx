import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getEvents, getPayments, getClients, getProducts, getGuests } from '../services/firebaseService';
import { Event, Payment, Client, Product, Guest } from '../types';
import { useToast } from '../contexts/ToastContext';

interface DataContextType {
  events: Event[];
  payments: Payment[];
  clients: Client[];
  products: Product[];
  guests: Guest[];
  loading: boolean;
  refreshData: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  refreshPayments: () => Promise<void>;
  refreshClients: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshGuests: () => Promise<void>;
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
  const { showToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshEvents = async () => {
    if (!user) return;
    try {
      const eventsData = await getEvents(user.uid);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      showToast({
        type: 'error',
        title: 'Erro ao carregar eventos',
        message: 'Não foi possível carregar os eventos. Tente novamente.'
      });
    }
  };

  const refreshPayments = async () => {
    if (!user) return;
    try {
      const paymentsData = await getPayments(user.uid);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      showToast({
        type: 'error',
        title: 'Erro ao carregar pagamentos',
        message: 'Não foi possível carregar os pagamentos. Tente novamente.'
      });
    }
  };

  const refreshClients = async () => {
    if (!user) return;
    try {
      const clientsData = await getClients(user.uid);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      showToast({
        type: 'error',
        title: 'Erro ao carregar clientes',
        message: 'Não foi possível carregar os clientes. Tente novamente.'
      });
    }
  };

  const refreshProducts = async () => {
    if (!user) return;
    try {
      const productsData = await getProducts(user.uid);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast({
        type: 'error',
        title: 'Erro ao carregar produtos',
        message: 'Não foi possível carregar os produtos. Tente novamente.'
      });
    }
  };

  const refreshGuests = async () => {
    if (!user) return;
    try {
      const guestsData = await getGuests(user.uid);
      setGuests(guestsData);
    } catch (error) {
      console.error('Error fetching guests:', error);
      showToast({
        type: 'error',
        title: 'Erro ao carregar convidados',
        message: 'Não foi possível carregar os convidados. Tente novamente.'
      });
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
        refreshGuests(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast({
        type: 'error',
        title: 'Erro ao sincronizar dados',
        message: 'Não foi possível sincronizar todos os dados. Tente novamente.'
      });
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
      setGuests([]);
      setLoading(false);
    }
  }, [user]);

  const value = {
    events,
    payments,
    clients,
    products,
    guests,
    loading,
    refreshData,
    refreshEvents,
    refreshPayments,
    refreshClients,
    refreshProducts,
    refreshGuests,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
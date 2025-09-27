import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  Timestamp,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db } from '../lib/firebase';
import { Client, Event, Payment, Product, EventProduct, Supplier, EventSupplier, Proposal, EventTimeline, UserSubscription, UserProfile, AdminStats, Guest } from '../types';

const storage = getStorage();

// Admin Functions
export const getAllUsers = async (): Promise<UserProfile[]> => {
  const q = query(
    collection(db, 'users'),
    where('role', '!=', 'master'),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  
  const users = await Promise.all(
    querySnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();
      
      // Get user subscription
      const subscriptionQuery = query(
        collection(db, 'subscriptions'),
        where('userId', '==', userDoc.id),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const subscriptionSnapshot = await getDocs(subscriptionQuery);
      let subscription = null;
      
      if (!subscriptionSnapshot.empty) {
        const subData = subscriptionSnapshot.docs[0].data();
        subscription = {
          id: subscriptionSnapshot.docs[0].id,
          ...subData,
          startDate: subData.startDate.toDate(),
          endDate: subData.endDate.toDate(),
          createdAt: subData.createdAt.toDate(),
        } as UserSubscription;
      }
      
      return {
        uid: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        role: userData.role,
        createdAt: userData.createdAt.toDate(),
        lastLogin: userData.lastLogin.toDate(),
        subscription,
      } as UserProfile;
    })
  );
  
  return users;
};

export const getAdminStats = async (): Promise<AdminStats> => {
  const usersQuery = query(collection(db, 'users'));
  const usersSnapshot = await getDocs(usersQuery);
  
  const subscriptionsQuery = query(collection(db, 'subscriptions'));
  const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
  
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  let totalUsers = 0;
  let newUsersLast7Days = 0;
  let activeSubscriptions = 0;
  let expiredSubscriptions = 0;
  let trialUsers = 0;
  let totalRevenue = 0;
  
  // Count users
  usersSnapshot.docs.forEach(doc => {
    const userData = doc.data();
    totalUsers++;
    if (userData.createdAt.toDate() >= sevenDaysAgo) {
      newUsersLast7Days++;
    }
  });
  
  // Count subscriptions
  subscriptionsSnapshot.docs.forEach(doc => {
    const subData = doc.data();
    const endDate = subData.endDate.toDate();
    
    if (subData.plan === 'free') {
      trialUsers++;
    } else if (endDate > now && subData.status === 'active') {
      activeSubscriptions++;
      // Calculate revenue (assuming monthly billing)
      const planPrices = { basic: 99, professional: 149, premium: 199 };
      totalRevenue += planPrices[subData.plan as keyof typeof planPrices] || 0;
    } else {
      expiredSubscriptions++;
    }
  });
  
  return {
    totalUsers,
    activeSubscriptions,
    expiredSubscriptions,
    trialUsers,
    newUsersLast7Days,
    totalRevenue,
  };
};

export const updateUserRole = async (userId: string, role: 'master' | 'normal') => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { role });
};

// User Management Functions
export const updateUserStatus = async (userId: string, isActive: boolean) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { 
    isActive,
    updatedAt: Timestamp.now()
  });
};

export const updateUserPlan = async (userId: string, plan: 'free' | 'basic' | 'professional' | 'premium') => {
  const subscriptionRef = doc(db, 'subscriptions', userId);
  
  // Calculate new end date based on plan
  const now = new Date();
  const endDate = new Date();
  
  if (plan === 'free') {
    endDate.setDate(now.getDate() + 7); // 7 days for free trial
  } else {
    endDate.setMonth(now.getMonth() + 1); // 1 month for paid plans
  }
  
  const subscriptionData = {
    userId,
    plan,
    status: 'active' as const,
    cycle: 'monthly' as const,
    startDate: Timestamp.now(),
    endDate: Timestamp.fromDate(endDate),
    updatedAt: Timestamp.now(),
  };
  
  // Check if subscription exists
  const subscriptionDoc = await getDoc(subscriptionRef);
  
  if (subscriptionDoc.exists()) {
    await updateDoc(subscriptionRef, subscriptionData);
  } else {
    await addDoc(collection(db, 'subscriptions'), {
      ...subscriptionData,
      createdAt: Timestamp.now(),
    });
  }
};

export const updateSubscriptionEndDate = async (userId: string, endDate: Date) => {
  const subscriptionRef = doc(db, 'subscriptions', userId);
  await updateDoc(subscriptionRef, {
    endDate: Timestamp.fromDate(endDate),
    updatedAt: Timestamp.now(),
  });
};
// Clients
export const addClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'clients'), {
    ...client,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getClients = async (userId: string): Promise<Client[]> => {
  const q = query(
    collection(db, 'clients'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as Client[];
};

export const updateClient = async (id: string, client: Partial<Client>) => {
  const docRef = doc(db, 'clients', id);
  await updateDoc(docRef, client);
};

export const deleteClient = async (id: string) => {
  await deleteDoc(doc(db, 'clients', id));
};

// Events
export const addEvent = async (event: Omit<Event, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'events'), {
    ...event,
    date: Timestamp.fromDate(event.date),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getEvents = async (userId: string): Promise<Event[]> => {
  const q = query(
    collection(db, 'events'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate(),
    createdAt: doc.data().createdAt.toDate(),
  })) as Event[];
};

export const updateEvent = async (id: string, event: Partial<Event>) => {
  const docRef = doc(db, 'events', id);
  const updateData: any = { ...event };
  if (event.date) {
    updateData.date = Timestamp.fromDate(event.date);
  }
  await updateDoc(docRef, updateData);
};

export const deleteEvent = async (id: string) => {
  // First, get all payments for this event
  const paymentsQuery = query(
    collection(db, 'payments'),
    where('eventId', '==', id)
  );
  const paymentsSnapshot = await getDocs(paymentsQuery);
  
  // Delete all related payments first
  const batch = writeBatch(db);
  paymentsSnapshot.docs.forEach(paymentDoc => {
    batch.delete(paymentDoc.ref);
  });
  
  // Delete the event
  batch.delete(doc(db, 'events', id));
  
  // Commit all deletions
  await batch.commit();
  
  return paymentsSnapshot.docs.length; // Return number of deleted payments
};

// Payments
export const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'payments'), {
    ...payment,
    paymentDate: Timestamp.fromDate(payment.paymentDate),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getPayments = async (userId: string): Promise<Payment[]> => {
  const q = query(
    collection(db, 'payments'),
    where('userId', '==', userId),
    orderBy('paymentDate', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    paymentDate: doc.data().paymentDate.toDate(),
    createdAt: doc.data().createdAt.toDate(),
  })) as Payment[];
};

export const updatePayment = async (id: string, payment: Partial<Payment>) => {
  const docRef = doc(db, 'payments', id);
  const updateData: any = { ...payment };
  if (payment.paymentDate) {
    updateData.paymentDate = Timestamp.fromDate(payment.paymentDate);
  }
  await updateDoc(docRef, updateData);
};

export const deletePayment = async (id: string) => {
  await deleteDoc(doc(db, 'payments', id));
};

// Payment Installments
export const addPaymentInstallments = async (
  eventId: string,
  eventName: string,
  userId: string,
  installments: Array<{
    amount: number;
    paymentDate: Date;
    method: string;
    notes?: string;
    received: boolean;
  }>
) => {
  const batch = writeBatch(db);
  const installmentGroup = crypto.randomUUID();
  
  installments.forEach((installment, index) => {
    const paymentRef = doc(collection(db, 'payments'));
    batch.set(paymentRef, {
      eventId,
      eventName,
      amount: installment.amount,
      paymentDate: Timestamp.fromDate(installment.paymentDate),
      method: installment.method,
      notes: installment.notes || '',
      received: installment.received,
      installmentNumber: index + 1,
      totalInstallments: installments.length,
      installmentGroup,
      userId,
      createdAt: Timestamp.now(),
    });
  });
  
  await batch.commit();
};

export const getPaymentsByMonth = async (userId: string, year: number, month: number): Promise<Payment[]> => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const q = query(
    collection(db, 'payments'),
    where('userId', '==', userId),
    where('paymentDate', '>=', Timestamp.fromDate(startDate)),
    where('paymentDate', '<=', Timestamp.fromDate(endDate)),
    orderBy('paymentDate', 'asc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    paymentDate: doc.data().paymentDate.toDate(),
    createdAt: doc.data().createdAt.toDate(),
  })) as Payment[];
};

// Contract Management
export const uploadContract = async (eventId: string, file: File) => {
  const fileName = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `contracts/${eventId}/${fileName}`);
  
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  
  return { url, fileName };
};

export const deleteContract = async (eventId: string, fileName: string) => {
  const storageRef = ref(storage, `contracts/${eventId}/${fileName}`);
  await deleteObject(storageRef);
};

// Suppliers
export const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'suppliers'), {
    ...supplier,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getSuppliers = async (userId: string): Promise<Supplier[]> => {
  const q = query(
    collection(db, 'suppliers'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as Supplier[];
};

export const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
  const docRef = doc(db, 'suppliers', id);
  await updateDoc(docRef, supplier);
};

export const deleteSupplier = async (id: string) => {
  await deleteDoc(doc(db, 'suppliers', id));
};

// Event Suppliers
export const addEventSupplier = async (eventSupplier: Omit<EventSupplier, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'eventSuppliers'), {
    ...eventSupplier,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getEventSuppliers = async (eventId: string): Promise<EventSupplier[]> => {
  const q = query(
    collection(db, 'eventSuppliers'),
    where('eventId', '==', eventId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as EventSupplier[];
};

export const deleteEventSupplier = async (id: string) => {
  await deleteDoc(doc(db, 'eventSuppliers', id));
};

// Proposals
export const addProposal = async (proposal: Omit<Proposal, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'proposals'), {
    ...proposal,
    validUntil: Timestamp.fromDate(proposal.validUntil),
    sentAt: proposal.sentAt ? Timestamp.fromDate(proposal.sentAt) : null,
    viewedAt: proposal.viewedAt ? Timestamp.fromDate(proposal.viewedAt) : null,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getProposals = async (userId: string): Promise<Proposal[]> => {
  const q = query(
    collection(db, 'proposals'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      validUntil: data.validUntil.toDate(),
      sentAt: data.sentAt?.toDate(),
      viewedAt: data.viewedAt?.toDate(),
      createdAt: data.createdAt.toDate(),
    };
  }) as Proposal[];
};

export const updateProposal = async (id: string, proposal: Partial<Proposal>) => {
  const docRef = doc(db, 'proposals', id);
  const updateData: any = { ...proposal };
  if (proposal.validUntil) {
    updateData.validUntil = Timestamp.fromDate(proposal.validUntil);
  }
  if (proposal.sentAt) {
    updateData.sentAt = Timestamp.fromDate(proposal.sentAt);
  }
  if (proposal.viewedAt) {
    updateData.viewedAt = Timestamp.fromDate(proposal.viewedAt);
  }
  await updateDoc(docRef, updateData);
};

export const deleteProposal = async (id: string) => {
  await deleteDoc(doc(db, 'proposals', id));
};

// Event Timeline
export const addTimelineItem = async (timelineItem: Omit<EventTimeline, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'eventTimeline'), {
    ...timelineItem,
    date: Timestamp.fromDate(timelineItem.date),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getEventTimeline = async (eventId: string): Promise<EventTimeline[]> => {
  const q = query(
    collection(db, 'eventTimeline'),
    where('eventId', '==', eventId),
    orderBy('date', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate(),
    createdAt: doc.data().createdAt.toDate(),
  })) as EventTimeline[];
};

export const updateTimelineItem = async (id: string, item: Partial<EventTimeline>) => {
  const docRef = doc(db, 'eventTimeline', id);
  const updateData: any = { ...item };
  if (item.date) {
    updateData.date = Timestamp.fromDate(item.date);
  }
  await updateDoc(docRef, updateData);
};

export const deleteTimelineItem = async (id: string) => {
  await deleteDoc(doc(db, 'eventTimeline', id));
};

// User Subscription
export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
  const subscriptionDoc = await getDoc(doc(db, 'subscriptions', userId));
  if (!subscriptionDoc.exists()) return null;
  
  const data = subscriptionDoc.data();
  return {
    id: subscriptionDoc.id,
    ...data,
    startDate: data.startDate.toDate(),
    endDate: data.endDate.toDate(),
    createdAt: data.createdAt.toDate(),
  } as UserSubscription;
};

export const createSubscription = async (subscription: Omit<UserSubscription, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'subscriptions'), {
    ...subscription,
    startDate: Timestamp.fromDate(subscription.startDate),
    endDate: Timestamp.fromDate(subscription.endDate),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateSubscription = async (subscriptionId: string, updates: Partial<UserSubscription>) => {
  const docRef = doc(db, 'subscriptions', subscriptionId);
  const updateData: any = { ...updates };
  
  if (updates.startDate) {
    updateData.startDate = Timestamp.fromDate(updates.startDate);
  }
  if (updates.endDate) {
    updateData.endDate = Timestamp.fromDate(updates.endDate);
  }
  
  await updateDoc(docRef, updateData);
};

// Asaas Integration Functions
export const createAsaasCustomer = async (userId: string, userData: any) => {
  try {
    const customer = await asaasService.createCustomer({
      name: userData.displayName || userData.name,
      email: userData.email,
      phone: userData.phone,
      cpfCnpj: userData.cpfCnpj,
    });
    
    // Save Asaas customer ID to user profile
    await updateDoc(doc(db, 'users', userId), {
      asaasCustomerId: customer.id
    });
    
    return customer;
  } catch (error) {
    console.error('Error creating Asaas customer:', error);
    throw error;
  }
};

export const createAsaasSubscription = async (
  userId: string, 
  planId: string, 
  cycle: 'monthly' | 'yearly',
  paymentData: any
) => {
  try {
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    if (!userData) throw new Error('User not found');
    
    // Create or get Asaas customer
    let asaasCustomerId = userData.asaasCustomerId;
    if (!asaasCustomerId) {
      const customer = await createAsaasCustomer(userId, userData);
      asaasCustomerId = customer.id;
    }
    
    // Get plan configuration
    const planConfig = asaasService.getPlanConfig(planId);
    if (!planConfig) throw new Error('Invalid plan');
    
    // Calculate value based on cycle
    const value = cycle === 'yearly' ? planConfig.value * 10 : planConfig.value; // 2 months free for yearly
    
    // Create subscription in Asaas
    const subscription = await asaasService.createSubscription({
      customer: asaasCustomerId,
      billingType: paymentData.billingType,
      value,
      nextDueDate: new Date().toISOString().split('T')[0],
      cycle: cycle === 'monthly' ? 'MONTHLY' : 'YEARLY',
      description: `${planConfig.name} - ${cycle === 'monthly' ? 'Mensal' : 'Anual'}`,
      creditCard: paymentData.creditCard,
      creditCardHolderInfo: paymentData.creditCardHolderInfo,
    });
    
    // Create subscription in Firestore
    const endDate = new Date();
    if (cycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    
    const subscriptionId = await createSubscription({
      userId,
      plan: planId as any,
      status: 'active',
      cycle,
      startDate: new Date(),
      endDate,
      asaasCustomerId,
      asaasSubscriptionId: subscription.id,
    });
    
    return { subscriptionId, asaasSubscription: subscription };
  } catch (error) {
    console.error('Error creating Asaas subscription:', error);
    throw error;
  }
};

export const cancelAsaasSubscription = async (subscriptionId: string) => {
  try {
    // Get subscription from Firestore
    const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
    const subscriptionData = subscriptionDoc.data();
    
    if (!subscriptionData?.asaasSubscriptionId) {
      throw new Error('Asaas subscription ID not found');
    }
    
    // Cancel in Asaas
    await asaasService.cancelSubscription(subscriptionData.asaasSubscriptionId);
    
    // Update status in Firestore
    await updateSubscription(subscriptionId, {
      status: 'canceled'
    });
    
    return true;
  } catch (error) {
    console.error('Error canceling Asaas subscription:', error);
    throw error;
  }
};

export const handleAsaasWebhook = async (webhookData: AsaasWebhookEvent) => {
  try {
    const { event, payment } = webhookData;
    
    // Find subscription by Asaas subscription ID
    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('asaasSubscriptionId', '==', payment.subscription)
    );
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
    
    if (subscriptionsSnapshot.empty) {
      console.log('Subscription not found for webhook:', payment.subscription);
      return;
    }
    
    const subscriptionDoc = subscriptionsSnapshot.docs[0];
    const subscriptionData = subscriptionDoc.data();
    
    switch (event) {
      case 'PAYMENT_RECEIVED':
        // Payment successful - extend subscription
        const newEndDate = new Date(subscriptionData.endDate.toDate());
        if (subscriptionData.cycle === 'monthly') {
          newEndDate.setMonth(newEndDate.getMonth() + 1);
        } else {
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        }
        
        await updateSubscription(subscriptionDoc.id, {
          status: 'active',
          endDate: newEndDate
        });
        break;
        
      case 'PAYMENT_OVERDUE':
        // Payment overdue - mark as expired
        await updateSubscription(subscriptionDoc.id, {
          status: 'expired'
        });
        break;
        
      default:
        console.log('Unhandled webhook event:', event);
    }
  } catch (error) {
    console.error('Error handling Asaas webhook:', error);
    throw error;
  }
};

// Products
export const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'products'), {
    ...product,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getProducts = async (userId: string): Promise<Product[]> => {
  const q = query(
    collection(db, 'products'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as Product[];
};

export const updateProduct = async (id: string, product: Partial<Product>) => {
  const docRef = doc(db, 'products', id);
  await updateDoc(docRef, product);
};

export const deleteProduct = async (id: string) => {
  await deleteDoc(doc(db, 'products', id));
};

// Event Products
export const addEventProduct = async (eventProduct: Omit<EventProduct, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'eventProducts'), {
    ...eventProduct,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getEventProducts = async (eventId: string): Promise<EventProduct[]> => {
  const q = query(
    collection(db, 'eventProducts'),
    where('eventId', '==', eventId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as EventProduct[];
};

export const deleteEventProduct = async (id: string) => {
  await deleteDoc(doc(db, 'eventProducts', id));
};

// Client Photo Upload
export const uploadClientPhoto = async (clientId: string, file: File): Promise<string> => {
  const fileName = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `client-photos/${clientId}/${fileName}`);
  
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  
  return url;
};

// Guests
export const addGuest = async (guest: Omit<Guest, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'guests'), {
    ...guest,
    sentAt: guest.sentAt ? Timestamp.fromDate(guest.sentAt) : null,
    confirmedAt: guest.confirmedAt ? Timestamp.fromDate(guest.confirmedAt) : null,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getGuests = async (userId: string): Promise<Guest[]> => {
  const q = query(
    collection(db, 'guests'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      sentAt: data.sentAt?.toDate(),
      confirmedAt: data.confirmedAt?.toDate(),
      createdAt: data.createdAt.toDate(),
    };
  }) as Guest[];
};

export const getEventGuests = async (eventId: string): Promise<Guest[]> => {
  const q = query(
    collection(db, 'guests'),
    where('eventId', '==', eventId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      sentAt: data.sentAt?.toDate(),
      confirmedAt: data.confirmedAt?.toDate(),
      createdAt: data.createdAt.toDate(),
    };
  }) as Guest[];
};

export const updateGuest = async (id: string, guest: Partial<Guest>) => {
  const docRef = doc(db, 'guests', id);
  const updateData: any = { ...guest };
  if (guest.sentAt) {
    updateData.sentAt = Timestamp.fromDate(guest.sentAt);
  }
  if (guest.confirmedAt) {
    updateData.confirmedAt = Timestamp.fromDate(guest.confirmedAt);
  }
  await updateDoc(docRef, updateData);
};

export const deleteGuest = async (id: string) => {
  await deleteDoc(doc(db, 'guests', id));
};

export const addGuestsBatch = async (guests: Omit<Guest, 'id' | 'createdAt'>[]) => {
  const batch = writeBatch(db);
  
  guests.forEach((guest) => {
    const guestRef = doc(collection(db, 'guests'));
    batch.set(guestRef, {
      ...guest,
      sentAt: guest.sentAt ? Timestamp.fromDate(guest.sentAt) : null,
      confirmedAt: guest.confirmedAt ? Timestamp.fromDate(guest.confirmedAt) : null,
      createdAt: Timestamp.now(),
    });
  });
  
  await batch.commit();
};

export const sendGuestInvite = async (guestId: string, method: 'whatsapp' | 'email', customMessage?: string) => {
  // Get current guest data
  const guestDoc = await getDoc(doc(db, 'guests', guestId));
  const guest = guestDoc.data() as Guest;
  
  if (!guest) throw new Error('Guest not found');
  
  // Create invite history entry
  const historyEntry = {
    id: crypto.randomUUID(),
    method,
    message: customMessage || '',
    sentAt: new Date(),
    status: 'sent' as const
  };
  
  // Update guest with new status and history
  const updatedHistory = [...(guest.inviteHistory || []), historyEntry];
  
  await updateGuest(guestId, {
    status: 'sent',
    sentAt: new Date(),
    inviteHistory: updatedHistory
  });
  
  // Return the message/URL for the user to send manually
  
  if (method === 'whatsapp') {
    const message = customMessage || `Olá ${guest.name}! Você está convidado(a) para ${guest.eventName}. Confirme sua presença respondendo esta mensagem. Obrigado!`;
    const whatsappUrl = `https://wa.me/${guest.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    return { type: 'whatsapp', url: whatsappUrl, message };
  } else {
    const subject = customMessage ? `Convite para ${guest.eventName}` : `Convite para ${guest.eventName}`;
    const body = customMessage || `Olá ${guest.name}!\n\nVocê está convidado(a) para ${guest.eventName}.\nPor favor, confirme sua presença.\n\nObrigado!`;
    const emailUrl = `mailto:${guest.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return { type: 'email', url: emailUrl, subject, body };
  }
};

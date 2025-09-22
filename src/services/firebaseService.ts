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
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db } from '../lib/firebase';
import { Client, Event, Payment } from '../types';

const storage = getStorage();

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
  await deleteDoc(doc(db, 'events', id));
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
  const q = query(
    collection(db, 'subscriptions'),
    where('userId', '==', userId),
    where('status', '==', 'active')
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  const doc = querySnapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
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
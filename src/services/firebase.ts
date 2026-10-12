import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ClanAnnouncement } from '../data/clanData';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline mode or waiting for connection.');
    }
  }
}

// Realtime subscription to announcements
export function subscribeToAnnouncements(
  onUpdate: (announcements: ClanAnnouncement[]) => void,
  onError?: (error: unknown) => void
) {
  const colRef = collection(db, 'announcements');
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const results: ClanAnnouncement[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        results.push({
          id: docSnap.id,
          title: data.title || '',
          content: data.content || '',
          category: data.category || 'General',
          date: data.date || '',
          isPinned: !!data.isPinned,
          author: data.author || 'Leader',
        });
      });
      onUpdate(results);
    },
    (error) => {
      console.error('Error listening to announcements:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'announcements');
    }
  );
}

// Publish announcement
export async function publishAnnouncementToFirestore(announcement: ClanAnnouncement): Promise<void> {
  const cleanId = announcement.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `announcements/${cleanId}`;
  try {
    const docRef = doc(db, 'announcements', cleanId);
    await setDoc(docRef, {
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      date: announcement.date,
      author: announcement.author,
      isPinned: !!announcement.isPinned,
      createdAt: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Delete announcement
export async function deleteAnnouncementFromFirestore(announcementId: string): Promise<void> {
  const cleanId = announcementId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `announcements/${cleanId}`;
  try {
    const docRef = doc(db, 'announcements', cleanId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

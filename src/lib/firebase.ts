import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  onSnapshot,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  Militar, 
  Destino, 
  EscalaAssignment, 
  EscalaMeta, 
  Organization, 
  UserAccount, 
  PernoiteDoc,
  Missao,
  AgendaItem,
  PushSubscriptionInfo
} from '../types';
import { sanitizeForRTDB } from '../utils/helpers';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);

// Firestore rejects `undefined` anywhere inside an object. Several UI forms use
// optional fields with `undefined`, so sanitize every payload before persisting.
// This prevents optimistic/local saves from appearing successful and then
// disappearing after a reload when the Firestore write was actually rejected.
function sanitizeForFirestore<T>(value: T): T {
  if (value === undefined || value === null) return value;
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as T;
  }
  if (typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      if (item !== undefined) clean[key] = sanitizeForFirestore(item);
    });
    return clean as T;
  }
  return value;
}

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
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error('Firestore/RTDB Error: ', JSON.stringify(errInfo));
}

// Initial Default Organizations - Rancho only by default
export const INITIAL_ORGANIZATIONS: Organization[] = [
  { 
    id: 'rancho', 
    nome: 'Rancho / Aprovisionamento', 
    sigla: 'RANCHO', 
    descricao: 'Seção de Aprovisionamento Geral', 
    createdAt: '2026-08-01', 
    isMaster: true,
    enabledModules: ['escala_select', 'mapa_forca', 'aditamento', 'destinos', 'gestao']
  }
];

const LEGACY_DEMO_ORG_IDS = ['esqd_cap', '1_esqd', '2_esqd', '3_esqd', 'pel_com', 'esqd_1', 'esqd_2', 'esqd_3', 'esquadrao_cap', 'pelotao_com', 'pel_comunicacoes'];

function sanitizeOrganizations(list: Organization[]): Organization[] {
  // Filter out hardcoded legacy demo organizations if they exist
  const filtered = list.filter((o) => !LEGACY_DEMO_ORG_IDS.includes(o.id));
  if (filtered.length === 0 || !filtered.some((o) => o.id === 'rancho')) {
    return [
      INITIAL_ORGANIZATIONS[0],
      ...filtered.filter((o) => o.id !== 'rancho')
    ];
  }
  // Ensure Rancho has proper default configuration
  return filtered.map((o) => {
    if (o.id === 'rancho') {
      return {
        ...o,
        isMaster: true,
        nome: 'Rancho / Aprovisionamento',
        sigla: 'RANCHO',
        enabledModules: o.enabledModules || ['escala_select', 'mapa_forca', 'aditamento', 'destinos', 'gestao']
      };
    }
    return o;
  });
}

// Initial Default Operational Users (Rancho repartição team)
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-simas-master',
    username: '1SGTSIMAS',
    password: 'Damer1986@',
    nomeGuerra: 'Simas',
    grad: '1º Sgt',
    orgId: 'rancho',
    role: 'SUPER_ADMIN',
    createdAt: '2026-08-01'
  },
  {
    id: 'user-strieder',
    username: 'ASPOFSTRIEDER',
    password: 'Rancho2026@',
    nomeGuerra: 'Strieder',
    grad: 'Asp',
    orgId: 'rancho',
    role: 'ORG_ADMIN',
    createdAt: '2026-08-01'
  },
  {
    id: 'user-silva',
    username: '3SGTSILVA',
    password: 'Rancho2026@',
    nomeGuerra: 'Silva',
    grad: '3º Sgt',
    orgId: 'rancho',
    role: 'OPERADOR',
    createdAt: '2026-08-01'
  },
  {
    id: 'user-pimentel',
    username: '3SGTPIMENTEL',
    password: 'Rancho2026@',
    nomeGuerra: 'Pimentel',
    grad: '3º Sgt',
    orgId: 'rancho',
    role: 'OPERADOR',
    createdAt: '2026-08-01'
  }
];

function sanitizeUsersList(list: UserAccount[]): UserAccount[] {
  const map = new Map<string, UserAccount>();
  // Seed with initial users
  INITIAL_USERS.forEach((u) => map.set(u.username.toUpperCase(), u));
  // Add/overwrite with custom/updated users
  list.forEach((u) => {
    map.set(u.username.toUpperCase(), u);
  });
  return Array.from(map.values());
}

// ==========================================
// ORGANIZATIONS PERSISTENCE
// ==========================================
export function subscribeOrganizations(
  onData: (orgs: Organization[]) => void
): () => void {
  const localRaw = localStorage.getItem('sge_organizations');
  if (localRaw !== null) {
    try {
      const parsed = JSON.parse(localRaw);
      const sanitized = sanitizeOrganizations(parsed);
      localStorage.setItem('sge_organizations', JSON.stringify(sanitized));
      onData(sanitized);
    } catch (e) {
      console.error(e);
      onData(INITIAL_ORGANIZATIONS);
    }
  } else {
    localStorage.setItem('sge_organizations', JSON.stringify(INITIAL_ORGANIZATIONS));
    onData(INITIAL_ORGANIZATIONS);
  }

  const unsubRtdb = onValue(ref(rtdb, 'organizations'), (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val();
      const rawList: Organization[] = Array.isArray(val) ? val : Object.values(val);
      const list = sanitizeOrganizations(rawList);
      localStorage.setItem('sge_organizations', JSON.stringify(list));
      onData(list);
    }
  }, (err) => console.warn('RTDB orgs listener error:', err));

  const unsubFs = onSnapshot(collection(db, 'organizations'), (snapshot) => {
    if (!snapshot.empty) {
      const items: Organization[] = [];
      snapshot.forEach((d) => items.push(d.data() as Organization));
      const list = sanitizeOrganizations(items);
      localStorage.setItem('sge_organizations', JSON.stringify(list));
      onData(list);
    }
  }, (err) => console.warn('Firestore orgs listener error:', err));

  return () => {
    unsubRtdb();
    unsubFs();
  };
}

export async function saveOrganizationsList(orgs: Organization[]): Promise<void> {
  localStorage.setItem('sge_organizations', JSON.stringify(orgs));
  try {
    await set(ref(rtdb, 'organizations'), sanitizeForRTDB(orgs));
  } catch (err) {
    console.warn('RTDB save orgs error:', err);
  }
  try {
    const batch = writeBatch(db);
    orgs.forEach((o) => {
      batch.set(doc(db, 'organizations', o.id), sanitizeForFirestore(o), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore save orgs error:', err);
  }
}

export async function saveOrganizationToFirestore(org: Organization): Promise<void> {
  const localRaw = localStorage.getItem('sge_organizations');
  let current: Organization[] = localRaw ? JSON.parse(localRaw) : [...INITIAL_ORGANIZATIONS];
  const idx = current.findIndex((o) => o.id === org.id);
  if (idx >= 0) current[idx] = org;
  else current.push(org);
  await saveOrganizationsList(current);
}

export async function deleteOrganizationFromFirestore(orgId: string): Promise<void> {
  const localRaw = localStorage.getItem('sge_organizations');
  let current: Organization[] = localRaw ? JSON.parse(localRaw) : [...INITIAL_ORGANIZATIONS];
  current = current.filter((o) => o.id !== orgId);
  localStorage.setItem('sge_organizations', JSON.stringify(current));
  try {
    await set(ref(rtdb, 'organizations'), sanitizeForRTDB(current));
  } catch (e) {
    console.warn('RTDB delete org error:', e);
  }
  try {
    await deleteDoc(doc(db, 'organizations', orgId));
  } catch (e) {
    console.warn('Firestore delete org error:', e);
  }
}

// ==========================================
// USERS PERSISTENCE
// ==========================================
export function subscribeUsers(
  onData: (users: UserAccount[]) => void
): () => void {
  const localRaw = localStorage.getItem('sge_users');
  if (localRaw !== null) {
    try {
      const parsed = JSON.parse(localRaw);
      const sanitized = sanitizeUsersList(parsed);
      localStorage.setItem('sge_users', JSON.stringify(sanitized));
      onData(sanitized);
    } catch (e) {
      console.error(e);
      onData(INITIAL_USERS);
    }
  } else {
    localStorage.setItem('sge_users', JSON.stringify(INITIAL_USERS));
    onData(INITIAL_USERS);
  }

  const unsubRtdb = onValue(ref(rtdb, 'users'), (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val();
      const rawList: UserAccount[] = Array.isArray(val) ? val : Object.values(val);
      const list = sanitizeUsersList(rawList);
      localStorage.setItem('sge_users', JSON.stringify(list));
      onData(list);
    }
  }, (err) => console.warn('RTDB users listener error:', err));

  const unsubFs = onSnapshot(collection(db, 'users'), (snapshot) => {
    if (!snapshot.empty) {
      const items: UserAccount[] = [];
      snapshot.forEach((d) => items.push(d.data() as UserAccount));
      const list = sanitizeUsersList(items);
      localStorage.setItem('sge_users', JSON.stringify(list));
      onData(list);
    }
  }, (err) => console.warn('Firestore users listener error:', err));

  return () => {
    unsubRtdb();
    unsubFs();
  };
}

export async function saveUsersList(users: UserAccount[]): Promise<void> {
  localStorage.setItem('sge_users', JSON.stringify(users));
  try {
    await set(ref(rtdb, 'users'), sanitizeForRTDB(users));
  } catch (err) {
    console.warn('RTDB save users error:', err);
  }
  try {
    const batch = writeBatch(db);
    users.forEach((u) => {
      batch.set(doc(db, 'users', u.id), sanitizeForFirestore(u), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore save users error:', err);
  }
}

export async function saveUserToFirestore(user: UserAccount): Promise<void> {
  const localRaw = localStorage.getItem('sge_users');
  let current: UserAccount[] = localRaw ? JSON.parse(localRaw) : [...INITIAL_USERS];
  const idx = current.findIndex((u) => u.id === user.id);
  if (idx >= 0) current[idx] = user;
  else current.push(user);
  await saveUsersList(current);
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  const localRaw = localStorage.getItem('sge_users');
  let current: UserAccount[] = localRaw ? JSON.parse(localRaw) : [...INITIAL_USERS];
  current = current.filter((u) => u.id !== userId);
  localStorage.setItem('sge_users', JSON.stringify(current));
  try {
    await set(ref(rtdb, 'users'), sanitizeForRTDB(current));
  } catch (e) {
    console.warn('RTDB delete user error:', e);
  }
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (e) {
    console.warn('Firestore delete user error:', e);
  }
}

// ==========================================
// ADITAMENTO PERSISTENCE (Multi-Tenant Org Aware)
// ==========================================
export interface SavedAditamentoData {
  id: string;
  orgId?: string;
  date: string;
  numBoletim: string;
  parte2Text: string;
  parte3Text: string;
  parte4Text: string;
  signerName: string;
  signerRole: string;
  isSigned: boolean;
  signedAt?: string;
  updatedAt: string;
}

export async function saveAditamentoToFirebase(data: SavedAditamentoData, orgId: string = 'rancho'): Promise<void> {
  const key = orgId === 'rancho' ? `aditamento_${data.date}` : `aditamento_${orgId}_${data.date}`;
  localStorage.setItem(key, JSON.stringify(data));
  try {
    await set(ref(rtdb, orgId === 'rancho' ? `aditamentos/${data.date}` : `aditamentos_${orgId}/${data.date}`), sanitizeForRTDB(data));
  } catch (err) {
    console.warn('RTDB aditamento save error:', err);
  }
  try {
    await setDoc(doc(db, orgId === 'rancho' ? 'aditamentos' : `aditamentos_${orgId}`, data.date), sanitizeForFirestore(data), { merge: true });
  } catch (err) {
    console.warn('Firestore aditamento save error:', err);
  }
}

export async function loadAditamentoFromFirebase(date: string, orgId: string = 'rancho'): Promise<SavedAditamentoData | null> {
  const local = localStorage.getItem(orgId === 'rancho' ? `aditamento_${date}` : `aditamento_${orgId}_${date}`);
  if (local) {
    try { return JSON.parse(local); } catch (e) { console.warn(e); }
  }
  try {
    const docRef = doc(db, orgId === 'rancho' ? 'aditamentos' : `aditamentos_${orgId}`, date);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as SavedAditamentoData;
      localStorage.setItem(orgId === 'rancho' ? `aditamento_${date}` : `aditamento_${orgId}_${date}`, JSON.stringify(data));
      return data;
    }
    if (orgId === 'rancho') {
      const fallbackSnap = await getDoc(doc(db, 'aditamentos', date));
      if (fallbackSnap.exists()) {
        const data = fallbackSnap.data() as SavedAditamentoData;
        return data;
      }
    }
  } catch (err) {
    console.warn('Error loading aditamento:', err);
  }
  return null;
}

// ==========================================
// PERNOITE PERSISTENCE (Multi-Tenant Org Aware)
// ==========================================
export async function savePernoiteToFirebase(data: PernoiteDoc, orgId: string = 'rancho'): Promise<void> {
  const key = `pernoite_${orgId}_${data.data}`;
  localStorage.setItem(key, JSON.stringify(data));
  try {
    await set(ref(rtdb, `pernoites_${orgId}/${data.data}`), sanitizeForRTDB(data));
  } catch (err) {
    console.warn('RTDB pernoite save error:', err);
  }
  try {
    await setDoc(doc(db, `pernoites_${orgId}`, data.data), sanitizeForFirestore(data), { merge: true });
  } catch (err) {
    console.warn('Firestore pernoite save error:', err);
  }
}

export async function loadPernoiteFromFirebase(date: string, orgId: string = 'rancho'): Promise<PernoiteDoc | null> {
  const local = localStorage.getItem(`pernoite_${orgId}_${date}`);
  if (local) {
    try { return JSON.parse(local); } catch (e) { console.warn(e); }
  }
  try {
    const docRef = doc(db, `pernoites_${orgId}`, date);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as PernoiteDoc;
      localStorage.setItem(`pernoite_${orgId}_${date}`, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Error loading pernoite:', err);
  }
  return null;
}

// ==========================================
// MILITARES PERSISTENCE (Multi-Tenant Org Aware)
// ==========================================
export function subscribeMilitares(
  onData: (data: Militar[]) => void,
  initialData: Militar[],
  orgId: string = 'rancho'
): () => void {
  const storageKey = orgId === 'rancho' ? 'escala_militares' : `escala_militares_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  
  if (localRaw !== null) {
    try {
      onData(JSON.parse(localRaw));
    } catch (e) {
      console.error('Error parsing local militares:', e);
    }
  } else {
    localStorage.setItem(storageKey, JSON.stringify(initialData));
    onData(initialData);
  }

  const fsColName = orgId === 'rancho' ? 'militares' : `militares_${orgId}`;
  const rtdbPath = orgId === 'rancho' ? 'militares' : `militares_${orgId}`;

  const unsubFs = onSnapshot(collection(db, fsColName), (snapshot) => {
    const items: Militar[] = [];
    snapshot.forEach((d) => items.push(d.data() as Militar));
    items.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    
    // If Firestore has records or local was empty, emit
    if (items.length > 0 || localRaw === null) {
      localStorage.setItem(storageKey, JSON.stringify(items));
      onData(items);
    }

    // Passive RTDB sync without triggering UI race
    set(ref(rtdb, rtdbPath), sanitizeForRTDB(items)).catch((err) =>
      console.warn('Passive RTDB militares mirror error:', err)
    );
  }, (err) => console.warn('Firestore militares listener error:', err));

  return () => {
    unsubFs();
  };
}

export async function saveMilitaresList(militares: Militar[], orgId: string = 'rancho'): Promise<void> {
  const storageKey = orgId === 'rancho' ? 'escala_militares' : `escala_militares_${orgId}`;
  localStorage.setItem(storageKey, JSON.stringify(militares));
  try {
    const colName = orgId === 'rancho' ? 'militares' : `militares_${orgId}`;
    const batch = writeBatch(db);
    militares.forEach((m) => {
      batch.set(doc(db, colName, m.id), sanitizeForFirestore(m), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Error saving militares to Firestore:', err);
  }
  try {
    await set(ref(rtdb, orgId === 'rancho' ? 'militares' : `militares_${orgId}`), sanitizeForRTDB(militares));
  } catch (err) {
    console.warn('Error saving militares to RTDB:', err);
  }
}

export async function saveMilitarToFirestore(militar: Militar, orgId: string = 'rancho'): Promise<void> {
  const storageKey = orgId === 'rancho' ? 'escala_militares' : `escala_militares_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  let current: Militar[] = localRaw ? JSON.parse(localRaw) : [];
  const idx = current.findIndex((m) => m.id === militar.id);
  if (idx >= 0) current[idx] = militar;
  else current.push(militar);
  localStorage.setItem(storageKey, JSON.stringify(current));

  const colName = orgId === 'rancho' ? 'militares' : `militares_${orgId}`;
  try {
    await setDoc(doc(db, colName, militar.id), sanitizeForFirestore(militar));
  } catch (err) {
    console.warn('Error saving single militar to Firestore:', err);
  }

  // Keep the realtime mirror updated as an additional persistence copy.
  try {
    await set(
      ref(rtdb, `${orgId === 'rancho' ? 'militares' : `militares_${orgId}`}/${militar.id}`),
      sanitizeForRTDB(militar)
    );
  } catch (err) {
    console.warn('Error saving single militar to RTDB:', err);
  }
}

export async function deleteMilitarFromFirestore(militarId: string, orgId: string = 'rancho'): Promise<void> {
  const storageKey = orgId === 'rancho' ? 'escala_militares' : `escala_militares_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  let current: Militar[] = localRaw ? JSON.parse(localRaw) : [];
  current = current.filter((m) => m.id !== militarId);
  localStorage.setItem(storageKey, JSON.stringify(current));

  try {
    await deleteDoc(doc(db, orgId === 'rancho' ? 'militares' : `militares_${orgId}`, militarId));
  } catch (e) {
    console.warn('Firestore delete error:', e);
  }
}

export async function deleteAllMilitaresFromFirestore(militarIds: string[], orgId: string = 'rancho'): Promise<void> {
  await saveMilitaresList([], orgId);
  try {
    const batch = writeBatch(db);
    militarIds.forEach((id) => {
      batch.delete(doc(db, orgId === 'rancho' ? 'militares' : `militares_${orgId}`, id));
    });
    await batch.commit();
  } catch (e) {
    console.warn('Firestore deleteAll error:', e);
  }
}

// ==========================================
// ASSIGNMENTS PERSISTENCE (Multi-Tenant Org Aware)
// ==========================================
export function subscribeAssignments(
  onData: (data: EscalaAssignment[]) => void,
  initialData: EscalaAssignment[],
  orgId: string = 'rancho'
): () => void {
  const storageKey = orgId === 'rancho' ? 'escala_assignments' : `escala_assignments_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  
  if (localRaw !== null) {
    try {
      onData(JSON.parse(localRaw));
    } catch (e) {
      console.error(e);
    }
  } else {
    localStorage.setItem(storageKey, JSON.stringify(initialData));
    onData(initialData);
  }

  const unsubFs = onSnapshot(collection(db, orgId === 'rancho' ? 'assignments' : `assignments_${orgId}`), (snapshot) => {
    const items: EscalaAssignment[] = [];
    snapshot.forEach((d) => items.push(d.data() as EscalaAssignment));
    localStorage.setItem(storageKey, JSON.stringify(items));
    onData(items);

    // Passive RTDB mirror
    set(ref(rtdb, orgId === 'rancho' ? 'assignments' : `assignments_${orgId}`), sanitizeForRTDB(items)).catch((err) =>
      console.warn('Passive RTDB assignments mirror error:', err)
    );
  }, (err) => console.warn('Firestore assignments error:', err));

  return () => {
    unsubFs();
  };
}

export async function saveAssignmentsList(assignments: EscalaAssignment[], orgId: string = 'rancho'): Promise<void> {
  const storageKey = orgId === 'rancho' ? 'escala_assignments' : `escala_assignments_${orgId}`;
  localStorage.setItem(storageKey, JSON.stringify(assignments));
  try {
    const colName = orgId === 'rancho' ? 'assignments' : `assignments_${orgId}`;
    const batch = writeBatch(db);
    assignments.forEach((item) => {
      batch.set(doc(db, colName, item.id), sanitizeForFirestore(item), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore assignments save error:', err);
  }
  try {
    await set(ref(rtdb, orgId === 'rancho' ? 'assignments' : `assignments_${orgId}`), sanitizeForRTDB(assignments));
  } catch (e) {
    console.warn('RTDB assignments save error:', e);
  }
}

export async function setAllAssignmentsInFirestore(assignments: EscalaAssignment[], orgId: string = 'rancho'): Promise<void> {
  return saveAssignmentsList(assignments, orgId);
}

export async function updateAssignmentsBatchInFirestore(
  toAddOrUpdate: EscalaAssignment[],
  toRemoveIds: string[],
  orgId: string = 'rancho'
): Promise<void> {
  const storageKey = orgId === 'rancho' ? 'escala_assignments' : `escala_assignments_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  let current: EscalaAssignment[] = localRaw ? JSON.parse(localRaw) : [];
  current = current.filter((a) => !toRemoveIds.includes(a.id));
  toAddOrUpdate.forEach((item) => {
    const idx = current.findIndex((a) => a.id === item.id);
    if (idx >= 0) current[idx] = item;
    else current.push(item);
  });
  localStorage.setItem(storageKey, JSON.stringify(current));

  try {
    const batch = writeBatch(db);
    const colName = orgId === 'rancho' ? 'assignments' : `assignments_${orgId}`;
    toAddOrUpdate.forEach((item) => {
      batch.set(doc(db, colName, item.id), sanitizeForFirestore(item), { merge: true });
    });
    toRemoveIds.forEach((id) => {
      batch.delete(doc(db, colName, id));
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore batch update error:', err);
  }
}

// ==========================================
// DESTINOS PERSISTENCE (Multi-Tenant Org Aware)
// ==========================================
export function subscribeDestinos(
  onData: (data: Destino[]) => void,
  initialData: Destino[],
  orgId: string = 'rancho'
): () => void {
  const storageKey = orgId === 'rancho' ? 'escala_destinos' : `escala_destinos_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  
  if (localRaw !== null) {
    try {
      onData(JSON.parse(localRaw));
    } catch (e) {
      console.error(e);
    }
  } else {
    localStorage.setItem(storageKey, JSON.stringify(initialData));
    onData(initialData);
  }

  const fsColName = orgId === 'rancho' ? 'destinos' : `destinos_${orgId}`;
  const rtdbPath = orgId === 'rancho' ? 'destinos' : `destinos_${orgId}`;

  const unsubFs = onSnapshot(collection(db, fsColName), (snapshot) => {
    const items: Destino[] = [];
    snapshot.forEach((d) => items.push(d.data() as Destino));
    items.sort((a, b) => b.dataInicio.localeCompare(a.dataInicio));

    localStorage.setItem(storageKey, JSON.stringify(items));
    onData(items);

    // Passive RTDB mirror
    set(ref(rtdb, rtdbPath), sanitizeForRTDB(items)).catch((err) =>
      console.warn('Passive RTDB destinos mirror error:', err)
    );
  }, (err) => console.warn('Firestore destinos error:', err));

  return () => {
    unsubFs();
  };
}

export async function saveDestinosList(destinos: Destino[], orgId: string = 'rancho'): Promise<void> {
  const storageKey = orgId === 'rancho' ? 'escala_destinos' : `escala_destinos_${orgId}`;
  localStorage.setItem(storageKey, JSON.stringify(destinos));
  const colName = orgId === 'rancho' ? 'destinos' : `destinos_${orgId}`;
  
  try {
    const batch = writeBatch(db);
    destinos.forEach((d) => {
      batch.set(doc(db, colName, d.id), sanitizeForFirestore(d), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore destinos save error:', err);
  }
}

export async function saveDestinoToFirestore(destino: Destino, orgId: string = 'rancho'): Promise<void> {
  const storageKey = orgId === 'rancho' ? 'escala_destinos' : `escala_destinos_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  let current: Destino[] = localRaw ? JSON.parse(localRaw) : [];
  const idx = current.findIndex((d) => d.id === destino.id);
  if (idx >= 0) current[idx] = destino;
  else current.push(destino);
  
  localStorage.setItem(storageKey, JSON.stringify(current));

  const colName = orgId === 'rancho' ? 'destinos' : `destinos_${orgId}`;
  try {
    await setDoc(doc(db, colName, destino.id), sanitizeForFirestore(destino), { merge: true });
  } catch (err) {
    console.warn('Error saving single destino to Firestore:', err);
  }
}

export async function deleteDestinoFromFirestore(destinoId: string, orgId: string = 'rancho'): Promise<void> {
  const storageKey = orgId === 'rancho' ? 'escala_destinos' : `escala_destinos_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  let current: Destino[] = localRaw ? JSON.parse(localRaw) : [];
  current = current.filter((d) => d.id !== destinoId);
  localStorage.setItem(storageKey, JSON.stringify(current));

  const colName = orgId === 'rancho' ? 'destinos' : `destinos_${orgId}`;
  try {
    await deleteDoc(doc(db, colName, destinoId));
  } catch (err) {
    console.warn('Firestore delete destino error:', err);
  }
}

// ==========================================
// CUSTOM DESTINATION TYPES PERSISTENCE
// ==========================================
export const DEFAULT_DESTINO_TIPOS: string[] = [
  'Férias',
  'Baixa Hospitalar',
  'Dispensa Médica',
  'Licença Prêmio',
  'Serviço Externo',
  'Missão',
  'Missão Especial',
  'Curso / Estágio',
  'Dispensa como Recompensa'
];

export function subscribeDestinoTipos(
  onData: (data: string[]) => void
): () => void {
  const localRaw = localStorage.getItem('sge_destino_tipos');
  if (localRaw !== null) {
    try {
      onData(JSON.parse(localRaw));
    } catch (e) {
      console.error(e);
    }
  } else {
    localStorage.setItem('sge_destino_tipos', JSON.stringify(DEFAULT_DESTINO_TIPOS));
    onData(DEFAULT_DESTINO_TIPOS);
  }

  const unsubRtdb = onValue(ref(rtdb, 'config/destino_tipos'), (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val();
      const list: string[] = Array.isArray(val) ? val : Object.values(val);
      localStorage.setItem('sge_destino_tipos', JSON.stringify(list));
      onData(list);
    }
  }, (err) => console.warn('RTDB destino_tipos error:', err));

  return () => {
    unsubRtdb();
  };
}

export async function saveDestinoTiposList(tipos: string[]): Promise<void> {
  localStorage.setItem('sge_destino_tipos', JSON.stringify(tipos));
  try {
    await set(ref(rtdb, 'config/destino_tipos'), sanitizeForRTDB(tipos));
    await setDoc(doc(db, 'config', 'destino_tipos'), sanitizeForFirestore({ list: tipos }), { merge: true });
  } catch (e) {
    console.warn('Save destino tipos error:', e);
  }
}

// ==========================================
// ESCALAS META PERSISTENCE (Multi-Tenant Org Aware)
// ==========================================
export function subscribeEscalasMeta(
  onData: (data: Record<string, EscalaMeta>) => void,
  initialData: Record<string, EscalaMeta>,
  orgId: string = 'rancho'
): () => void {
  const storageKey = orgId === 'rancho' ? 'escala_meta' : `escala_meta_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  
  if (localRaw !== null) {
    try {
      onData(JSON.parse(localRaw));
    } catch (e) {
      console.error(e);
    }
  } else {
    localStorage.setItem(storageKey, JSON.stringify(initialData));
    onData(initialData);
  }

  const unsubRtdb = onValue(ref(rtdb, orgId === 'rancho' ? 'escalas_meta' : `escalas_meta_${orgId}`), (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val();
      const obj: Record<string, EscalaMeta> = typeof val === 'object' && val !== null ? val : {};
      localStorage.setItem(storageKey, JSON.stringify(obj));
      onData(obj);
    }
  }, (err) => console.warn('RTDB escalas_meta error:', err));

  const unsubFsConfig = orgId === 'rancho'
    ? onSnapshot(doc(db, 'config', 'escalas_meta'), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && typeof data.map === 'object' && data.map !== null) {
            localStorage.setItem(storageKey, JSON.stringify(data.map));
            onData(data.map as Record<string, EscalaMeta>);
          }
        }
      }, (err) => console.warn('Firestore config/escalas_meta error:', err))
    : () => {};

  const unsubFs = onSnapshot(collection(db, orgId === 'rancho' ? 'escalas_meta' : `escalas_meta_${orgId}`), (snapshot) => {
    if (!snapshot.empty) {
      const metas: Record<string, EscalaMeta> = {};
      snapshot.forEach((d) => {
        const m = d.data() as EscalaMeta;
        metas[m.id] = m;
      });
      localStorage.setItem(storageKey, JSON.stringify(metas));
      onData(metas);
    }
  }, (err) => console.warn('Firestore escalas_meta error:', err));

  return () => {
    unsubRtdb();
    unsubFsConfig();
    unsubFs();
  };
}

export async function saveEscalasMetaMap(metas: Record<string, EscalaMeta>, orgId: string = 'rancho'): Promise<void> {
  const storageKey = orgId === 'rancho' ? 'escala_meta' : `escala_meta_${orgId}`;
  localStorage.setItem(storageKey, JSON.stringify(metas));
  try {
    await set(ref(rtdb, orgId === 'rancho' ? 'escalas_meta' : `escalas_meta_${orgId}`), sanitizeForRTDB(metas));
  } catch (e) {
    console.warn('RTDB escalas_meta save error:', e);
  }
  try {
    if (orgId === 'rancho') {
      await setDoc(doc(db, 'config', 'escalas_meta'), sanitizeForFirestore({ map: metas }), { merge: true });
    }
    const colName = orgId === 'rancho' ? 'escalas_meta' : `escalas_meta_${orgId}`;
    const batch = writeBatch(db);
    Object.values(metas).forEach((meta) => {
      batch.set(doc(db, colName, meta.id), sanitizeForFirestore(meta), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore config/escalas_meta error:', err);
  }
}

export async function saveEscalaMetaToFirestore(meta: EscalaMeta, orgId: string = 'rancho'): Promise<void> {
  const storageKey = orgId === 'rancho' ? 'escala_meta' : `escala_meta_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  let current: Record<string, EscalaMeta> = localRaw ? JSON.parse(localRaw) : {};
  current[meta.id] = meta;
  await saveEscalasMetaMap(current, orgId);
}

export async function deleteEscalaMetaFromFirestore(metaId: string, orgId: string = 'rancho'): Promise<void> {
  const storageKey = orgId === 'rancho' ? 'escala_meta' : `escala_meta_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  let current: Record<string, EscalaMeta> = localRaw ? JSON.parse(localRaw) : {};
  delete current[metaId];
  await saveEscalasMetaMap(current, orgId);
  try {
    await deleteDoc(doc(db, orgId === 'rancho' ? 'escalas_meta' : `escalas_meta_${orgId}`, metaId));
  } catch (err) {
    console.warn('Firestore doc delete error:', err);
  }
}

// ==========================================
// RED DAYS PERSISTENCE (Multi-Tenant Org Aware)
// RTDB is the live source of truth. Firestore is kept only as a backup/fallback.
// This prevents two realtime listeners from racing and reverting a manual red day.
// ==========================================
export function subscribeRedDays(
  onData: (data: Record<string, boolean>) => void,
  orgId: string = 'rancho'
): () => void {
  const storageKey = orgId === 'rancho' ? 'escala_red_days' : `escala_red_days_${orgId}`;
  const rtdbPath = orgId === 'rancho' ? 'red_days' : `red_days_${orgId}`;
  let cancelled = false;

  const emit = (obj: Record<string, boolean>) => {
    if (cancelled) return;
    localStorage.setItem(storageKey, JSON.stringify(obj));
    onData(obj);
  };

  const localRaw = localStorage.getItem(storageKey);
  if (localRaw !== null) {
    try {
      emit(JSON.parse(localRaw));
    } catch (e) {
      console.error(e);
    }
  }

  const unsubRtdb = onValue(
    ref(rtdb, rtdbPath),
    async (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const obj: Record<string, boolean> = typeof val === 'object' && val !== null ? val : {};
        emit(obj);
        return;
      }

      // Legacy fallback: recover the previous Firestore copy once if RTDB is empty.
      if (orgId === 'rancho') {
        try {
          const snap = await getDoc(doc(db, 'config', 'red_days'));
          if (snap.exists()) {
            const obj = (snap.data() as Record<string, boolean>) || {};
            emit(obj);
            await set(ref(rtdb, rtdbPath), sanitizeForRTDB(obj));
          }
        } catch (err) {
          console.warn('Firestore red_days fallback error:', err);
        }
      }
    },
    (err) => console.warn('RTDB red_days error:', err)
  );

  return () => {
    cancelled = true;
    unsubRtdb();
  };
}

export async function saveRedDaysToFirestore(
  redDays: Record<string, boolean>,
  orgId: string = 'rancho'
): Promise<void> {
  const storageKey = orgId === 'rancho' ? 'escala_red_days' : `escala_red_days_${orgId}`;
  const rtdbPath = orgId === 'rancho' ? 'red_days' : `red_days_${orgId}`;
  const firestoreDoc = orgId === 'rancho' ? 'red_days' : `red_days_${orgId}`;

  // Immediate local persistence so the UI does not flash back to black.
  localStorage.setItem(storageKey, JSON.stringify(redDays));

  // RTDB is authoritative for live synchronization.
  try {
    await set(ref(rtdb, rtdbPath), sanitizeForRTDB(redDays));
  } catch (e) {
    console.warn('RTDB red_days save error:', e);
  }

  // Firestore remains a backup mirror; a failure here cannot undo the RTDB write.
  try {
    await setDoc(doc(db, 'config', firestoreDoc), sanitizeForFirestore(redDays));
  } catch (err) {
    console.warn('Firestore red_days save error:', err);
  }
}

// ==========================================
// MISSÕES / PLANNER OPERACIONAL PERSISTENCE
// ==========================================
export function subscribeMissoes(
  orgId: string = 'rancho',
  onData: (missoes: Missao[]) => void
): () => void {
  const storageKey = `sge_missoes_${orgId}`;
  const rtdbPath = `missoes_${orgId}`;
  let cancelled = false;

  const emit = (list: Missao[]) => {
    if (cancelled) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch {
      // storage quota safe
    }
    onData(list);
  };

  // Immediate cached state
  const localRaw = localStorage.getItem(storageKey);
  if (localRaw !== null) {
    try {
      emit(JSON.parse(localRaw));
    } catch (e) {
      console.error(e);
      emit([]);
    }
  } else {
    emit([]);
  }

  // Live RTDB listener
  const unsubRtdb = onValue(
    ref(rtdb, rtdbPath),
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: Missao[] = Array.isArray(val) ? val : Object.values(val);
        emit(list.filter(Boolean));
      }
    },
    (err) => console.warn('RTDB missoes listener error:', err)
  );

  // Firestore backup listener
  const unsubFs = onSnapshot(
    collection(db, 'missoes'),
    (snapshot) => {
      if (!snapshot.empty) {
        const items: Missao[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Missao;
          if (data.orgId === orgId) {
            items.push(data);
          }
        });
        if (items.length > 0) {
          emit(items);
        }
      }
    },
    (err) => console.warn('Firestore missoes listener error:', err)
  );

  return () => {
    cancelled = true;
    unsubRtdb();
    unsubFs();
  };
}

export async function saveMissoesList(
  missoes: Missao[],
  orgId: string = 'rancho'
): Promise<void> {
  const storageKey = `sge_missoes_${orgId}`;
  const rtdbPath = `missoes_${orgId}`;

  localStorage.setItem(storageKey, JSON.stringify(missoes));

  try {
    await set(ref(rtdb, rtdbPath), sanitizeForRTDB(missoes));
  } catch (err) {
    console.warn('RTDB save missoes error:', err);
  }

  try {
    const batch = writeBatch(db);
    missoes.forEach((m) => {
      batch.set(doc(db, 'missoes', m.id), sanitizeForFirestore(m), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore save missoes error:', err);
  }
}

export async function saveMissao(
  missao: Missao,
  orgId: string = 'rancho'
): Promise<void> {
  const storageKey = `sge_missoes_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  let current: Missao[] = localRaw ? JSON.parse(localRaw) : [];
  const idx = current.findIndex((m) => m.id === missao.id);
  if (idx >= 0) {
    current[idx] = missao;
  } else {
    current.push(missao);
  }
  await saveMissoesList(current, orgId);
}

export async function updateMissaoStatus(
  missaoId: string,
  status: Missao['status'],
  orgId: string = 'rancho'
): Promise<void> {
  const storageKey = `sge_missoes_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  let current: Missao[] = localRaw ? JSON.parse(localRaw) : [];
  const target = current.find((m) => m.id === missaoId);
  if (target) {
    target.status = status;
    target.updatedAt = new Date().toISOString();
    if (status === 'concluida') {
      target.dataConclusao = new Date().toISOString();
    } else {
      delete target.dataConclusao;
    }
    await saveMissoesList(current, orgId);
  }
}

export async function deleteMissao(
  missaoId: string,
  orgId: string = 'rancho'
): Promise<void> {
  const storageKey = `sge_missoes_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  let current: Missao[] = localRaw ? JSON.parse(localRaw) : [];
  current = current.filter((m) => m.id !== missaoId);
  await saveMissoesList(current, orgId);

  try {
    await deleteDoc(doc(db, 'missoes', missaoId));
  } catch (e) {
    console.warn('Firestore delete missao error:', e);
  }
}

// ==========================================
// AGENDA / PLANNER MENSAL PERSISTENCE
// ==========================================
export function subscribeAgenda(
  orgId: string = 'rancho',
  onData: (agenda: AgendaItem[]) => void
): () => void {
  const storageKey = `sge_agenda_${orgId}`;
  const rtdbPath = `agenda_${orgId}`;
  let cancelled = false;

  const emit = (list: AgendaItem[]) => {
    if (cancelled) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch {
      // storage safe
    }
    onData(list);
  };

  const localRaw = localStorage.getItem(storageKey);
  if (localRaw !== null) {
    try {
      emit(JSON.parse(localRaw));
    } catch (e) {
      console.error(e);
      emit([]);
    }
  } else {
    emit([]);
  }

  const unsubRtdb = onValue(
    ref(rtdb, rtdbPath),
    (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: AgendaItem[] = Array.isArray(val) ? val : Object.values(val);
        emit(list.filter(Boolean));
      }
    },
    (err) => console.warn('RTDB agenda listener error:', err)
  );

  const unsubFs = onSnapshot(
    collection(db, 'agenda'),
    (snapshot) => {
      if (!snapshot.empty) {
        const items: AgendaItem[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as AgendaItem;
          if (data.orgId === orgId) {
            items.push(data);
          }
        });
        if (items.length > 0) {
          emit(items);
        }
      }
    },
    (err) => console.warn('Firestore agenda listener error:', err)
  );

  return () => {
    cancelled = true;
    unsubRtdb();
    unsubFs();
  };
}

export async function saveAgendaList(
  agenda: AgendaItem[],
  orgId: string = 'rancho'
): Promise<void> {
  const storageKey = `sge_agenda_${orgId}`;
  const rtdbPath = `agenda_${orgId}`;

  localStorage.setItem(storageKey, JSON.stringify(agenda));

  try {
    await set(ref(rtdb, rtdbPath), sanitizeForRTDB(agenda));
  } catch (err) {
    console.warn('RTDB save agenda error:', err);
  }

  try {
    const batch = writeBatch(db);
    agenda.forEach((item) => {
      batch.set(doc(db, 'agenda', item.id), sanitizeForFirestore(item), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore save agenda error:', err);
  }
}

export async function saveAgendaItem(
  item: AgendaItem,
  orgId: string = 'rancho'
): Promise<void> {
  const storageKey = `sge_agenda_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  let current: AgendaItem[] = localRaw ? JSON.parse(localRaw) : [];
  const idx = current.findIndex((a) => a.id === item.id);
  if (idx >= 0) {
    current[idx] = item;
  } else {
    current.push(item);
  }
  await saveAgendaList(current, orgId);
}

export async function deleteAgendaItem(
  itemId: string,
  orgId: string = 'rancho'
): Promise<void> {
  const storageKey = `sge_agenda_${orgId}`;
  const localRaw = localStorage.getItem(storageKey);
  let current: AgendaItem[] = localRaw ? JSON.parse(localRaw) : [];
  current = current.filter((a) => a.id !== itemId);
  await saveAgendaList(current, orgId);

  try {
    await deleteDoc(doc(db, 'agenda', itemId));
  } catch (e) {
    console.warn('Firestore delete agenda error:', e);
  }
}

// ==========================================
// PWA PUSH SUBSCRIPTIONS PERSISTENCE
// ==========================================
export async function savePushSubscription(
  sub: PushSubscriptionInfo,
  orgId: string = 'rancho'
): Promise<void> {
  const rtdbPath = `push_subscriptions/${sub.id}`;
  try {
    await set(ref(rtdb, rtdbPath), sanitizeForRTDB(sub));
  } catch (e) {
    console.warn('RTDB save push sub error:', e);
  }
  try {
    await setDoc(doc(db, 'push_subscriptions', sub.id), sanitizeForFirestore(sub), { merge: true });
  } catch (e) {
    console.warn('Firestore save push sub error:', e);
  }
}


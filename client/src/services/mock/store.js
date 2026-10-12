// In-browser mock database used only when Firebase isn't configured
// (client/.env.local missing/incomplete). Lets the UI be built and demoed
// end-to-end before a real Firebase project is wired up. Persisted to
// localStorage so a page refresh during UI work doesn't lose your changes.

const STORAGE_KEY = 'casEmsMockDbV3';
const AUTH_KEY = 'casEmsMockAuthUid';

function isoNow() {
  return new Date().toISOString();
}

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function seedData() {
  const now = isoNow();
  return {
    meta: { adminExists: true },
    users: {
      'mock-admin': {
        fullName: 'Alex Santos', email: 'admin@demo.cas-ems.local', role: 'admin', status: 'approved', createdAt: now,
      },
      'mock-lab-it': {
        fullName: 'Bea Custodio', email: 'it.lab@demo.cas-ems.local', role: 'lab_custodian', labId: 'it', status: 'approved', createdAt: now,
      },
      'mock-lab-statistics': {
        fullName: 'Carlo Reyes', email: 'statistics.lab@demo.cas-ems.local', role: 'lab_custodian', labId: 'statistics', status: 'approved', createdAt: now,
      },
      'mock-lab-mathematics': {
        fullName: 'Dana Villar', email: 'mathematics.lab@demo.cas-ems.local', role: 'lab_custodian', labId: 'mathematics', status: 'approved', createdAt: now,
      },
      'mock-lab-psychology': {
        fullName: 'Eli Mendoza', email: 'psychology.lab@demo.cas-ems.local', role: 'lab_custodian', labId: 'psychology', status: 'approved', createdAt: now,
      },
      'mock-lab-physics': {
        fullName: 'Fatima Cruz', email: 'physics.lab@demo.cas-ems.local', role: 'lab_custodian', labId: 'physics', status: 'approved', createdAt: now,
      },
      'mock-lab-chemistry': {
        fullName: 'Gino Ramos', email: 'chemistry.lab@demo.cas-ems.local', role: 'lab_custodian', labId: 'chemistry', status: 'approved', createdAt: now,
      },
      'mock-borrower': {
        fullName: 'Hazel Torres', email: 'borrower@demo.cas-ems.local', role: 'borrower', status: 'approved',
        idNumber: '2021-00123', program: 'BS Information Technology', section: '3A', createdAt: now,
      },
      'mock-borrower-pending': {
        fullName: 'Ivan Bautista', email: 'pending@demo.cas-ems.local', role: 'borrower', status: 'pending',
        idNumber: '2022-00456', program: 'BS Psychology', section: '2B', createdAt: now,
      },
      'mock-borrower-rejected': {
        fullName: 'Jasmine Uy', email: 'rejected@demo.cas-ems.local', role: 'borrower', status: 'rejected',
        idNumber: '2020-00789', program: 'BS Mathematics', section: '4A', createdAt: now,
        rejectionReason: 'School ID number could not be verified against the registrar\'s list.',
      },
    },
    categories: {
      'cat-it-laptop': { name: 'Laptop', labId: 'it' },
      'cat-it-projector': { name: 'Projector', labId: 'it' },
      'cat-stat-calc': { name: 'Scientific Calculator', labId: 'statistics' },
      'cat-math-tools': { name: 'Geometric Tools Set', labId: 'mathematics' },
      'cat-psych-testing': { name: 'Psychological Testing Kit', labId: 'psychology' },
      'cat-psych-timer': { name: 'Stopwatch / Timer', labId: 'psychology' },
      'cat-phys-instruments': { name: 'Measuring Instruments', labId: 'physics' },
      'cat-phys-batteries': { name: 'Batteries', labId: 'physics' },
      'cat-chem-glassware': { name: 'Glassware', labId: 'chemistry' },
      'cat-chem-ppe': { name: 'Personal Protective Equipment', labId: 'chemistry' },
      'cat-chem-reagent': { name: 'Reagents', labId: 'chemistry' },
    },
    equipment: {
      // ---- IT Laboratory (durable only) ----
      'eq-it-lap-1': { labId: 'it', categoryId: 'cat-it-laptop', name: 'Acer Aspire 5 Laptop', description: 'Unit 1', itemType: 'durable', unitCode: 'IT-LAP-001', status: 'available', expirationDate: null, dateAcquired: '2023-08-01', createdAt: now, updatedAt: now },
      'eq-it-lap-2': { labId: 'it', categoryId: 'cat-it-laptop', name: 'Acer Aspire 5 Laptop', description: 'Unit 2', itemType: 'durable', unitCode: 'IT-LAP-002', status: 'borrowed', expirationDate: null, dateAcquired: '2023-08-01', createdAt: now, updatedAt: now },
      'eq-it-proj-1': { labId: 'it', categoryId: 'cat-it-projector', name: 'Epson EB-X06 Projector', description: 'Unit 1', itemType: 'durable', unitCode: 'IT-PROJ-001', status: 'available', expirationDate: null, dateAcquired: '2023-06-15', createdAt: now, updatedAt: now },

      // ---- Statistics Laboratory ----
      'eq-stat-calc-1': { labId: 'statistics', categoryId: 'cat-stat-calc', name: 'Casio FX-991 Calculator', description: 'Unit 1', itemType: 'durable', unitCode: 'STAT-CALC-001', status: 'available', expirationDate: null, dateAcquired: '2023-07-01', createdAt: now, updatedAt: now },
      'eq-stat-calc-2': { labId: 'statistics', categoryId: 'cat-stat-calc', name: 'Casio FX-991 Calculator', description: 'Unit 2', itemType: 'durable', unitCode: 'STAT-CALC-002', status: 'available', expirationDate: null, dateAcquired: '2023-07-01', createdAt: now, updatedAt: now },

      // ---- Mathematics Laboratory ----
      'eq-math-tools-1': { labId: 'mathematics', categoryId: 'cat-math-tools', name: 'Geometric Drafting Set', description: 'Unit 1', itemType: 'durable', unitCode: 'MATH-TOOL-001', status: 'available', expirationDate: null, dateAcquired: '2023-07-10', createdAt: now, updatedAt: now },

      // ---- Psychology Laboratory ----
      'eq-psych-kit-1': { labId: 'psychology', categoryId: 'cat-psych-testing', name: 'WAIS-IV Testing Kit', description: 'Unit 1', itemType: 'durable', unitCode: 'PSYCH-KIT-001', status: 'available', expirationDate: null, dateAcquired: '2023-05-01', createdAt: now, updatedAt: now },
      'eq-psych-timer-1': { labId: 'psychology', categoryId: 'cat-psych-timer', name: 'Digital Stopwatch', description: 'Unit 1', itemType: 'durable', unitCode: 'PSYCH-TMR-001', status: 'available', expirationDate: null, dateAcquired: '2023-05-01', createdAt: now, updatedAt: now },
      'eq-psych-sheets': { labId: 'psychology', categoryId: 'cat-psych-testing', name: 'Answer Sheets (Pack of 50)', description: 'Consumable test forms', itemType: 'consumable', stockQuantity: 12, unitOfMeasure: 'packs', reorderThreshold: 5, expirationDate: null, dateAcquired: '2024-01-10', createdAt: now, updatedAt: now },

      // ---- Physics Laboratory ----
      'eq-phys-multi-1': { labId: 'physics', categoryId: 'cat-phys-instruments', name: 'Digital Multimeter', description: 'Unit 1', itemType: 'durable', unitCode: 'PHYS-MM-001', status: 'available', expirationDate: null, dateAcquired: '2023-04-01', createdAt: now, updatedAt: now },
      'eq-phys-osc-1': { labId: 'physics', categoryId: 'cat-phys-instruments', name: 'Oscilloscope', description: 'Unit 1', itemType: 'durable', unitCode: 'PHYS-OSC-001', status: 'under_maintenance', expirationDate: null, dateAcquired: '2023-04-01', createdAt: now, updatedAt: now },
      'eq-phys-batt': { labId: 'physics', categoryId: 'cat-phys-batteries', name: 'AA Alkaline Batteries (Pack of 4)', description: 'For lab instruments', itemType: 'consumable', stockQuantity: 24, unitOfMeasure: 'packs', reorderThreshold: 6, expirationDate: daysFromNow(400), dateAcquired: '2024-02-01', createdAt: now, updatedAt: now },

      // ---- Chemistry Laboratory ----
      'eq-chem-beaker-1': { labId: 'chemistry', categoryId: 'cat-chem-glassware', name: '250mL Beaker', description: 'Unit 1', itemType: 'durable', unitCode: 'CHEM-BKR-001', status: 'available', expirationDate: null, dateAcquired: '2023-03-01', createdAt: now, updatedAt: now },
      'eq-chem-flask-1': { labId: 'chemistry', categoryId: 'cat-chem-glassware', name: 'Erlenmeyer Flask 500mL', description: 'Unit 1', itemType: 'durable', unitCode: 'CHEM-FLK-001', status: 'available', expirationDate: null, dateAcquired: '2023-03-01', createdAt: now, updatedAt: now },
      'eq-chem-gloves': { labId: 'chemistry', categoryId: 'cat-chem-ppe', name: 'Latex Gloves (Medium)', description: 'One-time use, box of 100', itemType: 'consumable', stockQuantity: 34, unitOfMeasure: 'pairs', reorderThreshold: 20, expirationDate: daysFromNow(18), dateAcquired: '2023-11-01', createdAt: now, updatedAt: now },
      'eq-chem-acid': { labId: 'chemistry', categoryId: 'cat-chem-reagent', name: 'Sulfuric Acid Reagent 500mL', description: 'Handle with care', itemType: 'consumable', stockQuantity: 3, unitOfMeasure: 'bottles', reorderThreshold: 2, expirationDate: daysFromNow(-12), dateAcquired: '2022-09-01', createdAt: now, updatedAt: now },
      'eq-chem-litmus': { labId: 'chemistry', categoryId: 'cat-chem-reagent', name: 'Litmus Paper', description: 'Box of 200 strips', itemType: 'consumable', stockQuantity: 8, unitOfMeasure: 'boxes', reorderThreshold: 3, expirationDate: daysFromNow(300), dateAcquired: '2024-01-01', createdAt: now, updatedAt: now },
    },
    transactions: {
      'tx-1': {
        kind: 'durable', labId: 'it', categoryId: 'cat-it-laptop', equipmentId: 'eq-it-lap-2', unitCode: 'IT-LAP-002',
        borrowerId: 'mock-borrower', borrowerName: 'Hazel Torres', purpose: 'Programming class', status: 'released',
        requestedAt: now, expectedReturn: daysFromNow(-3),
        decidedBy: 'mock-lab-it', decidedAt: now, releasedBy: 'mock-lab-it', releasedByName: 'Bea Custodio', releasedAt: now,
      },
      'tx-2': {
        kind: 'durable', labId: 'physics', categoryId: 'cat-phys-instruments', equipmentId: null,
        borrowerId: 'mock-borrower', borrowerName: 'Hazel Torres', purpose: 'Circuits laboratory activity',
        status: 'pending', requestedAt: now, expectedReturn: daysFromNow(5),
      },
      'tx-3': {
        kind: 'consumable', labId: 'chemistry', categoryId: 'cat-chem-ppe', equipmentId: 'eq-chem-gloves', unitCode: null,
        borrowerId: 'mock-borrower', borrowerName: 'Hazel Torres', purpose: 'Titration experiment',
        quantity: 10, status: 'issued', requestedAt: now,
        decidedBy: 'mock-lab-chemistry', decidedAt: now, issuedBy: 'mock-lab-chemistry', issuedByName: 'Gino Ramos', issuedAt: now,
      },
      'tx-4': {
        kind: 'consumable', labId: 'chemistry', categoryId: 'cat-chem-ppe', equipmentId: null,
        borrowerId: 'mock-borrower', borrowerName: 'Hazel Torres', purpose: 'Organic chemistry lab',
        quantity: 5, status: 'pending', requestedAt: now,
      },
      'tx-5': {
        kind: 'durable', labId: 'mathematics', categoryId: 'cat-math-tools', equipmentId: null,
        borrowerId: 'mock-borrower', borrowerName: 'Hazel Torres', purpose: 'Geometry demo (no longer needed)',
        status: 'cancelled', requestedAt: now, expectedReturn: daysFromNow(7), cancelledAt: now,
      },
      'tx-6': {
        kind: 'consumable', labId: 'chemistry', categoryId: 'cat-chem-reagent', equipmentId: null,
        borrowerId: 'mock-borrower', borrowerName: 'Hazel Torres', purpose: 'Extra acid for weekend experiment',
        quantity: 2, status: 'rejected', requestedAt: now,
        decidedBy: 'mock-lab-chemistry', decidedAt: now, rejectionReason: 'Remaining stock is expired — awaiting new shipment.',
      },
    },
    maintenance: {
      'mt-1': {
        labId: 'physics', equipmentId: 'eq-phys-osc-1', dateReported: now.slice(0, 10), problem: 'Display flickering intermittently',
        actionTaken: 'Sent to supplier for repair', resultingStatus: 'under_maintenance',
        recordedBy: 'mock-lab-physics', recordedByName: 'Fatima Cruz', createdAt: now,
      },
    },
    activityLogs: {
      'log-1': { userId: 'mock-lab-it', userName: 'Bea Custodio', action: 'release_equipment', details: 'Released IT-LAP-002 for transaction tx-1', createdAt: now },
      'log-2': { userId: 'mock-lab-chemistry', userName: 'Gino Ramos', action: 'issue_consumable', details: 'Issued 10 pairs of Latex Gloves (Medium) for transaction tx-3', createdAt: now },
    },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to reseed
  }
  const seeded = seedData();
  save(seeded);
  return seeded;
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let db = load();

export function getDb() {
  return db;
}

export function mutate(fn) {
  fn(db);
  save(db);
}

export function nextId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function resetMockDb() {
  db = seedData();
  save(db);
}

export function getMockAuthUid() {
  return localStorage.getItem(AUTH_KEY);
}

export function setMockAuthUid(uid) {
  if (uid) localStorage.setItem(AUTH_KEY, uid);
  else localStorage.removeItem(AUTH_KEY);
}

export { isoNow };

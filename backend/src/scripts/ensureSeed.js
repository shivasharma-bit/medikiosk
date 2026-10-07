// backend/src/scripts/ensureSeed.js — creates demo users on first start (safe to run every time)
import User from '../models/User.js';

const USERS = [
  { name: 'System Admin', email: 'admin@medikiosk.in', password: 'Admin@1234', role: 'ADMIN', hospital: 'City General Hospital' },
  { name: 'Dr. Priya Sharma', email: 'doctor@medikiosk.in', password: 'Doctor@1234', role: 'DOCTOR', specialty: 'General Medicine', department: 'OPD', licenseNumber: 'MCI-2025-001' },
  { name: 'Dr. Arjun Mehta', email: 'arjun.mehta@medikiosk.in', password: 'Doctor@1234', role: 'DOCTOR', specialty: 'Cardiology', department: 'Cardiology', licenseNumber: 'MCI-2025-002' },
];

export async function ensureSeedUsers() {
  for (const u of USERS) {
    if (await User.findOne({ email: u.email })) continue;
    await User.create({
      name: u.name, email: u.email, role: u.role,
      passwordHash: await User.hashPassword(u.password),
      specialty: u.specialty || null, department: u.department || null,
      licenseNumber: u.licenseNumber || null, hospital: u.hospital || null,
    });
    console.log(`[SEED] Created ${u.role}: ${u.email}`);
  }
}

import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Define DB Types
export interface Member {
  id: string;
  fullName: string;
  dob: string;
  gender: string;
  photoUrl: string;
  stateOfOrigin: string;
  lga: string;
  nigerianAddress: {
    street: string;
    city: string;
    state: string;
    phone: string;
  };
  overseasAddress: {
    country: string;
    state: string;
    city: string;
    street: string;
    phone: string;
  };
  identification: {
    passportNumber: string;
    ninNumber: string;
    documentUrl: string;
  };
  account: {
    email: string;
    passwordHash: string;
    phoneVerified: boolean;
    emailVerified: boolean;
    privacyConsent: boolean;
  };
  emergencyContacts: {
    nigeria: {
      name: string;
      relationship: string;
      address: string;
      phone: string;
    };
    overseas: {
      name: string;
      relationship: string;
      address: string;
      phone: string;
    };
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  diasporaId: string | null;
  issueDate: string | null;
  createdAt: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  memberId: string; // email or UUID
  memberName?: string;
  category: string;
  description: string;
  phoneNumber: string;
  location?: string;
  mediaUrls: string[]; // Cloudinary URLs
  status: 'SUBMITTED' | 'UNDER REVIEW' | 'REFERRED' | 'AGENCY RESPONSE' | 'ACTION TAKEN' | 'RESOLVED';
  referredAgency: string | null;
  isUrgent: boolean;
  country: string;
  createdAt: string;
  updatedAt: string;
  history: Array<{
    status: string;
    note: string;
    updatedBy: string;
    createdAt: string;
  }>;
}

export interface News {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  author: string;
}

// In-Memory / File Database fallback
const FILE_DB_PATH = path.join(process.cwd(), 'diaspora_data.json');

const defaultDb = {
  members: [] as Member[],
  cases: [] as Case[],
  news: [
    {
      id: 'news-1',
      title: 'Presidential Diaspora Support Portal Launched',
      content: 'The official SSA Diaspora engagement platform has launched, providing access to Diaspora IDs, consular assistance, and case referral systems.',
      category: 'Announcement',
      createdAt: new Date().toISOString(),
      author: 'Super Admin'
    }
  ] as News[]
};

function readLocalDb(): typeof defaultDb {
  if (!fs.existsSync(FILE_DB_PATH)) {
    fs.writeFileSync(FILE_DB_PATH, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
  try {
    const data = fs.readFileSync(FILE_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading local file database:', e);
    return defaultDb;
  }
}

function writeLocalDb(db: typeof defaultDb) {
  try {
    fs.writeFileSync(FILE_DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Error writing local file database:', e);
  }
}

// Neon Postgres Table Auto-Creation helper
async function initNeonDb(pool: Pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS diaspora_members (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        data JSONB NOT NULL,
        diaspora_id VARCHAR(50) UNIQUE,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS diaspora_cases (
        id VARCHAR(255) PRIMARY KEY,
        case_number VARCHAR(50) UNIQUE NOT NULL,
        member_id VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        country VARCHAR(100) NOT NULL,
        is_urgent BOOLEAN DEFAULT FALSE,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS diaspora_news (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        author VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Failed to auto-create Neon SQL tables:', error);
  }
}

// Check database environment
const databaseUrl = process.env.DATABASE_URL;
let neonPool: Pool | null = null;

if (databaseUrl) {
  try {
    neonPool = new Pool({ connectionString: databaseUrl });
    initNeonDb(neonPool);
  } catch (e) {
    console.error('Neon DB pool initialization error:', e);
  }
}

export const db = {
  // Members CRUD
  async getMembers(): Promise<Member[]> {
    if (neonPool) {
      try {
        const result = await neonPool.query(`SELECT data FROM diaspora_members ORDER BY created_at DESC`);
        return result.rows.map((r: any) => r.data as Member);
      } catch (e) {
        console.error('Neon fetch members error, falling back to local file:', e);
      }
    }
    return readLocalDb().members;
  },

  async getMemberByEmail(email: string): Promise<Member | null> {
    if (neonPool) {
      try {
        const result = await neonPool.query(`SELECT data FROM diaspora_members WHERE email = $1`, [email.toLowerCase()]);
        if (result.rows.length > 0) return result.rows[0].data as Member;
        return null;
      } catch (e) {
        console.error('Neon getMemberByEmail error, falling back to local file:', e);
      }
    }
    const local = readLocalDb();
    return local.members.find(m => m.account.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async getMemberByDiasporaId(diasporaId: string): Promise<Member | null> {
    if (neonPool) {
      try {
        const result = await neonPool.query(`SELECT data FROM diaspora_members WHERE diaspora_id = $1`, [diasporaId]);
        if (result.rows.length > 0) return result.rows[0].data as Member;
        return null;
      } catch (e) {
        console.error('Neon getMemberByDiasporaId error, falling back to local file:', e);
      }
    }
    const local = readLocalDb();
    return local.members.find(m => m.diasporaId === diasporaId) || null;
  },

  async createMember(member: Member): Promise<Member> {
    if (neonPool) {
      try {
        await neonPool.query(
          `INSERT INTO diaspora_members (id, email, data, diaspora_id, status) VALUES ($1, $2, $3, $4, $5)`,
          [member.id, member.account.email.toLowerCase(), JSON.stringify(member), member.diasporaId, member.status]
        );
        return member;
      } catch (e) {
        console.error('Neon createMember error, using local file:', e);
      }
    }
    const local = readLocalDb();
    local.members.push(member);
    writeLocalDb(local);
    return member;
  },

  async updateMember(member: Member): Promise<Member> {
    if (neonPool) {
      try {
        await neonPool.query(
          `UPDATE diaspora_members SET data = $1, diaspora_id = $2, status = $3 WHERE email = $4`,
          [JSON.stringify(member), member.diasporaId, member.status, member.account.email.toLowerCase()]
        );
        return member;
      } catch (e) {
        console.error('Neon updateMember error, using local file:', e);
      }
    }
    const local = readLocalDb();
    const idx = local.members.findIndex(m => m.id === member.id);
    if (idx !== -1) {
      local.members[idx] = member;
      writeLocalDb(local);
    }
    return member;
  },

  // Cases CRUD
  async getCases(): Promise<Case[]> {
    if (neonPool) {
      try {
        const result = await neonPool.query(`SELECT data FROM diaspora_cases ORDER BY created_at DESC`);
        return result.rows.map((r: any) => r.data as Case);
      } catch (e) {
        console.error('Neon getCases error, using local file:', e);
      }
    }
    return readLocalDb().cases;
  },

  async getCasesByMember(email: string): Promise<Case[]> {
    if (neonPool) {
      try {
        const result = await neonPool.query(`SELECT data FROM diaspora_cases WHERE member_id = $1 ORDER BY created_at DESC`, [email.toLowerCase()]);
        return result.rows.map((r: any) => r.data as Case);
      } catch (e) {
        console.error('Neon getCasesByMember error, using local file:', e);
      }
    }
    return readLocalDb().cases.filter(c => c.memberId === email);
  },

  async createCase(newCase: Case): Promise<Case> {
    if (neonPool) {
      try {
        await neonPool.query(
          `INSERT INTO diaspora_cases (id, case_number, member_id, category, status, country, is_urgent, data) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [newCase.id, newCase.caseNumber, newCase.memberId.toLowerCase(), newCase.category, newCase.status, newCase.country, newCase.isUrgent, JSON.stringify(newCase)]
        );
        return newCase;
      } catch (e) {
        console.error('Neon createCase error, using local file:', e);
      }
    }
    const local = readLocalDb();
    local.cases.push(newCase);
    writeLocalDb(local);
    return newCase;
  },

  async updateCase(updatedCase: Case): Promise<Case> {
    if (neonPool) {
      try {
        await neonPool.query(
          `UPDATE diaspora_cases SET status = $1, is_urgent = $2, data = $3 WHERE id = $4`,
          [updatedCase.status, updatedCase.isUrgent, JSON.stringify(updatedCase), updatedCase.id]
        );
        return updatedCase;
      } catch (e) {
        console.error('Neon updateCase error, using local file:', e);
      }
    }
    const local = readLocalDb();
    const idx = local.cases.findIndex(c => c.id === updatedCase.id);
    if (idx !== -1) {
      local.cases[idx] = updatedCase;
      writeLocalDb(local);
    }
    return updatedCase;
  },

  // News CRUD
  async getNews(): Promise<News[]> {
    if (neonPool) {
      try {
        const result = await neonPool.query(`SELECT id, title, content, category, author, created_at FROM diaspora_news ORDER BY created_at DESC`);
        return result.rows.map((r: any) => ({
          id: r.id,
          title: r.title,
          content: r.content,
          category: r.category,
          author: r.author,
          createdAt: r.created_at.toISOString ? r.created_at.toISOString() : r.created_at
        }));
      } catch (e) {
        console.error('Neon getNews error, using local file:', e);
      }
    }
    return readLocalDb().news;
  },

  async createNews(item: News): Promise<News> {
    if (neonPool) {
      try {
        await neonPool.query(
          `INSERT INTO diaspora_news (id, title, content, category, author, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
          [item.id, item.title, item.content, item.category, item.author, item.createdAt]
        );
        return item;
      } catch (e) {
        console.error('Neon createNews error, using local file:', e);
      }
    }
    const local = readLocalDb();
    local.news.unshift(item);
    writeLocalDb(local);
    return item;
  },

  // Helpers to get next sequence numbers cleanly
  async getNextMemberSequence(): Promise<number> {
    const members = await this.getMembers();
    const approved = members.filter(m => m.diasporaId);
    if (approved.length === 0) return 1;
    
    let max = 0;
    approved.forEach(m => {
      if (m.diasporaId) {
        const parts = m.diasporaId.split('-');
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });
    return max + 1;
  },

  async getNextCaseSequence(): Promise<number> {
    const cases = await this.getCases();
    if (cases.length === 0) return 1;
    
    let max = 0;
    cases.forEach(c => {
      const parts = c.caseNumber.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > max) max = num;
    });
    return max + 1;
  }
};

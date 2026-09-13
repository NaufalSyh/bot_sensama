// =====================================================
// SESSION.JS
// Menyimpan sementara data KTP setiap user
// =====================================================

const sessions = new Map();
export function createSession(userId) {
  const session = {
    userId,
    data: {},
    createdAt: Date.now()
  };

  sessions.set(userId, session);

  return session;
}


// =====================================================
// MENGAMBIL SESSION
export function getSession(userId) {
  return sessions.get(userId);
}

// =====================================================
// UPDATE SESSION
export function updateSession(userId, data) {
  const session = sessions.get(userId);

  if (!session) {
    return null;
  }

  session.data = {
    ...session.data,
    ...data
  };

  return session;
}


// =====================================================
// HAPUS SESSION
export function deleteSession(userId) {
  sessions.delete(userId);
}


// =====================================================
// CEK SESSION
export function hasSession(userId) {
  return sessions.has(userId);
}
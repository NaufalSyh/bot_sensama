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

export function getSession(userId) {
  return sessions.get(userId);
}

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

export function deleteSession(userId) {
  sessions.delete(userId);
}
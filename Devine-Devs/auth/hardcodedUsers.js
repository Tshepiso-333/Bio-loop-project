export const HARDCODED_USERS = [
  {
    email: 'thobile23@gmail.com',
    password: 'thobile23',
    role: 'driver',
    label: 'Driver Side',
  },
];

export const normalizeEmail = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

export const findUserByEmail = (email) =>
  HARDCODED_USERS.find((user) => user.email === normalizeEmail(email)) || null;

export const validateCredentials = (email, password) => {
  const user = findUserByEmail(email);

  if (!user || user.password !== password) {
    return null;
  }

  return user;
};

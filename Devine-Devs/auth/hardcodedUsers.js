export const HARDCODED_USERS = [
  {
    email: 'thobile23@gmail.com',
    password: 'thobile23',
    role: 'driver',
  },
  {
    email: 'kg@gmail.com',
    password: 'KB12',
    role: 'manufacturer',
  },
  {
    email: 'tshepisomolefe1605@gmail.com',
    password: 'Tshepiso333',
    role: 'restaurant',
  },
  {
    email: 'admin@gmail.com',
    password: 'admin',
    role: 'admin',
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

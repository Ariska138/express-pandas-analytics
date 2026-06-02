import bcrypt from 'bcryptjs'

const users = [
  {
    id: 1,
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin'
  }
]

export const findUser = (username) => users.find(u => u.username === username)

export const validatePassword = (inputPassword, hashedPassword) => {
  return bcrypt.compareSync(inputPassword, hashedPassword)
}

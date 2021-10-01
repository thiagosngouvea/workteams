import jwt from 'jsonwebtoken'
import { useEffect, useState } from 'react'
import apiClient from '../index'

export default function useJwt() {
  const [users, setUser] = useState('')

  useEffect(() => {
    apiClient.get(`/users`).then((response) => {
      setUser(response.data)
      console.log('***', response.data)
    })
  }, [])

  const jwtConfig = {
    secret: 'RM8EPpgXwovR9fp6ryDIoGHAB6iHsc0fb',
    expiresIn: 1 * 24 * 60 * 60 * 1000,
  }

  apiClient.onPost('/users/authentication').reply((request) => {
    const { email, password } = JSON.parse(request.data)
    const user = users.find((item) => item.email === email && item.password === password)
    const error = user ? 'Something went wrong.' : 'Login failed, please try again'

    if (user) {
      const userData = Object.assign({}, user)
      delete userData.password
      userData.accessToken = jwt.sign({ id: userData.id }, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn,
      }) // generate jwt token

      return [200, userData]
    }

    return [401, error]
  })

  apiClient.onPost('/api/auth/register').reply((request) => {
    const { email, password, name } = JSON.parse(request.data)
    const isAlreadyRegistered = users.find((user) => user.email === email)

    if (!isAlreadyRegistered) {
      const user = {
        id: users.length + 1,
        email,
        password,
        name,
        avatar: '',
        role: 'admin',
      }
      users.push(user)

      const userData = Object.assign({}, user)
      delete userData.password
      userData.accessToken = jwt.sign({ id: userData.id }, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn,
      })

      return [200, userData]
    }

    return [401, 'This email is already in use.']
  })

  apiClient.onGet('/api/auth/account').reply((request) => {
    const { AccessToken } = request.headers
    if (AccessToken) {
      const { id } = jwt.verify(AccessToken, jwtConfig.secret)
      const userData = Object.assign(
        {},
        users.find((item) => item.id === id),
      )
      delete userData.password
      userData.accessToken = jwt.sign({ id: userData.id }, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn,
      }) // refresh jwt token

      return [200, userData]
    }

    return [401]
  })

  apiClient.onGet('/api/auth/logout').reply(() => {
    return [200]
  })
}

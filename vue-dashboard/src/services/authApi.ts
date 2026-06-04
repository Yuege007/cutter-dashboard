import http from './http'

export interface LoginResponseData {
  serverUrl?: string
  ct_url?: string
  token?: string
  user?: any
  [key: string]: any
}

export const authApi = {
  login: (mobile: string, password: string, tokenCode: string) =>
    http.post<LoginResponseData>('/plat/cutterApi/checkPassWordLogin', null, {
      params: { mobile, passWord: password, token_code: tokenCode }
    })
}

export default authApi

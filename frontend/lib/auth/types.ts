import { JWTPayload } from 'jose'

export type DecodedKeycloakToken = JWTPayload & {
  preferred_username?: string
  email?: string
  roles?: string[] | string
  groups?: string[] | string
  realm_access?: {
    roles?: string[]
  }
}

export type ParsedAuthTokenResult = {
  email: string
  roles: string[]
}

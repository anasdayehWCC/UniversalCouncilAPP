import { jwtVerify, JWTPayload, decodeJwt, errors, importSPKI } from 'jose'
import { DecodedKeycloakToken, ParsedAuthTokenResult } from './types'

export async function isAuthorisedUser(header: string): Promise<boolean> {
  const parsedToken = await parseAuthToken(header)
  return parsedToken !== null
}

async function parseAuthToken(
  header: string
): Promise<ParsedAuthTokenResult | null> {
  if (!header) {
    console.error('No auth token provided to parse')
    return null
  }

  const verifyJwtSource =
    Boolean(process.env.AUTH_PROVIDER_PUBLIC_KEY) && !process.env.DISABLE_AUTH_SIGNATURE_VERIFICATION
  const tokenContent = await getDecodedJwt(header, verifyJwtSource)

  if (!tokenContent) {
    return null
  }

  const email =
    (tokenContent as DecodedKeycloakToken).preferred_username || (tokenContent as DecodedKeycloakToken).email
  if (!email) {
    console.error('No email found in token')
    return null
  }

  const roles = (tokenContent as DecodedKeycloakToken).roles || []
  console.debug(`Roles found for user ${email}: ${roles}`)
  return {
    email,
    roles: Array.isArray(roles) ? roles : [roles],
  }
}

async function getDecodedJwt(
  header: string,
  verifyJwtSource: boolean
): Promise<DecodedKeycloakToken | null> {
  let decodedToken: JWTPayload | null = null

  try {
    if (verifyJwtSource) {
      const publicKeyEncoded = process.env.AUTH_PROVIDER_PUBLIC_KEY! // This is passed into the environment by ECS
      const pemPublicKey = convertToPemPublicKey(publicKeyEncoded)
      const publicKey = await importSPKI(pemPublicKey, 'RS256')

      try {
        // Verify with signature
        const { payload } = await jwtVerify(header, publicKey, {
          algorithms: ['RS256'],
          audience: 'account',
        })

        decodedToken = payload
      } catch (error) {
        if (error instanceof errors.JWTExpired) {
          console.error('JWT has expired:', error.message)
          return null
        } else if (error instanceof errors.JWTInvalid) {
          console.error('Malformed JWT:', error.message)
          return null
        }
        console.error('Unexpected JWT verification error:', error)
        return null
      }
    } else {
      // Decode without verification
      try {
        decodedToken = decodeJwt(header)
      } catch (error) {
        console.error('Malformed JWT during decoding:', error)
        return null
      }
    }
    return decodedToken as DecodedKeycloakToken
  } catch (error) {
    console.error('Unexpected error in getDecodedJwt:', error)
    return null
  }
}

function convertToPemPublicKey(keyBase64: string): string {
  return `-----BEGIN PUBLIC KEY-----\n${keyBase64}\n-----END PUBLIC KEY-----`
}

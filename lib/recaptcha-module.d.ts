declare module 'lib/recaptcha' {
  export function verifyRecaptcha(token: string): Promise<boolean>
}

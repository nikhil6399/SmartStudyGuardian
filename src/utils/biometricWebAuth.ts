const BIOMETRIC_CRED_KEY = 'jee_guardian_biometric_cred_id_v1';
const BIOMETRIC_PIN_KEY = 'jee_guardian_fallback_pin_v1';

function randomChallenge(size = 32): Uint8Array {
  const buf = new Uint8Array(size);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < size; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  return buf;
}

function bytesToBase64Url(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(b64url: string): ArrayBuffer {
  const base64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function isPlatformBiometricAvailable(): Promise<boolean> {
  try {
    if (
      typeof window === 'undefined' ||
      typeof PublicKeyCredential === 'undefined' ||
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function'
    ) {
      return false;
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function hasEnrolledWebBiometric(): boolean {
  try {
    return Boolean(localStorage.getItem(BIOMETRIC_CRED_KEY));
  } catch {
    return false;
  }
}

export function setFallbackStudyPin(pin: string): void {
  try {
    const clean = pin.replace(/\D/g, '').slice(0, 6);
    if (clean.length >= 4) {
      localStorage.setItem(BIOMETRIC_PIN_KEY, btoa(clean));
    }
  } catch {
    // Ignore storage issues
  }
}

export function hasFallbackStudyPin(): boolean {
  try {
    return Boolean(localStorage.getItem(BIOMETRIC_PIN_KEY));
  } catch {
    return false;
  }
}

export function verifyFallbackStudyPin(pin: string): boolean {
  try {
    const stored = localStorage.getItem(BIOMETRIC_PIN_KEY);
    if (!stored) return false;
    return atob(stored) === pin.replace(/\D/g, '').slice(0, 6);
  } catch {
    return false;
  }
}

export function clearWebBiometricCredentials(): void {
  try {
    localStorage.removeItem(BIOMETRIC_CRED_KEY);
    localStorage.removeItem(BIOMETRIC_PIN_KEY);
  } catch {
    // Ignore
  }
}

export async function enrollWebBiometric(userLabel: string): Promise<{
  ok: boolean;
  mode: 'webauthn' | 'pin_only';
  message: string;
}> {
  const supported = await isPlatformBiometricAvailable();
  if (!supported || typeof navigator?.credentials?.create !== 'function') {
    return {
      ok: false,
      mode: 'pin_only',
      message: 'Hardware fingerprint sensor unavailable in this browser frame. Set a 4-digit Study Lock PIN instead.',
    };
  }

  try {
    const userId = randomChallenge(16);
    const challenge = randomChallenge(32);
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: challenge.buffer as ArrayBuffer,
        rp: { name: 'AI Study Guardian' },
        user: {
          id: userId.buffer as ArrayBuffer,
          name: userLabel || 'student@studyguardian.ai',
          displayName: userLabel || 'Student',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!credential?.rawId) {
      return {
        ok: false,
        mode: 'pin_only',
        message: 'Fingerprint enrollment was cancelled. You can use a 4-digit Study PIN.',
      };
    }

    localStorage.setItem(BIOMETRIC_CRED_KEY, bytesToBase64Url(credential.rawId));
    return {
      ok: true,
      mode: 'webauthn',
      message: 'Fingerprint / device biometric enrolled successfully.',
    };
  } catch {
    return {
      ok: false,
      mode: 'pin_only',
      message: 'Browser/iframe blocked hardware fingerprint prompt. Use the 4-digit Study PIN lock.',
    };
  }
}

export async function verifyWebBiometric(): Promise<{ ok: boolean; message: string }> {
  const credId = localStorage.getItem(BIOMETRIC_CRED_KEY);
  if (!credId || typeof navigator?.credentials?.get !== 'function') {
    return { ok: false, message: 'No hardware fingerprint registered; enter your Study PIN.' };
  }

  try {
    const challenge = randomChallenge(32);
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge.buffer as ArrayBuffer,
        allowCredentials: [
          {
            id: base64UrlToBytes(credId),
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    if (assertion) {
      return { ok: true, message: 'Fingerprint verified.' };
    }
    return { ok: false, message: 'Fingerprint verification cancelled.' };
  } catch {
    return { ok: false, message: 'Fingerprint prompt dismissed or unavailable; enter your Study PIN.' };
  }
}

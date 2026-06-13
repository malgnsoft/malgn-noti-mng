// 회원 인증 상태/액션 — /api/auth/* 래퍼.
export interface AuthMember {
  id: number
  loginId: string
  name: string
  company: string
  role: string
  grade: string // admin | member (권한 등급)
  email: string
  phone: string
  source: string // direct | office
  officeId: string | null
  status: string // pending | active | suspended
  agreedAt: string | null
  createdAt: string
  updatedAt: string | null
}

export interface SignupPayload {
  loginId: string
  password: string
  name: string
  company: string
  role: string
  email: string
  phone: string
  agreedPrivacy: boolean
}

export interface ProfileUpdatePayload {
  name: string
  company: string
  role: string
  email: string
  phone: string
}

export function useAuth() {
  const member = useState<AuthMember | null>('auth:member', () => null)
  const isAuthed = computed(() => !!member.value)
  const isAdmin = computed(() => member.value?.grade === 'admin')

  async function refresh() {
    const res = await useRequestFetch()<{ data: AuthMember | null }>('/api/auth/me')
    member.value = res.data
    return member.value
  }

  async function login(loginId: string, password: string) {
    const res = await $fetch<{ data: AuthMember }>('/api/auth/login', {
      method: 'POST',
      body: { loginId, password },
    })
    member.value = res.data
    return res.data
  }

  // 회원가입은 관리자 승인 대기(pending) — 세션 미발급, member 설정하지 않음.
  async function signup(payload: SignupPayload) {
    const res = await $fetch<{ data: { pending: boolean, name: string } }>('/api/auth/signup', {
      method: 'POST',
      body: payload,
    })
    return res.data
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    member.value = null
  }

  async function updateProfile(patch: ProfileUpdatePayload) {
    const res = await $fetch<{ data: AuthMember }>('/api/account', {
      method: 'PATCH',
      body: patch,
    })
    member.value = res.data
    return res.data
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    await $fetch('/api/account/password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    })
  }

  return { member, isAuthed, isAdmin, refresh, login, signup, logout, updateProfile, changePassword }
}

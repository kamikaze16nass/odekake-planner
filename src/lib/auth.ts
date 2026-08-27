import { supabase } from '@/lib/supabase'

export const signInAnonymously = async () => {
  const {
    data: {
      session: existingSession,
    },
  } = await supabase.auth.getSession()

  if (existingSession) {
    return existingSession.user
  }

  const {
    data,
    error,
  } = await supabase.auth.signInAnonymously()

  if (error) {
    console.error(
      '匿名ログインに失敗しました:',
      error,
    )

    return null
  }

  return data.user
}
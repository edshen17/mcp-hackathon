import { acceptHMRUpdate, defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  /**
   * Current named of the user.
   */
  const savedName = ref('')
  const previousNames = ref(new Set<string>())
  const isLoggedIn = ref(false)
  const userEmail = ref('')

  const usedNames = computed(() => Array.from(previousNames.value))
  const otherNames = computed(() => usedNames.value.filter(name => name !== savedName.value))

  /**
   * Changes the current name of the user and saves the one that was used
   * before.
   *
   * @param name - new name to set
   */
  function setNewName(name: string) {
    if (savedName.value)
      previousNames.value.add(savedName.value)

    savedName.value = name
  }

  /**
   * Updates user authentication state
   * 
   * @param email - user email
   * @param loggedIn - login status
   */
  function updateAuthState(email: string | null, loggedIn: boolean) {
    isLoggedIn.value = loggedIn
    userEmail.value = email || ''
    
    // If user has an email, set it as the name
    if (email)
      setNewName(email.split('@')[0])
  }

  /**
   * Sign out the current user
   */
  async function signOut() {
    const client = useSupabaseClient()
    await client.auth.signOut()
    isLoggedIn.value = false
    userEmail.value = ''
  }

  // Initialize auth state from Supabase
  const supabaseUser = useSupabaseUser()
  
  watchEffect(() => {
    if (supabaseUser.value) {
      updateAuthState(supabaseUser.value.email, true)
    }
    else {
      updateAuthState(null, false)
    }
  })

  return {
    setNewName,
    otherNames,
    savedName,
    isLoggedIn,
    userEmail,
    updateAuthState,
    signOut,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))

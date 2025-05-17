export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  
  // If user is not logged in and trying to access a protected page
  if (!user.value) {
    // Get the path the user is trying to access to redirect back after login
    const redirectPath = to.fullPath !== '/products' ? `?redirect=${to.fullPath}` : ''
    
    // Redirect to login page
    return navigateTo(`/log-in${redirectPath}`)
  }
})
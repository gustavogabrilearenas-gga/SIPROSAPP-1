// Script para probar el login y la carga de usuarios
const testLogin = async () => {
  try {
    console.log('🔐 Iniciando login...')
    
    // Hacer login
    const loginResponse = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'sandz334@'
      })
    })
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`)
    }
    
    const loginData = await loginResponse.json()
    console.log('✅ Login exitoso:', loginData)
    
    // Probar endpoint de usuarios
    const usersResponse = await fetch('http://localhost:8000/api/usuarios/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.access}`,
        'Content-Type': 'application/json',
      }
    })
    
    if (!usersResponse.ok) {
      throw new Error(`Users API failed: ${usersResponse.status}`)
    }
    
    const usersData = await usersResponse.json()
    console.log('✅ Usuarios cargados:', usersData)
    
    return { login: loginData, users: usersData }
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

// Ejecutar si estamos en el navegador
if (typeof window !== 'undefined') {
  testLogin()
    .then(result => {
      console.log('🎉 Prueba completada:', result)
    })
    .catch(error => {
      console.error('💥 Error en la prueba:', error)
    })
}

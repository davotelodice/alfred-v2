const fetch = require('node-fetch')
require('dotenv').config({ path: '.env.local' })

const BASE_URL = 'http://localhost:3000'
const WEBHOOK_TOKEN = process.env.WEBHOOK_SECRET_TOKEN

async function testAPI(endpoint, options = {}) {
  try {
    console.log(`🔍 Probando ${endpoint}...`)
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log(`✅ ${endpoint}: OK`)
      if (data.data && Array.isArray(data.data)) {
        console.log(`   📊 ${data.data.length} elementos encontrados`)
      }
    } else {
      console.log(`❌ ${endpoint}: ${response.status} - ${data.error || data.message}`)
    }
    
    return { success: response.ok, data }
  } catch (error) {
    console.log(`❌ ${endpoint}: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testAllAPIs() {
  console.log('🚀 Iniciando pruebas de API...\n')

  // Probar endpoints GET
  await testAPI('/api/categories')
  await testAPI('/api/transactions')
  await testAPI('/api/kpis')
  await testAPI('/api/advice')

  // Probar webhook n8n
  if (WEBHOOK_TOKEN) {
    await testAPI('/api/webhook/n8n', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WEBHOOK_TOKEN}`
      },
      body: JSON.stringify({
        telefono: '+34600000000',
        tipo: 'gasto',
        monto: 25.50,
        descripcion: 'Prueba desde script',
        categoria: 'Alimentación'
      })
    })
  } else {
    console.log('⚠️  WEBHOOK_SECRET_TOKEN no configurado, saltando prueba de webhook')
  }

  console.log('\n✅ Pruebas completadas')
}

// Verificar que el servidor esté corriendo
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/categories`)
    return response.ok
  } catch (error) {
    return false
  }
}

async function main() {
  console.log('🔍 Verificando que el servidor esté corriendo...')
  
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    console.log('❌ Servidor no está corriendo en http://localhost:3000')
    console.log('💡 Ejecuta: npm run dev')
    process.exit(1)
  }

  console.log('✅ Servidor detectado\n')
  await testAllAPIs()
}

main().catch(console.error)
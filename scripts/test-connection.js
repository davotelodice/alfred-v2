const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno faltantes')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a Supabase...')
    
    // Probar conexión básica
    const { data, error } = await supabase
      .from('contable_users')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Error de conexión:', error.message)
      return
    }

    console.log('✅ Conexión exitosa a Supabase')
    
    // Probar tablas del proyecto
    const tables = [
      'contable_users',
      'contable_categories', 
      'contable_transactions',
      'contable_kpi_summary',
      'contable_advice'
    ]

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)

        if (error) {
          console.log(`⚠️  Tabla ${table}: ${error.message}`)
        } else {
          console.log(`✅ Tabla ${table}: OK`)
        }
      } catch (err) {
        console.log(`❌ Tabla ${table}: ${err.message}`)
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

testConnection()
import { supabase } from '../supabase';

/**
 * Debug Supabase connection and table access
 */
export async function debugSupabaseConnection() {
  console.log('🔍 Debugging Supabase connection...');
  
  try {
    // Test 1: Basic connection
    console.log('📡 Testing basic connection...');
    const { data: healthData, error: healthError } = await supabase
      .from('asset_cache')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Connection error:', healthError);
      return { success: false, error: healthError };
    }
    
    console.log('✅ Basic connection successful');
    
    // Test 2: Try to read from table
    console.log('📖 Testing table read access...');
    const { data: readData, error: readError } = await supabase
      .from('asset_cache')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error('❌ Read access error:', readError);
      return { success: false, error: readError };
    }
    
    console.log('✅ Read access successful');
    console.log('📊 Current table data:', readData);
    
    // Test 3: Try to upsert a test record (was insert)
    console.log('📝 Testing table upsert access...');
    const testAsset = {
      asset_id: 999999,
      name: 'Debug Test Asset',
      ticker: 'DEBUG',
      decimals: 6,
      is_verified: false,
    };

    const { data: upsertData, error: upsertError, status: upsertStatus } = await supabase
      .from('asset_cache')
      .upsert(testAsset, { onConflict: 'asset_id' })
      .select('asset_id, name, ticker, decimals, is_verified, updated_at')
      .single();

    console.log('🔎 Supabase upsert request status:', upsertStatus);
    if (upsertError) {
      console.error('❌ Upsert access error:', upsertError);
      console.error('❌ Error details:', {
        code: upsertError.code,
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
      });
      return { success: false, error: upsertError };
    }

    console.log('✅ Upsert access successful');
    console.log('📊 Upserted data:', upsertData);
    
    // Test 4: Clean up test record
    console.log('🧹 Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('asset_cache')
      .delete()
      .eq('asset_id', 999999);
    
    if (deleteError) {
      console.error('❌ Delete access error:', deleteError);
    } else {
      console.log('✅ Delete access successful');
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { success: false, error };
  }
}

/**
 * Check table structure
 */
export async function checkTableStructure() {
  console.log('🏗️ Checking table structure...');
  
  try {
    // Try to get table info by attempting different field combinations
    const testQueries = [
      { select: 'asset_id, name, ticker' },
      { select: 'id, asset_id, name' },
      { select: '*' },
    ];
    
    for (const query of testQueries) {
      console.log(`🔍 Testing query: ${query.select}`);
      const { data, error } = await supabase
        .from('asset_cache')
        .select(query.select)
        .limit(1);
      
      if (error) {
        console.error(`❌ Query failed: ${query.select}`, error);
      } else {
        console.log(`✅ Query successful: ${query.select}`);
        console.log('📊 Sample data structure:', data);
        break;
      }
    }
    
  } catch (error) {
    console.error('❌ Table structure check error:', error);
  }
}

/**
 * Test RLS policies
 */
export async function testRLSPolicies() {
  console.log('🔒 Testing RLS policies...');
  
  try {
    // Test if we can see any data
    const { data, error } = await supabase
      .from('asset_cache')
      .select('*');
    
    if (error) {
      console.error('❌ RLS policy error:', error);
      return false;
    }
    
    console.log('✅ RLS allows read access');
    console.log(`📊 Found ${data?.length || 0} records`);
    
    return true;
    
  } catch (error) {
    console.error('❌ RLS test error:', error);
    return false;
  }
} 
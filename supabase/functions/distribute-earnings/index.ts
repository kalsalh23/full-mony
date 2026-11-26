import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const today = new Date().toISOString().split('T')[0]

    // Get all active investments that haven't earned today
    const { data: investments, error: invError } = await supabase
      .from('investments')
      .select(`
        id,
        user_id,
        amount,
        end_date,
        plans!inner(daily_rate)
      `)
      .eq('status', 'active')
      .gt('end_date', new Date().toISOString())

    if (invError) throw invError

    let processed = 0
    let totalEarnings = 0

    for (const investment of investments || []) {
      // Check if already earned today
      const { data: existing } = await supabase
        .from('earnings')
        .select('id')
        .eq('investment_id', investment.id)
        .eq('date', today)
        .single()

      if (existing) continue

      const dailyRate = investment.plans.daily_rate
      const dailyEarning = (investment.amount * dailyRate) / 100

      // Insert earnings record
      const { error: earnError } = await supabase
        .from('earnings')
        .insert({
          investment_id: investment.id,
          user_id: investment.user_id,
          amount: dailyEarning,
          date: today
        })

      if (earnError) {
        console.error(`Error inserting earnings for ${investment.id}:`, earnError)
        continue
      }

      // Update user balance
      const { error: balError } = await supabase.rpc('increment_balance', {
        p_user_id: investment.user_id,
        p_amount: dailyEarning
      })

      if (balError) {
        console.error(`Error updating balance for ${investment.user_id}:`, balError)
        continue
      }

      processed++
      totalEarnings += dailyEarning
    }

    // Mark completed investments
    const { error: completeError } = await supabase
      .from('investments')
      .update({ status: 'completed' })
      .eq('status', 'active')
      .lte('end_date', new Date().toISOString())

    if (completeError) console.error('Error completing investments:', completeError)

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        totalEarnings,
        date: today
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
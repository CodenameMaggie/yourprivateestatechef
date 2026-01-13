// ============================================================================
// YPEC STRIPE PAYMENT INTEGRATION
// Purpose: Handle consultation deposits and service payments
// ============================================================================

const { getSupabase } = require('./database');

// Stripe will be initialized when keys are provided
let stripe = null;

function initializeStripe() {
  if (process.env.STRIPE_SECRET_KEY && !stripe) {
    try {
      const Stripe = require('stripe');
      stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      console.log('[Payments] Stripe initialized');
    } catch (error) {
      console.warn('[Payments] Stripe module not installed or keys not set');
    }
  }
  return stripe;
}

module.exports = async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'create_checkout':
        return await createCheckoutSession(req, res, data);

      case 'verify_payment':
        return await verifyPayment(req, res, data);

      case 'refund':
        return await processRefund(req, res, data);

      case 'status':
        return res.json({
          stripe_enabled: !!initializeStripe(),
          message: stripe ? 'Stripe active' : 'Stripe not configured (add STRIPE_SECRET_KEY to enable)'
        });

      default:
        return res.status(400).json({
          error: 'Invalid action',
          available_actions: ['create_checkout', 'verify_payment', 'refund', 'status']
        });
    }
  } catch (error) {
    console.error('[Payments] Error:', error);
    return res.status(500).json({
      error: 'Payment processing failed',
      message: error.message
    });
  }
};

async function createCheckoutSession(req, res, data) {
  const stripeClient = initializeStripe();

  if (!stripeClient) {
    // Stripe not configured - allow booking without payment
    return res.json({
      success: true,
      payment_required: false,
      message: 'Booking confirmed - payment processing not yet enabled'
    });
  }

  const { household_id, service_type, amount, description, customer_email } = data;

  try {
    // Create Stripe checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `YPEC ${service_type}`,
              description: description || 'Your Private Estate Chef service',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.DOMAIN || 'https://yourprivateestatechef.com'}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN || 'https://yourprivateestatechef.com'}/booking.html`,
      customer_email: customer_email,
      metadata: {
        household_id: household_id,
        service_type: service_type
      }
    });

    // Log payment intent
    await getSupabase().from('ypec_invoices').insert({
      household_id: household_id,
      invoice_date: new Date().toISOString(),
      amount_due: amount,
      payment_status: 'pending',
      stripe_session_id: session.id,
      notes: `Stripe checkout session created for ${service_type}`
    });

    return res.json({
      success: true,
      payment_required: true,
      checkout_url: session.url,
      session_id: session.id
    });
  } catch (error) {
    console.error('[Payments] Stripe checkout error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
}

async function verifyPayment(req, res, data) {
  const stripeClient = initializeStripe();

  if (!stripeClient) {
    return res.json({ verified: false, message: 'Stripe not configured' });
  }

  const { session_id } = data;

  try {
    const session = await stripeClient.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      // Update invoice
      await getSupabase()
        .from('ypec_invoices')
        .update({
          payment_status: 'paid',
          payment_date: new Date().toISOString(),
          payment_method: session.payment_method_types[0]
        })
        .eq('stripe_session_id', session_id);

      return res.json({
        verified: true,
        payment_status: 'paid',
        amount: session.amount_total / 100
      });
    }

    return res.json({
      verified: false,
      payment_status: session.payment_status
    });
  } catch (error) {
    console.error('[Payments] Verification error:', error);
    return res.status(500).json({
      error: 'Failed to verify payment',
      message: error.message
    });
  }
}

async function processRefund(req, res, data) {
  const stripeClient = initializeStripe();

  if (!stripeClient) {
    return res.json({ success: false, message: 'Stripe not configured' });
  }

  const { payment_intent_id, amount, reason } = data;

  try {
    const refund = await stripeClient.refunds.create({
      payment_intent: payment_intent_id,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
      reason: reason || 'requested_by_customer'
    });

    // Log refund
    await getSupabase()
      .from('ypec_invoices')
      .update({
        payment_status: 'refunded',
        notes: `Refund processed: $${refund.amount / 100}. Reason: ${reason}`
      })
      .eq('stripe_payment_intent', payment_intent_id);

    return res.json({
      success: true,
      refund_id: refund.id,
      amount_refunded: refund.amount / 100,
      status: refund.status
    });
  } catch (error) {
    console.error('[Payments] Refund error:', error);
    return res.status(500).json({
      error: 'Failed to process refund',
      message: error.message
    });
  }
}

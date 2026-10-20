const { db, encodeKey } = require('./firestore');

function userRef(userId) {
  return db.collection('users').doc(userId);
}

function ledgerRef(userId, eventKey) {
  return userRef(userId).collection('creditLedger').doc(encodeKey(eventKey));
}

async function recordPaymentOrder({ id, userId, planName, credits, amountMinor, currency, usdPrice, exchangeRate, exchangeRateDate, exchangeRateSource }) {
  await userRef(userId).collection('paymentOrders').doc(id).create({
    id, user_id: userId, plan_name: planName, credits, amount_minor: amountMinor,
    currency, usd_price: usdPrice, usd_inr_rate: exchangeRate,
    exchange_rate_date: exchangeRateDate, exchange_rate_source: exchangeRateSource,
    status: 'created', payment_id: null, created_at: new Date(), completed_at: null,
  });
}

async function getPaymentOrder(orderId, userId) {
  const snapshot = await userRef(userId).collection('paymentOrders').doc(orderId).get();
  if (!snapshot.exists) return null;
  const row = snapshot.data();
  return {
    id: row.id,
    amount_minor: row.amount_minor,
    currency: row.currency,
    status: row.status,
    payment_id: row.payment_id,
  };
}

async function completePayment({ orderId, userId, paymentId }) {
  const userDocument = userRef(userId);
  const orderDocument = userDocument.collection('paymentOrders').doc(orderId);
  const eventDocument = db.collection('paymentEvents').doc(encodeKey(paymentId));
  const creditEventKey = 'razorpay:' + paymentId;
  const ledgerDocument = ledgerRef(userId, creditEventKey);
  let result = null;

  await db.runTransaction(async (transaction) => {
    result = null;
    const [orderSnapshot, userSnapshot, eventSnapshot, ledgerSnapshot] = await Promise.all([
      transaction.get(orderDocument), transaction.get(userDocument),
      transaction.get(eventDocument), transaction.get(ledgerDocument),
    ]);
    if (!orderSnapshot.exists || !userSnapshot.exists) return;
    const order = orderSnapshot.data();
    const user = userSnapshot.data();
    if (eventSnapshot.exists) {
      const event = eventSnapshot.data();
      if (event.user_id !== userId || event.order_id !== orderId) return;
    }
    if (order.status === 'paid') {
      if (order.payment_id !== paymentId) return;
      result = { balance: Number(user.credits || 0), credits: order.credits, planName: order.plan_name };
      return;
    }
    if (order.status !== 'created') return;

    const now = new Date();
    const balance = Number(user.credits || 0);
    if (!ledgerSnapshot.exists) {
      transaction.create(ledgerDocument, {
        event_key: creditEventKey, event_type: 'purchase', description: order.plan_name,
        credits_delta: order.credits, amount_minor: order.amount_minor, currency: order.currency,
        status: 'credited', metadata: {
          orderId,
          usdPrice: order.usd_price,
          usdInrRate: order.usd_inr_rate,
          exchangeRateDate: order.exchange_rate_date,
          exchangeRateSource: order.exchange_rate_source,
        }, created_at: now,
      });
      transaction.update(userDocument, { credits: balance + order.credits, updated_at: now });
    }
    transaction.set(eventDocument, { user_id: userId, order_id: orderId, event_type: 'payment_captured', processed_at: now });
    transaction.update(orderDocument, { status: 'paid', payment_id: paymentId, completed_at: now });
    result = { balance: balance + (ledgerSnapshot.exists ? 0 : order.credits), credits: order.credits, planName: order.plan_name };
  });

  return result;
}

module.exports = { recordPaymentOrder, getPaymentOrder, completePayment };

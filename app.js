const statusEl = document.getElementById('status');
const payBtn = document.getElementById('pay-btn');

function setStatus(message) {
  statusEl.textContent = message;
}

async function pollStatus(orderReference, attempts = 10) {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`/api/checkout/status/${encodeURIComponent(orderReference)}`);
    const data = await res.json();
    setStatus(`Status check ${i + 1}/${attempts}: ${JSON.stringify(data, null, 2)}`);

    const state = (data.status || data.paymentStatus || '').toString().toUpperCase();
    if (state === 'SUCCESS' || state === 'COMPLETED' || state === 'FAILED') {
      return data;
    }
  }
  return null;
}

payBtn.addEventListener('click', async () => {
  const amount = document.getElementById('amount').value;
  const phoneNumber = document.getElementById('phone').value;

  if (!amount || !phoneNumber) {
    setStatus('Please enter both an amount and a phone number.');
    return;
  }

  payBtn.disabled = true;
  setStatus('Starting checkout...');

  try {
    const res = await fetch('/api/checkout/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, phoneNumber }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus(`Checkout failed: ${data.error || 'unknown error'}`);
      return;
    }

    setStatus(
      `Payment request sent. Approve it on your phone.\nOrder reference: ${data.orderReference}\nChecking status...`
    );

    const final = await pollStatus(data.orderReference);
    if (final) {
      setStatus(`Final status:\n${JSON.stringify(final, null, 2)}`);
    } else {
      setStatus('Still pending — check back later or refresh.');
    }
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  } finally {
    payBtn.disabled = false;
  }
});

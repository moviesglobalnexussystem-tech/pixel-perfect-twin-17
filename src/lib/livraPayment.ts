// Livra Uganda Mobile Money Payment Integration
const LIVRA_BASE = "https://api.livrauganda.workers.dev/api";

// Format phone to E.164 Uganda format
export const formatPhone = (phone: string): string => {
  let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("0")) cleaned = "+256" + cleaned.slice(1);
  else if (cleaned.startsWith("256")) cleaned = "+" + cleaned;
  else if (!cleaned.startsWith("+256")) cleaned = "+256" + cleaned;
  return cleaned;
};

// Request a deposit (payment from user)
export const requestDeposit = async (
  msisdn: string,
  amount: number,
  description: string
): Promise<{ success: boolean; internal_reference?: string; error?: string }> => {
  try {
    const res = await fetch(`${LIVRA_BASE}/deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msisdn: formatPhone(msisdn), amount, description }),
    });
    const data = await res.json();
    if (data.success || data.internal_reference) {
      return { success: true, internal_reference: data.internal_reference };
    }
    return { success: false, error: data.message || "Payment request failed" };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
};

// Request a withdrawal (send money to user)
export const requestWithdraw = async (
  msisdn: string,
  amount: number,
  description: string
): Promise<{ success: boolean; internal_reference?: string; error?: string }> => {
  try {
    const res = await fetch(`${LIVRA_BASE}/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msisdn: formatPhone(msisdn), amount, description }),
    });
    const data = await res.json();
    if (data.success || data.internal_reference) {
      return { success: true, internal_reference: data.internal_reference };
    }
    return { success: false, error: data.message || "Withdrawal request failed" };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
};

// Check payment/withdrawal status
export const checkRequestStatus = async (
  internalReference: string
): Promise<{
  success: boolean;
  status: string;
  message?: string;
  amount?: number;
  msisdn?: string;
  provider?: string;
  completed_at?: string;
}> => {
  try {
    const res = await fetch(
      `${LIVRA_BASE}/request-status?internal_reference=${encodeURIComponent(internalReference)}`
    );
    const data = await res.json();
    return {
      success: data.success === true && data.request_status === "success",
      status: data.request_status || data.status || "unknown",
      message: data.message,
      amount: data.amount,
      msisdn: data.msisdn,
      provider: data.provider,
      completed_at: data.completed_at,
    };
  } catch (err: any) {
    return { success: false, status: "error", message: err.message };
  }
};

// Get wallet balance (admin only)
export const getWalletBalance = async (): Promise<{ balance: number; currency: string }> => {
  try {
    const res = await fetch(`${LIVRA_BASE}/wallet/balance`);
    const data = await res.json();
    return { balance: data.balance || 0, currency: data.currency || "UGX" };
  } catch {
    return { balance: 0, currency: "UGX" };
  }
};

// Get transaction history from Livra
export const getLivraTransactions = async (): Promise<any[]> => {
  try {
    const res = await fetch(`${LIVRA_BASE}/transactions`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.transactions || data.data || [];
  } catch {
    return [];
  }
};

// Poll for payment status with retries
export const pollPaymentStatus = (
  internalReference: string,
  onSuccess: (data: any) => void,
  onFailed: (msg: string) => void,
  maxAttempts = 60,
  intervalMs = 5000
): (() => void) => {
  let attempts = 0;
  let cancelled = false;

  const poll = async () => {
    if (cancelled || attempts >= maxAttempts) {
      if (!cancelled) onFailed("Payment timed out. Please try again.");
      return;
    }
    attempts++;
    try {
      const result = await checkRequestStatus(internalReference);
      if (result.success && result.status === "success") {
        onSuccess(result);
        return;
      }
      if (result.status === "failed" || result.status === "cancelled") {
        onFailed(result.message || "Payment failed or was cancelled.");
        return;
      }
      // Still pending, poll again
      if (!cancelled) setTimeout(poll, intervalMs);
    } catch {
      if (!cancelled) setTimeout(poll, intervalMs);
    }
  };

  setTimeout(poll, intervalMs);
  return () => { cancelled = true; };
};

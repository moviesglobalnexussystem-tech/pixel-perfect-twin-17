// =====================================================
// Payment Backend Integration
// Base: https://payment.livrauganda.workers.dev
// =====================================================

const PAYMENT_BASE = "https://payment.livrauganda.workers.dev";

// ── Helpers ────────────────────────────────────────

export const formatPhone = (phone: string): string => {
  let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("0")) cleaned = "+256" + cleaned.slice(1);
  else if (cleaned.startsWith("256")) cleaned = "+" + cleaned;
  else if (!cleaned.startsWith("+")) cleaned = "+256" + cleaned;
  return cleaned;
};

// ── Standard Checkout ──────────────────────────────
// Returns a checkoutUrl the user visits to pay.

export interface CheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  reference?: string;
  error?: string;
}

export const createCheckout = async (
  amount: number,
  email: string,
  successUrl: string,
  failureUrl: string,
  metadata?: Record<string, string>
): Promise<CheckoutResult> => {
  try {
    const res = await fetch(`${PAYMENT_BASE}/checkout/standard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        currency: "UGX",
        email,
        redirectUrl: successUrl, // standard checkout uses redirectUrl
        successUrl,
        failureUrl,
        metadata: metadata || {},
      }),
    });
    const data = await res.json();
    if (data.success && data.data?.checkoutUrl) {
      return {
        success: true,
        checkoutUrl: data.data.checkoutUrl,
        reference: data.data.reference,
      };
    }
    return { success: false, error: data.message || "Checkout initiation failed" };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
};

// ── Verify charge status ───────────────────────────

export const verifyCharge = async (reference: string): Promise<{
  success: boolean;
  status: string;
  amount?: number;
  message?: string;
}> => {
  try {
    const res = await fetch(`${PAYMENT_BASE}/direct-charge/verify/${encodeURIComponent(reference)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.success) {
      return {
        success: data.data?.status === "successful" || data.data?.status === "success",
        status: data.data?.status || "unknown",
        amount: data.data?.amount,
        message: data.data?.message,
      };
    }
    return { success: false, status: "unknown", message: data.message };
  } catch (err: any) {
    return { success: false, status: "error", message: err.message };
  }
};

// ── Payout (Withdrawal) ────────────────────────────

export interface PayoutResult {
  success: boolean;
  reference?: string;
  payoutId?: string;
  error?: string;
}

export const initiatePayout = async (
  phoneNumber: string,
  amount: number,
  name: string,
  description: string
): Promise<PayoutResult> => {
  try {
    const phone = formatPhone(phoneNumber);
    const res = await fetch(`${PAYMENT_BASE}/payout/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: "platform",
        sourceCurrency: "UGX",
        destinationCurrency: "UGX",
        amount,
        description,
        paymentDestination: "mobile_wallet",
        beneficiary: {
          firstName: name.split(" ")[0] || name,
          lastName: name.split(" ").slice(1).join(" ") || "User",
          accountHolderName: name,
          country: "UG",
          phone,
          accountNumber: phone,
          type: "individual",
          email: "",
        },
      }),
    });
    const data = await res.json();
    if (data.success && data.data?.reference) {
      return { success: true, reference: data.data.reference, payoutId: data.data.payoutId };
    }
    return { success: false, error: data.message || "Payout failed" };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
};

// ── Wallet Balance (Admin only) ────────────────────

export const getWalletBalance = async (): Promise<{ balance: number; currency: string }> => {
  try {
    const res = await fetch(`${PAYMENT_BASE}/wallet/balances`);
    const data = await res.json();
    if (data.success && data.data?.wallets?.length) {
      const ugxWallet = data.data.wallets.find((w: any) => w.currency === "UGX") || data.data.wallets[0];
      return {
        balance: ugxWallet.availableBalance || ugxWallet.ledgerBalance || 0,
        currency: ugxWallet.currency || "UGX",
      };
    }
    return { balance: 0, currency: "UGX" };
  } catch {
    return { balance: 0, currency: "UGX" };
  }
};

// ── Transaction History (Admin) ────────────────────

export const getLivraTransactions = async (): Promise<any[]> => {
  try {
    const res = await fetch(`${PAYMENT_BASE}/transactions`);
    const data = await res.json();
    if (data.success) {
      return data.data?.transactions || [];
    }
    return [];
  } catch {
    return [];
  }
};

// ── Legacy compatibility (kept for agent withdrawal) ──
export const requestWithdraw = initiatePayout;

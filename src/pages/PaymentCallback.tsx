/**
 * PaymentCallback – handles return from Fincra checkout.
 *
 * successUrl format:
 *   /payment/callback?status=success&ref=REF&type=sub&plan=1day&uid=UID&days=1&amount=2500
 *   /payment/callback?status=success&ref=REF&type=agent&plan=1+Week&uid=UID&days=7&amount=20000
 *   /payment/callback?status=success&ref=REF&type=agent-renew&agentId=DOC_ID&plan=1+Week&days=7&amount=20000
 *   /payment/callback?status=failed
 */
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getUserByUid, updateUser, updateAgent, addAgent, generateAgentId, addTransaction } from "@/lib/firebaseServices";
import { useToast } from "@/hooks/use-toast";

const PaymentCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<"processing" | "success" | "failed">("processing");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const run = async () => {
      const status = params.get("status");
      const type = params.get("type");          // "sub" | "agent" | "agent-renew" | "audience"
      const ref = params.get("ref") || "";
      const plan = params.get("plan") || "";
      const uid = params.get("uid") || "";
      const days = parseInt(params.get("days") || "0");
      const amount = parseInt(params.get("amount") || "0");
      const agentDocId = params.get("agentId") || "";
      const agentName = params.get("agentName") || "";
      const agentPhone = params.get("agentPhone") || "";

      if (status !== "success") {
        setState("failed");
        setMessage("The payment was not completed. Please try again.");
        return;
      }

      try {
        const now = new Date();
        const expiry = new Date(now);
        expiry.setDate(expiry.getDate() + days);
        const expiryStr = expiry.toISOString().split("T")[0];
        const nowStr = now.toISOString().split("T")[0];

        if (type === "sub" && uid) {
          // User subscription activation
          const userDoc = await getUserByUid(uid);
          if (userDoc) {
            await updateUser(userDoc.id, {
              subscription: plan,
              subscriptionExpiry: expiryStr,
              status: "active",
            });
          }
          await addTransaction({
            userId: uid,
            userName: userDoc?.name || uid,
            userPhone: userDoc?.phone || "",
            type: "subscription",
            amount,
            status: "completed",
            method: "Fincra Checkout (UGX)",
            description: `User ${plan} Subscription`,
            livraRef: ref,
            createdAt: nowStr,
          } as any);
          setMessage("Your subscription is now active. Enjoy unlimited streaming!");

        } else if (type === "agent") {
          // New agent subscription
          const newAgentId = generateAgentId();
          await addAgent({
            name: agentName || agentPhone,
            phone: agentPhone,
            agentId: newAgentId,
            balance: 0,
            sharedMovies: 0,
            sharedSeries: 0,
            totalEarnings: 0,
            status: "active",
            plan,
            planExpiry: expiryStr,
            createdAt: nowStr,
          } as any);
          await addTransaction({
            userId: "",
            userName: agentName || agentPhone,
            userPhone: agentPhone,
            type: "subscription",
            amount,
            status: "completed",
            method: "Fincra Checkout (UGX)",
            description: `Agent ${plan} Plan`,
            livraRef: ref,
            createdAt: nowStr,
          } as any);
          setMessage(`Your Agent ID is being created. Please log in with your Agent ID to access the dashboard.`);

        } else if (type === "audience" && shareCode) {
          // Audience paying for agent content
          const price = parseInt(params.get("price") || "0");
          const accessDurationMins = parseInt(params.get("accessDuration") || "60");
          const agentDocId2 = params.get("agentDocId") || "";
          const contentTitle = params.get("contentTitle") || "Content";

          // Grant localStorage access
          const accessKey = `luo_access_${shareCode}`;
          const deviceId = (() => {
            let id = localStorage.getItem("luo_device_id");
            if (!id) { id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; localStorage.setItem("luo_device_id", id); }
            return id;
          })();
          localStorage.setItem(accessKey, JSON.stringify({ deviceId, expiresAt: Date.now() + accessDurationMins * 60 * 1000 }));

          // Record transaction & credit agent
          await addTransaction({
            userId: deviceId,
            userName: "Audience",
            userPhone: "",
            type: "agent-share",
            amount: price,
            status: "completed",
            method: "Fincra Checkout (UGX)",
            description: `Agent sell: ${contentTitle}`,
            livraRef: ref,
            createdAt: nowStr,
          } as any);

          if (agentDocId2) {
            const { getAgentByDocId, updateAgent: ua } = await import("@/lib/firebaseServices") as any;
            try {
              const agent = getAgentByDocId ? await getAgentByDocId(agentDocId2) : null;
              if (agent) {
                await ua(agentDocId2, { balance: (agent.balance || 0) + price, totalEarnings: (agent.totalEarnings || 0) + price });
              }
            } catch {}
          }

          setMessage("Access granted! You can now watch the content.");
          // Redirect back to audience page
          setTimeout(() => navigate(`/a/${shareCode}`), 2000);

        }

        setState("success");
        toast({ title: "Payment successful!" });

      } catch (err: any) {
        setState("failed");
        setMessage(err.message || "An error occurred activating your subscription.");
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
        {state === "processing" && (
          <>
            <Loader2 className="w-14 h-14 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-foreground font-bold text-lg">Activating your plan...</h2>
            <p className="text-muted-foreground text-sm mt-2">Please wait while we set up your account.</p>
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle className="w-14 h-14 text-primary mx-auto mb-4" />
            <h2 className="text-foreground font-bold text-lg">Payment Successful!</h2>
            <p className="text-muted-foreground text-sm mt-2">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 w-full h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Watching
            </button>
          </>
        )}
        {state === "failed" && (
          <>
            <XCircle className="w-14 h-14 text-destructive mx-auto mb-4" />
            <h2 className="text-foreground font-bold text-lg">Payment Failed</h2>
            <p className="text-muted-foreground text-sm mt-2">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 w-full h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;

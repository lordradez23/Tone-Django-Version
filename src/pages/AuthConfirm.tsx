import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const AuthConfirm = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Supabase appends #access_token=...&type=signup to the URL
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setStatus("success");
        setMessage("Email confirmed! Redirecting...");
        setTimeout(() => navigate("/chat"), 2000);
      } else if (event === "USER_UPDATED") {
        setStatus("success");
        setMessage("Email confirmed! Redirecting...");
        setTimeout(() => navigate("/chat"), 2000);
      }
    });

    // Handle the token from the URL hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("success");
        setMessage("Email confirmed! Redirecting...");
        setTimeout(() => navigate("/chat"), 2000);
      } else {
        setStatus("error");
        setMessage("Confirmation link is invalid or has expired.");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-safe animate-spin mx-auto" />
            <p className="text-secondary">Confirming your email...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-10 h-10 text-safe mx-auto" />
            <p className="text-foreground font-medium">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 text-destructive mx-auto" />
            <p className="text-foreground font-medium">{message}</p>
            <button
              onClick={() => navigate("/auth")}
              className="text-safe hover:underline text-sm"
            >
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthConfirm;

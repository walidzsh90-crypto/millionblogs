import Link from "next/link";

type PaymentStatusCardProps = {
  variant: "success" | "cancel";
  credits?: number;
  amount?: string;
  locale: string;
};

export function PaymentStatusCard({ variant, credits, amount, locale }: PaymentStatusCardProps) {
  const isSuccess = variant === "success";

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
            isSuccess
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning"
          }`}
          aria-hidden="true"
        >
          {isSuccess ? "\u2713" : "\u2715"}
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-foreground">
          {isSuccess ? "Payment successful" : "Payment cancelled"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted">
          {isSuccess
            ? `Your payment has been processed successfully.${credits ? ` ${credits.toLocaleString()} credits have been added to your wallet.` : ""}`
            : "No charges were made. Your wallet balance remains unchanged."}
        </p>

        {isSuccess && amount ? (
          <p className="mt-2 text-sm text-muted">
            Amount: <span className="font-semibold text-foreground">{amount}</span>
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/${locale}/dashboard/wallet`}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-white"
          >
            View my wallet
          </Link>
          <Link
            href={`/${locale}/dashboard/purchase`}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-semibold text-foreground"
          >
            {isSuccess ? "Buy more credits" : "Try again"}
          </Link>
        </div>
      </div>
    </main>
  );
}

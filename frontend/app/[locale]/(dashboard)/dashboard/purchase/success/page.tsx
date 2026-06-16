"use client";

import { useParams, useSearchParams } from "next/navigation";

import { PaymentStatusCard } from "@/features/purchase/components/payment-status-card";

export default function PurchaseSuccessPage() {
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const credits = searchParams.get("credits");

  return (
    <PaymentStatusCard
      variant="success"
      credits={credits ? Number(credits) : undefined}
      locale={locale}
    />
  );
}

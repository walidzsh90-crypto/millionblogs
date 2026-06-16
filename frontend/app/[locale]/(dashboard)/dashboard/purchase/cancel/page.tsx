"use client";

import { useParams } from "next/navigation";

import { PaymentStatusCard } from "@/features/purchase/components/payment-status-card";

export default function PurchaseCancelPage() {
  const { locale } = useParams<{ locale: string }>();

  return (
    <PaymentStatusCard
      variant="cancel"
      locale={locale}
    />
  );
}

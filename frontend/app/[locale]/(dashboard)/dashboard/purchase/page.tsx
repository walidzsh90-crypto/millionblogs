"use client";

import { PurchaseForm } from "@/features/purchase/components/purchase-form";
import { PurchaseHistory } from "@/features/purchase/components/purchase-history";

export default function PurchasePage() {
  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-6xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">Buy Credits</p>
          <h1 className="mt-1 text-3xl font-semibold text-foreground">Buy Credits</h1>
          <p className="mt-1 text-sm text-muted">
            Purchase credits to use for promotions and premium features.
          </p>
        </div>

        <div className="mt-8">
          <PurchaseForm />
        </div>

        <div className="mt-16">
          <h2 className="text-lg font-semibold text-foreground">Purchase history</h2>
          <p className="mt-1 text-sm text-muted">
            View your past credit purchases and payments.
          </p>
          <div className="mt-4">
            <PurchaseHistory />
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";

// Private wallet only: the MAD / USD switch and the person's default currency + rate.
import { Segmented } from "@/components/spine-ui";
import { usePrefs } from "@/components/prefs/prefs-provider";
import { rateOf, walletCurrencyOf, type WalletCurrency } from "@/lib/wallet-types";
import { CurrencyFlag } from "./currency-flag";

/** My default wallet currency and rate (1 USD = usdRate MAD), from Settings › Preferences. */
export function useWalletDefaults(): { currency: WalletCurrency; usdRate: number } {
  const { prefs } = usePrefs();
  return { currency: walletCurrencyOf(prefs.walletCurrency), usdRate: rateOf(prefs.walletUsdRate) };
}

/** MAD / USD with flags. `long` = "MAD (dirham)" / "USD (dollar)" (Preferences). */
export function CurrencySwitch({
  value,
  onChange,
  label = "Currency",
  surface,
  long = false,
}: {
  value: WalletCurrency;
  onChange: (currency: WalletCurrency) => void;
  label?: string;
  surface?: "page" | "panel";
  long?: boolean;
}) {
  return (
    <Segmented
      label={label}
      surface={surface}
      value={value}
      onValueChange={(v) => onChange(walletCurrencyOf(v))}
      items={[
        { value: "MAD", label: long ? "MAD (dirham)" : "MAD", icon: <CurrencyFlag currency="MAD" /> },
        { value: "USD", label: long ? "USD (dollar)" : "USD", icon: <CurrencyFlag currency="USD" /> },
      ]}
    />
  );
}

/** The symbol inside a money input: "$" or "MAD". */
export function CurrencyInputIcon({ currency }: { currency: WalletCurrency }) {
  return <span className="text-[0.9375rem] font-medium">{currency === "MAD" ? "MAD" : "$"}</span>;
}

/** Extra left room in a money SpInput when the symbol is "MAD" (wider than "$"). */
export function currencyInputClass(currency: WalletCurrency): string | undefined {
  return currency === "MAD" ? "pl-[60px]" : undefined;
}

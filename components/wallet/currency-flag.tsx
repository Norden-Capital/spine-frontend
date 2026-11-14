/**
 * Small flag for a wallet currency: Morocco for MAD, United States for USD.
 * Drawn as SVG (emoji flags don't show on every phone or computer).
 */
export function CurrencyFlag({ currency }: { currency: "MAD" | "USD" | string }) {
  // Inline size: wins over the Segmented "[&_svg]:size-[15px]" rule.
  const style = { width: 20, height: 14, borderRadius: 3 };
  if (currency === "MAD") {
    return (
      <svg viewBox="0 0 30 20" aria-hidden style={style} data-flag="MA">
        <rect width="30" height="20" fill="#C1272D" />
        <path
          d="M15 5.2l1.37 4.22h4.43l-3.58 2.6 1.37 4.22L15 13.64l-3.59 2.6 1.37-4.22-3.58-2.6h4.43z"
          fill="none"
          stroke="#006233"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 30 20" aria-hidden style={style} data-flag="US">
      <rect width="30" height="20" fill="#FFFFFF" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#B22234" />
      ))}
      <rect width="13" height={(7 * 20) / 13} fill="#3C3B6E" />
    </svg>
  );
}

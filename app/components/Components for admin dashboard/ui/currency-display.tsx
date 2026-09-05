import useCurrencyUtils from "@/hooks/useCurrencyUtils";
interface CurrencyDisplayProps {
  currencyId: number;
}

export const CurrencyDisplay = ({ currencyId }: CurrencyDisplayProps) => {

    // ----------------------- GET CURRENCY SIGN -----------------------
  const { getCurrencySign } = useCurrencyUtils();
  const sign = getCurrencySign(currencyId);
  return <span>{sign}</span>;
  
}

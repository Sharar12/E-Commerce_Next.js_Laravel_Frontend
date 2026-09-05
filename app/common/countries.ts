export interface CountryPhoneConfig {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  phoneFormat: string;
}

export const COUNTRIES: CountryPhoneConfig[] = [
  { name: "Bangladesh", code: "BD", dialCode: "+880", flag: "🇧🇩", phoneFormat: "1XXXXXXXXX" },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸", phoneFormat: "X-XXX-XXXX" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧", phoneFormat: "XXXX-XXXXXX" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪", phoneFormat: "X-XXXX-XXXX" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦", phoneFormat: "X-XXX-XXXX" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺", phoneFormat: "X-XXXX-XXXX" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪", phoneFormat: "XXXX-XXXXXXX" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷", phoneFormat: "X-XX-XX-XX-XX" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦", phoneFormat: "X-XXXX-XXXX" },
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳", phoneFormat: "XXXXX-XXXXX" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬", phoneFormat: "XXXX-XXXX" },
  { name: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾", phoneFormat: "XX-XXX-XXXX" },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵", phoneFormat: "XX-XXXX-XXXX" },
];

export const getCountryByName = (name: string): CountryPhoneConfig => {
  return (
    COUNTRIES.find((c) => c.name.toLowerCase() === name.toLowerCase()) ||
    COUNTRIES[0]
  );
};

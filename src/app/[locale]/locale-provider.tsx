import { NextIntlClientProvider } from "next-intl";
import { Providers } from "@/app/providers";

export async function LocaleProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  "use cache";
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Europe/Athens"
      now={new Date()}
      formats={{}}
    >
      {children}
      <Providers />
    </NextIntlClientProvider>
  );
}

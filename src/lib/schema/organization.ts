export function generateOrganizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MotoMarket",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      "https://www.facebook.com/motomarket",
      "https://www.instagram.com/motomarket",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+30-210-0000000",
      contactType: "customer service",
      areaServed: "GR",
      availableLanguage: ["Greek", "English"],
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Αθήνα",
      postalCode: "10000",
      addressCountry: "GR",
    },
  };
}

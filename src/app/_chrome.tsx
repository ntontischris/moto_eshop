import { Russo_One, Chakra_Petch } from "next/font/google";

export const russoOne = Russo_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-russo",
  display: "optional",
});

export const chakraPetch = Chakra_Petch({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-chakra",
  display: "optional",
});

export const fontVars = `${russoOne.variable} ${chakraPetch.variable}`;

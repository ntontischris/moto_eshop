"use client";

import Cookies from "js-cookie";

const COOKIE_KEY = "garage_guest";
const COOKIE_EXPIRES = 365;

export function getGuestGarage(): string[] {
  try {
    const raw = Cookies.get(COOKIE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addGuestBike(bikeId: string): void {
  const current = getGuestGarage();
  if (current.includes(bikeId)) return;
  Cookies.set(COOKIE_KEY, JSON.stringify([...current, bikeId]), {
    expires: COOKIE_EXPIRES,
    sameSite: "lax",
  });
}

export function removeGuestBike(bikeId: string): void {
  const current = getGuestGarage();
  Cookies.set(
    COOKIE_KEY,
    JSON.stringify(current.filter((id) => id !== bikeId)),
    {
      expires: COOKIE_EXPIRES,
      sameSite: "lax",
    },
  );
}

export function clearGuestGarage(): void {
  Cookies.remove(COOKIE_KEY);
}

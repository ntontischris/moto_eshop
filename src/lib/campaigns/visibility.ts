import type { Campaign } from "./types";

export function isCampaignExpired(campaign: Campaign, now: Date): boolean {
  return campaign.expires_at !== null && now > new Date(campaign.expires_at);
}

export function isCampaignVisible(campaign: Campaign, now: Date): boolean {
  if (campaign.status !== "published") return false;
  if (campaign.starts_at !== null && now < new Date(campaign.starts_at)) {
    return false;
  }
  if (isCampaignExpired(campaign, now)) return false;
  return true;
}

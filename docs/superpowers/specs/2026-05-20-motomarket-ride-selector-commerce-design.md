# MotoMarket Ride Selector Commerce Design

MotoMarket will move from a cinematic storefront into a premium commerce system inspired by Alpinestars: activity-first navigation, fast product discovery, real e-shop structure, and a racing visual language that does not cost Core Web Vitals.

## Direction

The homepage opens with a short premium hero, then immediately asks the rider what kind of riding they do. This creates a practical path to products while still feeling high-end.

## Primary Units

- Header: compact logo, search, offers, cart, and dark/light mode.
- Mega menu: activity, rider gear, motorcycle parts, brands, and offers.
- Hero: fast static image, one primary commercial action, one secondary action.
- Ride selector: Racing, Adventure, Urban, Touring, Off-road, Rain/Winter, Parts, Offers.
- Product cards: clean product image, brand, availability, price, and one direct CTA.
- Light mode: premium white commerce surface, not a washed-out copy of dark mode.

## Performance Rules

- The LCP remains a static optimized image loaded with `fetchPriority`.
- No first-viewport JS animation, video, canvas, or heavy parallax.
- Effects use CSS transforms, opacity, and small hover states only.
- Mobile hero must use a dedicated portrait image and never crop the main subject unusably.

## Success Criteria

- The first viewport feels like a premium motorcycle e-shop, not a landing page.
- A user can choose riding style or product family immediately.
- Product cards look commercial and trustworthy.
- Dark and light modes both feel intentional.

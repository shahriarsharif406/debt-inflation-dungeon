# Debt & Inflation Dungeon: Game Design Document

*Zoud GameLab 2026 · theme: Make FinLit Fun · solo developer · browser game*

## 1. One-line pitch

A 5-minute roguelite where debt monsters grow, your cash melts, and every month you choose how to fight back.

## 2. Why this game

Most money games teach one concept at a time. Real money problems arrive together: debt grows while savings lose value, and a surprise bill lands at the worst moment. This game puts the two biggest forces, **interest** and **inflation**, on screen at once and makes the player balance them. The key design goal is *instant understanding*: a new player should grasp the whole game from the first screen.

**Core message:** debt traps people at every income level. Smart, early decisions get you out.

## 3. Design pillars

1. **See the invisible.** Interest and inflation are shown as things that visibly grow and shrink, with a forecast of what will happen before the player commits.
2. **The right answer depends on the situation.** Paying debt, holding a buffer, and investing all compete for the same cash.
3. **Pressure is part of the lesson.** Status temptations and surprise bills show *why* people borrow, not just that they do.
4. **Fair for everyone.** Three income levels, same rules; a daily seeded run for fair comparison.

## 4. Core loop (one month)

1. **Read** the forecast (debt will grow $X, cash will melt $Y, safety net 1.4×).
2. **Decide**: pay a monster, invest, sell, take or skip a status purchase.
3. **End the month**: interest charged, inflation applied, market moves, a random event, paycheck arrives.
4. **See the report** and the net-worth change. Repeat for 12 months.

**Win / lose:** survive 12 months without total debt reaching the doom line. Stars: ★ survive, ★★ debt-free, ★★★ debt-free with high net worth.

## 5. Systems

| System | Rule | Concept taught |
|---|---|---|
| Debt monsters | Each has a balance and a monthly rate (1.2%–15%). Their size on screen follows their balance. | Interest, compounding |
| Inflation | Cash loses 1% / 2.5% / 4% a month on floors 1 / 2 / 3. A ring shows remaining buying power. | Inflation |
| Assets | Safe Vault (steady), Index Totem (mixed), Dragon Stock (wild, with crash risk). Real return = nominal − inflation. | Risk vs return, diversification |
| Safety Net | Cash ÷ a typical surprise bill. Under 1× the gauge turns red. | Emergency fund |
| Events | Repair, medical, rent rise, celebration, bonus, side gig, market boom/crash, income gap. Without cash, a bill spawns a 15%/month Emergency Imp. | Shocks, single-income risk |
| Status temptations | Optional "everyone has one" purchases. Cash or credit; both raise a status score that does not build wealth. | Lifestyle inflation, credit use |
| Insurance Shield | Optional. Premium 10% of pay each month; covers 80% of car, medical and phone bills (not rent rises or celebrations). Roughly break-even over a run; its value is avoiding the one bad month. | Insurance, risk transfer |
| Floors | Months 1–4 Cellar, 5–8 Vaults, 9–12 Abyss. New monsters appear and inflation rises. | Changing conditions |

**Income tiers:** Low ($350/mo), Middle ($600), High ($1,500). All values scale together so the dynamics are identical.

**Daily Dungeon:** events, market returns and temptations are drawn from a seeded generator keyed to the date and tier.

## 6. Learning outcomes and how the game measures them

At the end of every run the player gets a *FinLit report card* computed from their own play:

- **Debt cost:** interest charged as a % of everything earned.
- **Inflation:** buying power lost on idle cash.
- **Method:** % of payments that targeted the fastest-growing debt (avalanche).
- **Pressure:** status temptations accepted, credit use, income gaps.
- One personalised tip chosen from the weakest area.

Eight unlockable insights reward good habits (Debt-Free, Avalanche Mind, Safety Net, Status Resister, Money Grows, Not One Basket, Shielded, Dungeon Master). The report card also shows premiums paid against bills covered.

## 7. Audience

Adults and older teens, new to personal finance or tired of dry money apps. Plays well on phones for short sessions; suitable for classroom discussion via the Daily Dungeon (everyone has the same run).

## 8. Experience design

- **Look:** dark dungeon palette that shifts per floor (cool blue, amber, crimson), glowing monsters that grow with their debt, particle bursts on defeat, screen shake on bad news.
- **Sound:** procedural effects and a low ambient drone whose pitch changes per floor. Mutable.
- **First minute:** a three-step coach highlights the fastest monster, then investing, then ending the month. The "FASTEST" tag appears only during the tutorial.
- **Sharing:** one tap creates a result image (and text) for any platform.
- **Accessibility:** reduced-motion support, non-colour cues, keyboard shortcuts, screen-reader announcements.

## 9. Technical summary

Single-file HTML/CSS/JS, no dependencies, hosted statically. Canvas (particles, share card), SVG (monsters, charts), Web Audio. State in `localStorage` with graceful fallback. A simulation script plays thousands of automated games to check balance and daily determinism.

## 10. Current scope (delivered in the jam build)

Full 12-month game, 6 monsters, 3 assets, insurance, 10 events, 6 status temptations, 3 income tiers, Daily Dungeon, tutorial, report card, 8 insights, share image, help screen, responsive layout.

## 11. Roadmap if funded

1. **Localisation:** translate the UI and examples; region packs for local financial products (the rules stay universal).
2. **Teacher mode:** shareable class codes, a results summary, discussion prompts for each insight.
3. **More depth:** minimum-payment mechanic, debt consolidation, longer careers, more floors.
4. **Packaging:** installable web app and store builds for phones.
5. **Evaluation:** with a partner, measure learning outcomes before and after play.

## 12. Risks

- *Over-simplification:* the model is deliberately simple. The game says so and points to the concepts, not to financial advice.
- *Balance:* tuned with automated play; real-player testing is the next step.
- *Sensitivity:* monsters are debts, never groups of people. Real-world notes are general and avoid statistics.

## 13. Budget

*To be completed by the developer for the funding application.*

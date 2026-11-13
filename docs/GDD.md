# Debt & Inflation Dungeon: Game Design Document

*Zoud GameLab 2026 · theme: Make FinLit Fun · solo developer · browser game*

## 1. One-line pitch

A 5-minute roguelite where debt monsters grow, your cash melts, and every month you choose how to fight back.

## 2. Why this game

Most money games teach one concept at a time. Real money problems arrive together: debt grows while savings lose value, and a surprise bill lands at the worst moment. This game puts the two biggest forces, **interest** and **inflation**, on screen at once and makes the player balance them. The key design goal is *instant understanding*: a new player should grasp the whole game from the first screen.

**Financial-management focus:** the player runs a household budget, not only a debt fight. Each month they split pay between needs, lifestyle and saving; build an emergency fund; and choose what to do with raises.

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
| Assets | Savings Vault (steady), Index Totem (mixed), Dragon Stock (wild, with crash risk). Real return = nominal − inflation. | Risk vs return, diversification |
| Safety Net | Cash ÷ a typical surprise bill. Under 1× the gauge turns red. | Emergency fund |
| Events | Repair, medical, rent rise, celebration, bonus, side gig, market boom/crash, income gap. Without cash, a bill spawns a 15%/month Emergency Imp. | Shocks, single-income risk |
| Status temptations | Optional "everyone has one" purchases. Cash or credit; both raise a status score that does not build wealth. | Lifestyle inflation, credit use |
| Monthly budget | Needs 30% of base pay (fixed). Lifestyle Frugal 6% / Comfort 14% / Lavish 28%. Paid at month end. What remains is "free cash"; debt payments, investing and purchases use only free cash. A shortfall is covered by savings first, then the credit card. | Budgeting, needs vs wants |
| Pay yourself first | Choose 0 / 10 / 20% of pay to move into the Savings Vault automatically at month end, before bills. | Saving habit |
| Emergency fund | Goal: 3 months of living costs in the Savings Vault. Savings automatically absorb surprise bills and bill shortfalls; without them the shortfall becomes an Emergency Imp. | Emergency fund |
| Raises and lifestyle creep | Pay rises 10% in months 4 and 8. The player picks: upgrade lifestyle (spending rises by the full raise), save it, or keep life the same. | Lifestyle creep |
| Final settlement | At the end, cash and savings pay down remaining debt (highest rate first), so being asset-rich counts as debt-free. | Net worth thinking |
| Insurance Shield | Optional. Premium 10% of pay each month; covers 80% of car, medical and phone bills (not rent rises or celebrations). Roughly break-even over a run; its value is avoiding the one bad month. | Insurance, risk transfer |
| Orbit Fund | 4th asset, ≈+3%/mo, 7% chance of a launch failure; "Launch window" and "Launch failure" events move it. | High-risk, high-reward sectors |
| Escape Velocity | 70% debt paid down + 30% assets progress. Debt-free ends in a rocket launch; debt remaining shows "stuck in orbit"; losing shows a black hole. | Net worth as escape from gravity |
| Money Codex | Eleven economic theories (Becker human capital, Bernoulli compounding, Wieser opportunity cost, Fisher, Markowitz, Kahneman & Tversky, Modigliani/Friedman, Brickman & Campbell, Rule of 72, Taleb, classical rational choice). Tagged on temptations, raises and assets; unlocked by play; +15 XP each. | Economics theory in practice |
| Skill course | Months 2-7 offer: pay cash or a 1.5%/mo Skill Loan for +12% pay. Early it repays itself; late it does not. | Good vs bad debt, human capital (Becker) |
| Arabic | Full Arabic interface with right-to-left layout, chosen with a button on the title screen and remembered. Numbers and amounts stay readable inside Arabic text. | Access for Arabic-speaking players |
| What could have been | End-screen note estimating avoidable interest (payments that missed the fastest-growing debt), idle-cash inflation loss and status purchases | Learning from your own choices |
| Simplified-model note | End screen and help state that numbers are simplified and not financial advice | Honesty about limits |
| Gulf pack | Optional region toggle adding UAE-flavoured events (remittance with fees, pay-in-4, giving season, Eid hosting, hidden exchange margin) and temptations. Daily seed includes the region. | Regional adaptation |
| Floors | Months 1–4 Cellar, 5–8 Vaults, 9–12 Abyss. New monsters appear and inflation rises. | Changing conditions |

**Income tiers:** Low ($350/mo), Middle ($600), High ($1,500). All values scale together so the dynamics are identical.

**Progression:** XP from every run (survival, stars, debt-free, new insights, daily goal) builds six levels, Rookie to Dungeon Master, so the lessons reward repeat play.

**Daily Dungeon:** events, market returns and temptations are drawn from a seeded generator keyed to the date and tier.

## 6. Learning outcomes and how the game measures them

At the end of every run the player gets a *FinLit report card* computed from their own play:

- **Debt cost:** interest charged as a % of everything earned.
- **Inflation:** buying power lost on idle cash.
- **Method:** % of payments that targeted the fastest-growing debt (avalanche).
- **Pressure:** status temptations accepted, credit use, income gaps.
- One personalised tip chosen from the weakest area.

Eleven unlockable insights reward good habits (Debt-Free, Avalanche Mind, Safety Net, Status Resister, Money Grows, Not One Basket, Pay Yourself First, Fortress, Creep Crusher, Shielded, Dungeon Master). The report card also shows savings rate, lifestyle share of pay, and emergency fund size in months. The report card also shows premiums paid against bills covered.

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

Full 12-month game, 6 monsters, 4 assets (incl. space-tech Orbit Fund), Escape Velocity finale, 11-theory Money Codex, insurance, 10 events, 6 status temptations, 3 income tiers, Daily Dungeon with a daily goal, XP and levels, tutorial, report card, 11 insights, share image, help screen, responsive layout.

## 11. Roadmap if funded

1. **Localisation:** translate the UI and examples; region packs for local financial products (the rules stay universal).
2. **Teacher mode:** shareable class codes, a results summary, discussion prompts for each insight.
3. **More depth:** minimum-payment mechanic, debt consolidation, long-term compounding (multi-year careers), longer careers, more floors.
4. **Packaging:** installable web app and store builds for phones.
5. **Evaluation:** with a partner, measure learning outcomes before and after play.

## 12. Risks

- *Over-simplification:* the model is deliberately simple. The game says so and points to the concepts, not to financial advice.
- *Balance:* tuned with automated play; real-player testing is the next step.
- *Sensitivity:* monsters are debts, never groups of people. Real-world notes are general and avoid statistics.

## 13. Budget

See [BUDGET.md](BUDGET.md) and the video plan in [VIDEO_SCRIPT.md](VIDEO_SCRIPT.md).

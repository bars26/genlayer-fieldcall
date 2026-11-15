# FieldCall: reproduction of the live run

Contract on GenLayer Studio: [`0x58576b0a8C0091b8E7E276EDCa9b5D2d9bC826aE`](https://explorer-studio.genlayer.com/address/0x58576b0a8C0091b8E7E276EDCa9b5D2d9bC826aE) (source: `contracts/field_call.py`, checked
byte-identical with `node scripts/verify-code.mjs 0x58576b0a8C0091b8E7E276EDCa9b5D2d9bC826aE`).

`scripts/demo.mjs` opened two **demo calls** with test wallets and submitted **real iNaturalist observations** of the
yellow-legged (Asian) hornet, *Vespa velutina*, an invasive predator of honeybees that the UK asks the public to report. Every
reading below is real validator consensus over iNaturalist's live API; where a call has a photo condition, the validators
looked at the photos themselves. None of these observers has a wallet address in their iNaturalist profile, so their rewards
are **held for them** (and return to the funders if nobody collects); nothing was paid to anyone else.

Accounts: sponsor `0x716e4678302eE11DCF1d673cC7cCB52cD70803CC`, cofunder `0x167A6645A350fd67A0D32b9897b9244b9ffc248e`, scout `0xC70d2324feD457A22c50165eADAE87700f984EF0`, bystander `0xc0C191c17875c75Bb9dEe2b4f050DC9486868C9E`.

## Rulings

| Sighting | Call | Observation | What iNaturalist records | Ruling | Outcome |
|---|---|---|---|---|---|
| sighting_0 | call_0 | [397236824](https://www.inaturalist.org/observations/397236824) | Vespa velutina · 2026-08-20 · Spring Place, Romsey, UK | **ELIGIBLE** (eligible)<br>photos looked at: MEETS | awaiting_wallet |
| sighting_1 | call_0 | [397236834](https://www.inaturalist.org/observations/397236834) | Vespa velutina · 2026-08-20 · The Abbey, Romsey, UK | **INELIGIBLE** (condition_not_met)<br>photos looked at: NOT MEETS, NOT MEETS, NOT MEETS | nothing_paid |
| sighting_2 | call_0 | [411158753](https://www.inaturalist.org/observations/411158753) | Vespa crabro · 2026-10-25 · The Mill House, Liskeard, England, GB | **INELIGIBLE** (wrong_taxon) | nothing_paid |
| sighting_3 | call_0 | [411204951](https://www.inaturalist.org/observations/411204951) | Vespa velutina nigrithorax · 2026-10-23 · Allee des Pêcheurs-ZA du Turzon, Saint-Georges-les-Bains, Auvergne-Rhône-Alpes, FR | **INELIGIBLE** (outside_place) | nothing_paid |
| sighting_4 | call_0 | [182971213](https://www.inaturalist.org/observations/182971213) | Vespa velutina nigrithorax · 2023-09-11 · Hull HU9, UK | **INELIGIBLE** (outside_dates) | nothing_paid |
| sighting_5 | call_0 | [411204951](https://www.inaturalist.org/observations/411204951) | Vespa velutina nigrithorax · 2026-10-23 · Allee des Pêcheurs-ZA du Turzon, Saint-Georges-les-Bains, Auvergne-Rhône-Alpes, FR | **INELIGIBLE** (outside_place) | nothing_paid |
| sighting_6 | call_0 | [411204951](https://www.inaturalist.org/observations/411204951) | Vespa velutina nigrithorax · 2026-10-23 · Allee des Pêcheurs-ZA du Turzon, Saint-Georges-les-Bains, Auvergne-Rhône-Alpes, FR | **INELIGIBLE** (outside_place) | nothing_paid |
| sighting_7 | call_1 | [397236834](https://www.inaturalist.org/observations/397236834) | Vespa velutina · 2026-08-20 · The Abbey, Romsey, UK | **ELIGIBLE** (eligible) | awaiting_wallet |
| sighting_8 | call_1 | [397236811](https://www.inaturalist.org/observations/397236811) | Vespa velutina · 2026-08-18 · The Abbey, Romsey, UK | **ELIGIBLE** (eligible) | awaiting_wallet |
| sighting_9 | call_1 | [392140551](https://www.inaturalist.org/observations/392140551) | Vespa velutina · 2026-08-17 · The Abbey, Romsey, England, GB | **INELIGIBLE** (observer_cap) | nothing_paid |

### The reason stored with each ruling

- **sighting_0** (ELIGIBLE): Observation 397236824 by simoncolenutt is Vespa velutina (research grade), seen on 2026-08-20 at Spring Place, Romsey, UK, inside United Kingdom. Validators looked at the photos and they show what the call asks for: The photo shows a hornet nest. simoncolenutt has not put a wallet address in their iNaturalist profile yet, so the reward is held for them.
- **sighting_1** (INELIGIBLE): Validators looked at the photos of observation 397236834 and they do not show what the call asks for: The photo shows a hornet nest.
- **sighting_2** (INELIGIBLE): Observation 411158753 is identified as Vespa crabro, which is not Vespa velutina.
- **sighting_3** (INELIGIBLE): Observation 411204951 (Allee des Pêcheurs-ZA du Turzon, Saint-Georges-les-Bains, Auvergne-Rhône-Alpes, FR) is not inside United Kingdom.
- **sighting_4** (INELIGIBLE): Observation 182971213 was made on 2023-09-11, outside the call's dates.
- **sighting_5** (INELIGIBLE): Observation 411204951 (Allee des Pêcheurs-ZA du Turzon, Saint-Georges-les-Bains, Auvergne-Rhône-Alpes, FR) is not inside United Kingdom.
- **sighting_6** (INELIGIBLE): Observation 411204951 (Allee des Pêcheurs-ZA du Turzon, Saint-Georges-les-Bains, Auvergne-Rhône-Alpes, FR) is not inside United Kingdom.
- **sighting_7** (ELIGIBLE): Observation 397236834 by simoncolenutt is Vespa velutina (research grade), seen on 2026-08-20 at The Abbey, Romsey, UK, inside United Kingdom. simoncolenutt has not put a wallet address in their iNaturalist profile yet, so the reward is held for them.
- **sighting_8** (ELIGIBLE): Observation 397236811 by simoncolenutt is Vespa velutina (research grade), seen on 2026-08-18 at The Abbey, Romsey, UK, inside United Kingdom. simoncolenutt has not put a wallet address in their iNaturalist profile yet, so the reward is held for them.
- **sighting_9** (INELIGIBLE): simoncolenutt has already reached this call's limit of 2 paid sightings.

## Pots at the end of the run

| Call | Funded | Paid | Reserved (held) | Free | Rewards left | State | Submissions and collection until |
|---|---|---|---|---|---|---|---|
| call_0 | 3 GEN | 0 GEN | 0.5 GEN | 2.5 GEN | 5 | open | 2027-01-26 |
| call_1 | 1 GEN | 0 GEN | 0.5 GEN | 0.5 GEN | 2 | open | 2027-01-26 |

## Balance reconciliation

`totals()` (open pots plus reserved rewards) against the contract's on-chain balance, each time after every transfer had finalized:

| Point | Expected | Contract balance | Match |
|---|---|---|---|
| after the refused calls: the contract kept nothing | 0 GEN | 0 GEN | yes |
| call 0 open, the nest's reward reserved | 3 GEN | 3 GEN | yes |
| both calls open | 4 GEN | 4 GEN | yes |
| end of run | 4 GEN | 4 GEN | yes |

Final wallet balances: sponsor 17 GEN, cofunder 4 GEN, scout 1 GEN, bystander 1 GEN.

## Evidence packets

One packet per reading, stored on-chain with the sighting: the facts every validator agreed on (hashed), the hash of the
observer's profile text (where the wallet address is read), and for photo conditions each photo's sha256 with the answer.

| Reading | At (UTC) | Ruling | packet_sha256 | facts_sha256 | profile | photos |
|---|---|---|---|---|---|---|
| sighting_0 #1 | 2026-10-28T19:29:20 | ELIGIBLE | `7e51d5b636f8d521d29d98af808aa8bf3c7e943828a65e0808e3ab2ebbe2552a` | `397b1cb36605eb05a5367821ca217f3de2e1648de4e834a1997490641dbcfd11` | `c8cb34f3a77cfd7a…` | `b3907fd637b9…` MEETS |
| sighting_0 #2 | 2026-10-28T19:32:39 | ELIGIBLE | `40a0144bc01ab02f954f48a9e1271272023ce927d815d7f95c407b5cb5606ed0` | `397b1cb36605eb05a5367821ca217f3de2e1648de4e834a1997490641dbcfd11` | `c8cb34f3a77cfd7a…` | `b3907fd637b9…` MEETS |
| sighting_1 #1 | 2026-10-28T19:30:32 | INELIGIBLE | `218626f21710244502194ddacb876e5ca3eccbde976fcbf01e80091c6e5accc0` | `26c5413b0547864c2c3f0ddd9f528258f85a4558bf78d57dda7e9eef0f9a8cde` | `c8cb34f3a77cfd7a…` | `0b3839d141f3…` NOT_MEETS<br>`1cbe3fc034c3…` NOT_MEETS<br>`1defd1ef39ce…` NOT_MEETS |
| sighting_2 #1 | 2026-10-28T19:31:33 | INELIGIBLE | `c6f9d543eac5472cffe03fefcb1ff15aa62eb18228b1141fad894add8e487be0` | `70808cec6aea228579f5fcfc1396d6296361afe7a9191fc06b4d3ee09471d78c` | `e3b0c44298fc1c14…` | — |
| sighting_2 #2 | 2026-10-28T19:33:08 | INELIGIBLE | `c52e0c68cfe9319c2b581e9f4ce02e94930933678aee1c2e59f8e68cc5e928f5` | `70808cec6aea228579f5fcfc1396d6296361afe7a9191fc06b4d3ee09471d78c` | `e3b0c44298fc1c14…` | — |
| sighting_3 #1 | 2026-10-28T19:31:52 | INELIGIBLE | `f619222e1d0e6cf21c22c942127f5225c37b9ede8c240f5305c376ef880c66cc` | `21c6e499640a4f02819f9fbe55b360fa8ef53736b767adf6a5710510f6699465` | `567612bc9377439d…` | — |
| sighting_4 #1 | 2026-10-28T19:32:06 | INELIGIBLE | `e956840823da28b340534801a4af41e481f2681683a5d0f8b15b9e0efbdbec43` | `1cfe7b0a84fcb9bf4d3d7be46305c20bcb729c96815939e4e07652030e66fe2b` | `e3b0c44298fc1c14…` | — |
| sighting_5 #1 | 2026-10-28T19:33:41 | INELIGIBLE | `9a0e20f484bde1805b3bccc516809b4faef5c3b3e5a9719f4d6a2e9194684365` | `21c6e499640a4f02819f9fbe55b360fa8ef53736b767adf6a5710510f6699465` | `567612bc9377439d…` | — |
| sighting_6 #1 | 2026-10-28T19:34:11 | INELIGIBLE | `dbb8349dd9f0bf80f8a76ee7a31386e3dd545961973a41af910d8650e6d1b2d4` | `21c6e499640a4f02819f9fbe55b360fa8ef53736b767adf6a5710510f6699465` | `567612bc9377439d…` | — |
| sighting_7 #1 | 2026-10-28T19:35:41 | ELIGIBLE | `7c65c8bd5c0c5550d8ca8a87e83a89d3986d40f6b3f63c6730b1294768f8c91e` | `fd10efedb3804aeef590a2f9931bcebdb0b17cdc789baa641116565906bc7c8d` | `c8cb34f3a77cfd7a…` | — |
| sighting_8 #1 | 2026-10-28T19:35:59 | ELIGIBLE | `f08adcadb3515d0a42c3b7d311785091b26b8323d24acf311d720648f2e68398` | `6da853fd525210e1ecade6728e3fa2fdf149e563957b438b279f211c34a0e2b1` | `c8cb34f3a77cfd7a…` | — |
| sighting_9 #1 | 2026-10-28T19:36:13 | INELIGIBLE | `678882f0caab7f565e1e72da8312f0d0e153e6cdca6cb583c918e47a462b3184` | `d1988cfb5d22d10920b0f7fce3b8c36d4dd21ae129ddaf3a7444cc84036e5675` | `c8cb34f3a77cfd7a…` | — |

## Timelines

- **sighting_0**: 2026-10-28T19:29:20 submitted → ELIGIBLE · 2026-10-28T19:32:39 contested → ELIGIBLE by funder · 2026-10-28T19:48:40 held 0.5 GEN until 2027-01-26
- **sighting_1**: 2026-10-28T19:30:32 submitted → INELIGIBLE · 2026-10-28T19:33:27 settled → INELIGIBLE
- **sighting_2**: 2026-10-28T19:31:33 submitted → INELIGIBLE · 2026-10-28T19:33:08 contested → INELIGIBLE by submitter · 2026-10-28T19:48:47 settled → INELIGIBLE
- **sighting_3**: 2026-10-28T19:31:52 submitted → INELIGIBLE · 2026-10-28T19:33:34 settled → INELIGIBLE
- **sighting_4**: 2026-10-28T19:32:06 submitted → INELIGIBLE · 2026-10-28T19:48:54 settled → INELIGIBLE
- **sighting_5**: 2026-10-28T19:33:41 submitted → INELIGIBLE · 2026-10-28T19:33:59 settled → INELIGIBLE
- **sighting_6**: 2026-10-28T19:34:11 submitted → INELIGIBLE · 2026-10-28T19:34:25 settled → INELIGIBLE
- **sighting_7**: 2026-10-28T19:35:41 submitted → ELIGIBLE · 2026-10-28T19:36:32 held 0.25 GEN until 2027-01-26
- **sighting_8**: 2026-10-28T19:35:59 submitted → ELIGIBLE · 2026-10-28T19:49:01 held 0.25 GEN until 2027-01-26
- **sighting_9**: 2026-10-28T19:36:13 submitted → INELIGIBLE · 2026-10-28T19:49:09 settled → INELIGIBLE

## v1.1 checks, live

| Check | Result | Tx |
|---|---|---|
| A call starting on 2026-02-31 (no such date) is refunded, not crashed | REFUNDED: starts and ends must be real calendar dates written YYYY-MM-DD | [`0xdf572d52…`](https://explorer-studio.genlayer.com/tx/0xdf572d527249678dfbaeba4802d20848d937cb4709e1a5436ec615992f38133c) |
| A 0.05 GEN top-up (below the 0.1 GEN minimum) is sent back | REFUNDED: Send at least 0.1 GEN to fund the call | [`0x3c7c3b74…`](https://explorer-studio.genlayer.com/tx/0x3c7c3b74132a9fbd9231d294befa50f938123210e18ba24bb834c95b4063b2b0) |
| A fourth submission of the same observation to the same call is refused | This observation has been submitted to this call 3 times | [`0x155dbdf0…`](https://explorer-studio.genlayer.com/tx/0x155dbdf0c4f19acad754eed1cf96529042e8b0cf9c70f2ea85b669312e6983c7) |

Closing and refunding need a call past its collect date (call end + 30 days), so they are shown by the direct tests, including
`test_stress_hundreds_of_funders_and_refused_sightings_still_close_and_repay_everyone` (301 funders, 120 refused submissions).

## Wallet test from the live app

MetaMask test from the production app (fieldcall-bars26.vercel.app) on the v1.1 contract: the tester opens a call from the "Live hedgehogs, UK" preset (Erinaceus europaeus, United Kingdom, sightings 2026-08-01 to 2026-12-27, 0.5 GEN each, 2 per observer, research grade, accounts at least 30 days old, located to 100 m, photo condition "The photo shows a living hedgehog") and submits three real iNaturalist observations, each chosen to reach a different rule. None of the three observers has a wallet in their profile, so the qualifying reward is held for its observer. (The same test on v1.0 is kept in docs/ui-test-v1.0.json.) Wallet `0x4f80b5c475fced34fc9a07ffccf39e1adc1406bf`. Every transaction is FINALIZED with execution result SUCCESS.

| Step | GEN sent | Result | Tx |
|---|---|---|---|
| Open a call: Live hedgehogs, UK, funded with 2 GEN | 2 GEN | call_2 open; validators read taxon 43042 and place 6857 from iNaturalist | [`0xc2e4cac7…`](https://explorer-studio.genlayer.com/tx/0xc2e4cac7e42df721014f8e4e2972999031790137be64c0989d77f1c4d4e1ebb7) |
| Submit observation 403107732 (a hedgehog walking on a road, Marlow) |  | sighting_10 ELIGIBLE: validators looked at the photo, MEETS; 0.5 GEN reserved, held for jennwren (no wallet in profile) | [`0x9df94179…`](https://explorer-studio.genlayer.com/tx/0x9df94179f607fa2359babcf95f95cbc959b353237a94e79b81a2d67228ccc06f) |
| Submit observation 402415645 (a dead hedgehog in leaf litter, Clydebank) |  | sighting_11 INELIGIBLE (condition_not_met): validators looked at the photo, NOT_MEETS | [`0x5887cf22…`](https://explorer-studio.genlayer.com/tx/0x5887cf223b132f39411d633d330a18a964899ede6bf2f26b3d318b6015b76124) |
| Submit observation 405948698 (a live hedgehog in a garden, Spalding) |  | sighting_12 INELIGIBLE (new_account): the observer's account was opened 2026-10-03, two days before the sighting; decided in code, no photo read | [`0x7bba49a2…`](https://explorer-studio.genlayer.com/tx/0x7bba49a2add843f4f07dc59c9f7af31e927d2275bb8c46c09840573e1d66164f) |

## Every transaction

| Who | Call | GEN | Status | Result | Returned / refused | Tx |
|---|---|---|---|---|---|---|
| sponsor | `create_call("Asian hornet nests, UK", "Vespa velutina", "6857", "2026-08-01", "2026-12-27", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 2 | ACCEPTED | SUCCESS | REFUNDED: taxon_id must be an iNaturalist taxon id, like 119019 | [`0xd6658891…`](https://explorer-studio.genlayer.com/tx/0xd66588911cc816502cc958eff445c761267cf3d0cfc8040b02913ffc812584d4) |
| sponsor | `create_call("Asian hornet nests, UK", "999999999", "6857", "2026-08-01", "2026-12-27", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 2 | ACCEPTED | SUCCESS | REFUNDED: iNaturalist has no taxon with that id | [`0x6dfc4b85…`](https://explorer-studio.genlayer.com/tx/0x6dfc4b850ae2af53a2322ef8fcaa6b991792e03e7d67a600268c51cc05c9167e) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "999999999", "2026-08-01", "2026-12-27", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 2 | ACCEPTED | SUCCESS | REFUNDED: iNaturalist has no place with that id | [`0xccc37c81…`](https://explorer-studio.genlayer.com/tx/0xccc37c812b78baf2624dde302601e921f4078ec8a04b2e53b95a9ff8b40c1d9b) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-08-01", "2026-09-30", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 2 | ACCEPTED | SUCCESS | REFUNDED: ends must be on or after starts, and not in the past | [`0xc61ba1ac…`](https://explorer-studio.genlayer.com/tx/0xc61ba1ac50492c7239b59aa49f97d80d08e0fff3e897e8e211969b5535c44790) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-08-01", "2026-12-27", 0.05 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 2 | ACCEPTED | SUCCESS | REFUNDED: reward must be at least 0.1 GEN | [`0x2af799ef…`](https://explorer-studio.genlayer.com/tx/0x2af799ef5b70aa6fcbf39cf1bf555684a2c1384c3282897c3ce85dbf89e86bd8) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-08-01", "2026-12-27", 1 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 0.5 | ACCEPTED | SUCCESS | REFUNDED: fund the call with at least one reward | [`0x24b67574…`](https://explorer-studio.genlayer.com/tx/0x24b67574a9d2b7970c977fdc406ff51164bd608b52ee5158cddc462b938fbd7f) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-02-31", "2026-12-27", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 2 | ACCEPTED | SUCCESS | REFUNDED: starts and ends must be real calendar dates written YYYY-MM-DD | [`0xdf572d52…`](https://explorer-studio.genlayer.com/tx/0xdf572d527249678dfbaeba4802d20848d937cb4709e1a5436ec615992f38133c) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-08-01", "2026-12-27", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 2 | ACCEPTED | SUCCESS | call_0 | [`0x93cc01e7…`](https://explorer-studio.genlayer.com/tx/0x93cc01e7dc458423b567b9f153c440d10ff657a77c1dab2fb66d3ec4722bc9de) |
| cofunder | `fund("call_0")` | 1 | ACCEPTED | SUCCESS | funded | [`0x09e8b05b…`](https://explorer-studio.genlayer.com/tx/0x09e8b05b39e8e19716f515a360886ed4aa1de9d19ff93e05c444b9f195cc31ea) |
| bystander | `fund("call_0")` | 0.05 | ACCEPTED | SUCCESS | REFUNDED: Send at least 0.1 GEN to fund the call | [`0x3c7c3b74…`](https://explorer-studio.genlayer.com/tx/0x3c7c3b74132a9fbd9231d294befa50f938123210e18ba24bb834c95b4063b2b0) |
| scout | `submit("call_0", "397236824")` | 0 | ACCEPTED | SUCCESS | sighting_0 | [`0x45bc0cbf…`](https://explorer-studio.genlayer.com/tx/0x45bc0cbf2c00b68e0411a1fbb8205a2e4008f76d73ebc3287e08d7066a07b1c1) |
| scout | `submit("call_0", "397236834")` | 0 | ACCEPTED | SUCCESS | sighting_1 | [`0x4f3db17e…`](https://explorer-studio.genlayer.com/tx/0x4f3db17edfa1d7b788087b6861f7c7e051bb80ed02199cbf407212bacabd49e4) |
| scout | `submit("call_0", "411158753")` | 0 | ACCEPTED | SUCCESS | sighting_2 | [`0xddeae4e1…`](https://explorer-studio.genlayer.com/tx/0xddeae4e1009ddd1686f6fb03287381f306be5c93a08768efc10b5b5766ee033e) |
| scout | `submit("call_0", "411204951")` | 0 | ACCEPTED | SUCCESS | sighting_3 | [`0x94962ba8…`](https://explorer-studio.genlayer.com/tx/0x94962ba8db36d9781e507748e1d253a611bb00bc8b9f0cfa4beba4f3aeec5d47) |
| scout | `submit("call_0", "182971213")` | 0 | ACCEPTED | SUCCESS | sighting_4 | [`0xc01a4784…`](https://explorer-studio.genlayer.com/tx/0xc01a47840743d098cd896b099eb18bf73aa2ea3c8ded8f43421c9dd0ff06ca42) |
| scout | `submit("call_0", "397236824")` | 0 | ACCEPTED | ERROR | sighting_0 for this observation is still open | [`0x0746a503…`](https://explorer-studio.genlayer.com/tx/0x0746a503e290137f8c9da091b7adb26f5329790ed564aa142a188ac0e6fe8018) |
| scout | `settle("sighting_0")` | 0 | ACCEPTED | ERROR | The response window is still open; only a funder can pay early | [`0xfbafac9a…`](https://explorer-studio.genlayer.com/tx/0xfbafac9ac0ba7e7360fc7a8f8ba4da3547af35011d12891db7046b311f0ebe27) |
| cofunder | `contest("sighting_0")` | 0 | ACCEPTED | SUCCESS | ELIGIBLE | [`0xce973688…`](https://explorer-studio.genlayer.com/tx/0xce9736882a9280535078442876e56ebb96f44f61d69c7b1b71bef4564067e245) |
| scout | `contest("sighting_2")` | 0 | ACCEPTED | SUCCESS | INELIGIBLE | [`0xea6fdcad…`](https://explorer-studio.genlayer.com/tx/0xea6fdcada2f7472308bb5ebd0214295727a08b31b2c9c0df1ab66574da990879) |
| scout | `settle("sighting_1")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0x5dbb2dae…`](https://explorer-studio.genlayer.com/tx/0x5dbb2dae3f98c1798c450862422102abbefe02ed1b44b521f02b8794ec7ae2f3) |
| scout | `settle("sighting_3")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0xc53d30bd…`](https://explorer-studio.genlayer.com/tx/0xc53d30bd34f76776545d5dff37f539454cbed04d4365b0dcb6c319c5c8782948) |
| scout | `submit("call_0", "411204951")` | 0 | ACCEPTED | SUCCESS | sighting_5 | [`0xae050cc9…`](https://explorer-studio.genlayer.com/tx/0xae050cc9d41fd724d9cfee70487833f59b5f04a2b9e9ffe4988f6d9516f9849b) |
| scout | `settle("sighting_5")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0x085737ee…`](https://explorer-studio.genlayer.com/tx/0x085737ee6a8190bfcc1c72ec5fa0da970c404bae320b84605785baad02ac5d29) |
| scout | `submit("call_0", "411204951")` | 0 | ACCEPTED | SUCCESS | sighting_6 | [`0xdfda0a6c…`](https://explorer-studio.genlayer.com/tx/0xdfda0a6c93969b3de36083e59933a2266d758d6b5cf783b532d770deae76801f) |
| scout | `settle("sighting_6")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0xc811c5ab…`](https://explorer-studio.genlayer.com/tx/0xc811c5ab5e530aed61af66778706b554e19d7ae52832f130cf02b81fc36aac9c) |
| scout | `submit("call_0", "411204951")` | 0 | ACCEPTED | ERROR | This observation has been submitted to this call 3 times | [`0x155dbdf0…`](https://explorer-studio.genlayer.com/tx/0x155dbdf0c4f19acad754eed1cf96529042e8b0cf9c70f2ea85b669312e6983c7) |
| sponsor | `create_call("Asian hornet sightings, UK", "119019", "6857", "2026-08-01", "2026-12-27", 0.25 GEN, 2, true, 30, 100, "")` | 1 | ACCEPTED | SUCCESS | call_1 | [`0xd742f927…`](https://explorer-studio.genlayer.com/tx/0xd742f927c6101b42acd8683b4a9a4b09c942467a166a35ed58db48d1b78df504) |
| scout | `submit("call_1", "397236834")` | 0 | ACCEPTED | SUCCESS | sighting_7 | [`0x41c9a84a…`](https://explorer-studio.genlayer.com/tx/0x41c9a84a45e2c68819664659c5a74072f76d6c14337237742434204f5406ef80) |
| scout | `submit("call_1", "397236811")` | 0 | ACCEPTED | SUCCESS | sighting_8 | [`0x0d29a320…`](https://explorer-studio.genlayer.com/tx/0x0d29a320cb3ca11a48095e0b525b60fcdbe5115939c98a53da9c41ef49fed4b2) |
| scout | `submit("call_1", "392140551")` | 0 | ACCEPTED | SUCCESS | sighting_9 | [`0x5bfb610f…`](https://explorer-studio.genlayer.com/tx/0x5bfb610f8ce54b733bd6d0541193dc3b4e58e471ab7a2bce54c0a09a4dedcb2e) |
| sponsor | `settle("sighting_7")` | 0 | ACCEPTED | SUCCESS | awaiting_wallet | [`0x0d4f00cc…`](https://explorer-studio.genlayer.com/tx/0x0d4f00cc69156158cb7ac319d7c4229d4f19691ef0b69c11b46c5ed87250a95b) |
| bystander | `collect("sighting_7")` | 0 | ACCEPTED | ERROR | simoncolenutt has not added a wallet address to their iNaturalist profile yet | [`0x52a77342…`](https://explorer-studio.genlayer.com/tx/0x52a77342cc934079e64a7b4721b197352515ac69c4c10b41bd1b90a6058b93a9) |
| bystander | `close("call_1")` | 0 | ACCEPTED | ERROR | Sightings can be submitted and rewards collected until 2027-01-26 | [`0x7e47837c…`](https://explorer-studio.genlayer.com/tx/0x7e47837c0d5726370d8bfff7a3d9777dd6d40f42c692964e4863058ae2897416) |
| bystander | `settle("sighting_0")` | 0 | ACCEPTED | SUCCESS | awaiting_wallet | [`0x9fa92587…`](https://explorer-studio.genlayer.com/tx/0x9fa92587f11891e549c51657d383dd44ed53c053472c08651422436769a7790b) |
| bystander | `settle("sighting_2")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0xe761385d…`](https://explorer-studio.genlayer.com/tx/0xe761385d1576c929cb1d9f98f466dc89aca076cee387fe82387632a4b59aa1ce) |
| bystander | `settle("sighting_4")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0x87f6d06c…`](https://explorer-studio.genlayer.com/tx/0x87f6d06c1731bb55e5440d5bc46f3480d27f1cd908d8ba7dc74afaf8502349fd) |
| bystander | `settle("sighting_8")` | 0 | ACCEPTED | SUCCESS | awaiting_wallet | [`0xa44c5326…`](https://explorer-studio.genlayer.com/tx/0xa44c5326ddd699e1b66313823984648d58fe70794facb7d203848fc1ca19dc3c) |
| bystander | `settle("sighting_9")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0x4dd7cffe…`](https://explorer-studio.genlayer.com/tx/0x4dd7cffe927b36cf239ff0e07274f2fc609f2b9cd654e1cfe9e11997d95a1693) |
| scout | `submit("call_0", "397236824")` | 0 | ACCEPTED | ERROR | This observation has already earned its reward (sighting_0) | [`0xccc37dbe…`](https://explorer-studio.genlayer.com/tx/0xccc37dbeec850bdf685e1ae2746f5ae780d23696d2ebf9de4be90091c40e3561) |

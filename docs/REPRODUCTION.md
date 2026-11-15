# FieldCall v2: reproduction of the live runs

Contract on GenLayer Studio: [`0x1c62070B37C5d040ff4E800eD2B6Bd7C4653A4a7`](https://explorer-studio.genlayer.com/address/0x1c62070B37C5d040ff4E800eD2B6Bd7C4653A4a7) (source: `contracts/field_call.py`, checked
byte-identical with `node scripts/verify-code.mjs 0x1c62070B37C5d040ff4E800eD2B6Bd7C4653A4a7`).

`scripts/demo.mjs` opened three **demo calls** with test wallets and submitted **real iNaturalist observations** of the
yellow-legged (Asian) hornet, *Vespa velutina*, an invasive predator of honeybees that the UK asks the public to report. Every
reading below is real validator consensus over iNaturalist's live API; where a call has a photo condition, the validators
looked at the photos themselves. None of these observers has a wallet address in their iNaturalist profile, so their rewards
are **held for them** (and return to the funders if nobody collects); nothing was paid to anyone else.

Accounts: sponsor `0x16387d17B9c4F818E1C92fF18AE186088cAe637A`, cofunder `0x9176CE25C94385E2910b7Bc665a2c9B5d3cd49E4`, scout `0x1Fc31EBcc531276A52c77f5e472a7011941d9C01`, bystander `0x27a2A4311f3801732d6398b579D647BCc2Ea018d`.

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
| sighting_10 | call_2 | [403107732](https://www.inaturalist.org/observations/403107732) | Erinaceus europaeus · 2026-09-24 · The Sycamores, Marlow, England, GB | **ELIGIBLE** (eligible) | awaiting_wallet |
| sighting_11 | call_2 | [414661608](https://www.inaturalist.org/observations/414661608) | Erinaceus europaeus · 2026-11-14 · Alton, UK | **UNCLEAR** (gbif_pending) | nothing_paid |

### The reason stored with each ruling

- **sighting_0** (ELIGIBLE): Observation 397236824 by simoncolenutt is Vespa velutina (research grade), seen on 2026-08-20 at Spring Place, Romsey, UK, inside United Kingdom. GBIF holds the same record (occurrence 6520319147: Vespa velutina, 2026-08-20). Validators looked at the photos and they show what the call asks for: The photo shows a hornet nest. simoncolenutt has not put a wallet address in their iNaturalist profile yet, so the reward is held for them.
- **sighting_1** (INELIGIBLE): The photos of observation 397236834 do not show: The photo shows a hornet nest.
- **sighting_2** (INELIGIBLE): Observation 411158753 is identified as Vespa crabro, which is not Vespa velutina.
- **sighting_3** (INELIGIBLE): Observation 411204951 (Allee des Pêcheurs-ZA du Turzon, Saint-Georges-les-Bains, Auvergne-Rhône-Alpes, FR) is not inside United Kingdom.
- **sighting_4** (INELIGIBLE): Observation 182971213 was made on 2023-09-11, outside the call's dates.
- **sighting_5** (INELIGIBLE): Observation 411204951 (Allee des Pêcheurs-ZA du Turzon, Saint-Georges-les-Bains, Auvergne-Rhône-Alpes, FR) is not inside United Kingdom.
- **sighting_6** (INELIGIBLE): Observation 411204951 (Allee des Pêcheurs-ZA du Turzon, Saint-Georges-les-Bains, Auvergne-Rhône-Alpes, FR) is not inside United Kingdom.
- **sighting_7** (ELIGIBLE): Observation 397236834 by simoncolenutt is Vespa velutina (research grade), seen on 2026-08-20 at The Abbey, Romsey, UK, inside United Kingdom. simoncolenutt has not put a wallet address in their iNaturalist profile yet, so the reward is held for them.
- **sighting_8** (ELIGIBLE): Observation 397236811 by simoncolenutt is Vespa velutina (research grade), seen on 2026-08-18 at The Abbey, Romsey, UK, inside United Kingdom. simoncolenutt has not put a wallet address in their iNaturalist profile yet, so the reward is held for them.
- **sighting_9** (INELIGIBLE): simoncolenutt has already reached this call's limit of 2 paid sightings.
- **sighting_10** (ELIGIBLE): Observation 403107732 by jennwren is Erinaceus europaeus (research grade), seen on 2026-09-24 at The Sycamores, Marlow, England, GB, inside United Kingdom. GBIF holds the same record (occurrence 6566837395: Erinaceus europaeus, 2026-09-24). jennwren has not put a wallet address in their iNaturalist profile yet, so the reward is held for them.
- **sighting_11** (UNCLEAR): GBIF has not published observation 414661608 yet (iNaturalist exports to GBIF weekly); read it again later.

## Pots at the end of the run

| Call | Funded | Paid | Reserved (held) | Free | Rewards left | State | Submissions and collection until |
|---|---|---|---|---|---|---|---|
| call_0 | 3 GEN | 0 GEN | 0.5 GEN | 2.5 GEN | 5 | open | 2027-02-13 |
| call_1 | 1 GEN | 0 GEN | 0.5 GEN | 0.5 GEN | 2 | open | 2027-02-13 |
| call_2 | 1 GEN | 0 GEN | 0.25 GEN | 0.75 GEN | 3 | open | 2027-02-13 |

## Balance reconciliation

`totals()` (running totals of open pots, reserved rewards, unreturned shares of closed calls, and GEN credited but not yet
withdrawn) against the contract's on-chain balance, each time after every transfer had finalized:

| Point | Expected | Contract balance | Match |
|---|---|---|---|
| after the refused calls: the deposit is untouched | 9 GEN | 9 GEN | yes |
| call 0 open, the nest's reward reserved | 10.05 GEN | 10.05 GEN | yes |
| two calls open | 10.05 GEN | 10.05 GEN | yes |
| three calls open | 10.05 GEN | 10.05 GEN | yes |
| after settling | 10.05 GEN | 10.05 GEN | yes |
| end of run | 5 GEN | 5 GEN | yes |

Final wallet balances: sponsor 16 GEN, cofunder 4 GEN, scout 1 GEN, bystander 1 GEN.

## Evidence packets

One packet per reading, stored on-chain with the sighting: the facts every validator agreed on (hashed), the hash of the
observer's profile text (where the wallet address is read), and for photo conditions each photo's sha256 with the answer.

| Reading | At (UTC) | Ruling | packet_sha256 | facts_sha256 | profile | photos |
|---|---|---|---|---|---|---|
| sighting_0 #1 | 2026-11-15T11:32:32 | ELIGIBLE | `ebd6d58d12e013e8dd6ffbaf2ab02cf398e17b25ae8664f9c69e7e6541b41037` | `0aac227e26ef8542448bf05d7935bbe36c727085dc7a10214bcd2a4dbe8a42a2` | `c8cb34f3a77cfd7a…` | `b3907fd637b9…` MEETS |
| sighting_0 #2 | 2026-11-15T11:36:48 | ELIGIBLE | `459dbff6e90a5a338710afe21457376e90585f6061e3bd5867c7b3ae89b077aa` | `0aac227e26ef8542448bf05d7935bbe36c727085dc7a10214bcd2a4dbe8a42a2` | `c8cb34f3a77cfd7a…` | `b3907fd637b9…` MEETS |
| sighting_1 #1 | 2026-11-15T11:33:28 | INELIGIBLE | `bd58efb257a2f0a50cfd8575380544af945edd5e7a0596e195529d8502214955` | `c464e56bae328705ceed78b9a1fa202008cad2c693387eeb52d2a346ac3848ee` | `c8cb34f3a77cfd7a…` | `0b3839d141f3…` NOT_MEETS<br>`1cbe3fc034c3…` NOT_MEETS<br>`1defd1ef39ce…` NOT_MEETS |
| sighting_2 #1 | 2026-11-15T11:35:43 | INELIGIBLE | `31caac17628df9ca6fa6abd3e9ab706d256c1af5ef1566ec0a698be4eff159ce` | `5ab40679e9f8e33bcc99b1b35f7545e64b2b88cffc9bd4c97ebd2474579e2582` | `e3b0c44298fc1c14…` | — |
| sighting_2 #2 | 2026-11-15T11:37:38 | INELIGIBLE | `773fc974d67b1fec3721a181e012b1ceea40165397e28f694a8df0d2ff5117cc` | `5ab40679e9f8e33bcc99b1b35f7545e64b2b88cffc9bd4c97ebd2474579e2582` | `e3b0c44298fc1c14…` | — |
| sighting_3 #1 | 2026-11-15T11:36:02 | INELIGIBLE | `041683998e0210d2b5172c034af38d654d6821208f58ff2436aa150b5a1fb7c8` | `21c6e499640a4f02819f9fbe55b360fa8ef53736b767adf6a5710510f6699465` | `567612bc9377439d…` | — |
| sighting_4 #1 | 2026-11-15T11:36:21 | INELIGIBLE | `67ed42c11c2df9b86a80109213e1a82668595e58bb71a75aa54e153d8b1409c1` | `1cfe7b0a84fcb9bf4d3d7be46305c20bcb729c96815939e4e07652030e66fe2b` | `e3b0c44298fc1c14…` | — |
| sighting_5 #1 | 2026-11-15T11:38:10 | INELIGIBLE | `4989c71d5500abd733163b1677f89d815f2c822c057251941c8abc7b188f51ae` | `21c6e499640a4f02819f9fbe55b360fa8ef53736b767adf6a5710510f6699465` | `567612bc9377439d…` | — |
| sighting_6 #1 | 2026-11-15T11:38:41 | INELIGIBLE | `16e0307615b7975f61d1ea909d4bf669887c6e609cfaaa664a2a09214915c0fe` | `21c6e499640a4f02819f9fbe55b360fa8ef53736b767adf6a5710510f6699465` | `567612bc9377439d…` | — |
| sighting_7 #1 | 2026-11-15T11:40:17 | ELIGIBLE | `d13a1128d541172fe2b1a83ed54616fd36e8c19f72005c2c3ed5a620c27b95a6` | `fd10efedb3804aeef590a2f9931bcebdb0b17cdc789baa641116565906bc7c8d` | `c8cb34f3a77cfd7a…` | — |
| sighting_8 #1 | 2026-11-15T11:40:36 | ELIGIBLE | `cfb70359d569c663cb89d19280a9e0444c78eb713b9c092c5db6a775c4d2f4ad` | `6da853fd525210e1ecade6728e3fa2fdf149e563957b438b279f211c34a0e2b1` | `c8cb34f3a77cfd7a…` | — |
| sighting_9 #1 | 2026-11-15T11:40:54 | INELIGIBLE | `3c0c5f3555ec52ba036420cde70bb245a74a47ba27c488ae7f8a5e647bf40ba9` | `d1988cfb5d22d10920b0f7fce3b8c36d4dd21ae129ddaf3a7444cc84036e5675` | `c8cb34f3a77cfd7a…` | — |
| sighting_10 #1 | 2026-11-15T11:42:45 | ELIGIBLE | `082fbbef19e3d125c763226d792183d8f9d00087143e9c88820c0c8e0ba8d824` | `0b39b0ef0bd69b642d0bd948f1d08448c5ea0338520c3803b0b7841a1639bb08` | `e3b0c44298fc1c14…` | — |
| sighting_11 #1 | 2026-11-15T11:42:58 | UNCLEAR | `7ab43b9843617e28cd3530758cdf918aa57e3ed34ecc21a6bc3cf082a54dcb93` | `56423c3e619359001c1f425553841b03d1ac022f902c4d4adcd47c5e159f2bc3` | `7a145132de3999e0…` | — |

## Timelines

- **sighting_0**: 2026-11-15T11:32:32 submitted → ELIGIBLE · 2026-11-15T11:36:48 contested → ELIGIBLE by funder · 2026-11-15T11:54:37 held 0.5 GEN until 2027-02-13
- **sighting_1**: 2026-11-15T11:33:28 submitted → INELIGIBLE · 2026-11-15T11:37:57 settled → INELIGIBLE
- **sighting_2**: 2026-11-15T11:35:43 submitted → INELIGIBLE · 2026-11-15T11:37:38 contested → INELIGIBLE by submitter · 2026-11-15T11:54:44 settled → INELIGIBLE
- **sighting_3**: 2026-11-15T11:36:02 submitted → INELIGIBLE · 2026-11-15T11:38:03 settled → INELIGIBLE
- **sighting_4**: 2026-11-15T11:36:21 submitted → INELIGIBLE · 2026-11-15T11:54:56 settled → INELIGIBLE
- **sighting_5**: 2026-11-15T11:38:10 submitted → INELIGIBLE · 2026-11-15T11:38:29 settled → INELIGIBLE
- **sighting_6**: 2026-11-15T11:38:41 submitted → INELIGIBLE · 2026-11-15T11:38:59 settled → INELIGIBLE
- **sighting_7**: 2026-11-15T11:40:17 submitted → ELIGIBLE · 2026-11-15T11:41:13 held 0.25 GEN until 2027-02-13
- **sighting_8**: 2026-11-15T11:40:36 submitted → ELIGIBLE · 2026-11-15T11:55:03 held 0.25 GEN until 2027-02-13
- **sighting_9**: 2026-11-15T11:40:54 submitted → INELIGIBLE · 2026-11-15T11:55:15 settled → INELIGIBLE
- **sighting_10**: 2026-11-15T11:42:45 submitted → ELIGIBLE · 2026-11-15T11:55:22 held 0.25 GEN until 2027-02-13
- **sighting_11**: 2026-11-15T11:42:58 submitted → UNCLEAR · 2026-11-15T11:43:12 settled → UNCLEAR

## v2 checks, live

| Check | Result | Tx |
|---|---|---|
| Opening a call sends no GEN: it is funded from a deposit, and a refused call leaves the deposit untouched | iNaturalist has no taxon with that id | [`0x41712596…`](https://explorer-studio.genlayer.com/tx/0x417125965dfdfb7acdfcaed7be8af3142a3502b14eeec5841ce3ebcd97d25ad4) |
| A call starting on 2026-02-31 (no such date) is refused, not crashed | starts and ends must be real calendar dates written YYYY-MM-DD | [`0x2f7bf002…`](https://explorer-studio.genlayer.com/tx/0x2f7bf002cb295bff0e269b49e39162cbaa9d098320869a02fa4ef2e162fe834a) |
| A call asking for more than the deposit is refused | deposit first: 20 GEN needed, 9 GEN credited | [`0xd5d25759…`](https://explorer-studio.genlayer.com/tx/0xd5d2575912efbddc0f88e3b284e2483c4e858a3dc23886b0fe76124b0717cddd) |
| A 0.05 GEN top-up (below the 0.1 GEN minimum) is credited back | REFUNDED: Send at least 0.1 GEN to fund the call (your GEN is credited back: withdraw it) | [`0x684061a5…`](https://explorer-studio.genlayer.com/tx/0x684061a51e5fd9af72686452fb1b50f6960b27249ed20ee42b669d2d5bf1c6d5) |
| A fourth submission of the same observation to the same call is refused | This observation has been submitted to this call 3 times | [`0xcdd907e4…`](https://explorer-studio.genlayer.com/tx/0xcdd907e43e053ed1710b159145681e979b01a3e9d1a00c4dee65cc1a0a847ba4) |
| Only withdraw sends GEN out, to the caller | 5000000000000000000 | [`0x33e1141b…`](https://explorer-studio.genlayer.com/tx/0x33e1141bbbb717ffe6e26bd8e33b0cb2e1f212b49b209a1e865e20cabbeb7057) |

Closing and refunding need a call past its collect date (call end + 30 days), so they are shown by the direct tests, including
`test_stress_hundreds_of_funders_and_refused_sightings_still_close_and_repay_everyone` (301 funders, 120 refused submissions).

## Bradbury testnet run

The same program (`contracts/field_call.bradbury.py`: the Studio source with the Bradbury header, checked by
`python3 scripts/bradbury_source.py --check`) at [`0xA6280Ed66eF5Ea243DEC2236441Be0588EAFEb0f`](https://explorer-bradbury.genlayer.com/address/0xA6280Ed66eF5Ea243DEC2236441Be0588EAFEb0f), run by
`scripts/demo-bradbury.mjs`. Five Bradbury validators read iNaturalist and GBIF for every reading. Bradbury reports each
transaction's decision, execution result and votes; results were read back from the contract.

Call `call_0`: Asian hornet sightings, UK (checked against GBIF) (GBIF required: true), reward 0.25 GEN.

| Sighting | Observation | Ruling | Reason |
|---|---|---|---|
| sighting_0 | [397236834](https://www.inaturalist.org/observations/397236834) | **ELIGIBLE** (eligible) | Observation 397236834 by simoncolenutt is Vespa velutina (research grade), seen on 2026-08-20 at The Abbey, Romsey, UK, inside United Kingdom. GBIF holds the same record (occurrence 6519064393: Vespa velutina, 2026-08-20). simoncolenutt has not put a wallet address in their iNaturalist profile yet, so the reward is held for them. |
| sighting_1 | [411158753](https://www.inaturalist.org/observations/411158753) | **INELIGIBLE** (wrong_taxon) | Observation 411158753 is identified as Vespa crabro, which is not Vespa velutina. |

| Who | Call | Status | Execution | Votes | Seconds | Tx |
|---|---|---|---|---|---|---|
| sponsor | `deposit()` | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/RETURN/RETURN/RETURN | 31 | [`0xd224a70d…`](https://explorer-bradbury.genlayer.com/tx/0xd224a70d8d5fe1146ec6bb4ecfe070a81982d5628497f8df2a8306f9fc203ddf) |
| sponsor | `create_call("Asian hornet sightings, UK", "999999999", "6857", "2026-08-01", "2027-01-14", "250000000000000000", 2, true, 30, 100, "", true, "1000000000000000000")` | ACCEPTED | FINISHED_WITH_ERROR | ERROR/ERROR/ERROR/ERROR/ERROR | 32 | [`0xa715deef…`](https://explorer-bradbury.genlayer.com/tx/0xa715deef990103a16e22fa0571e9e7862be98c5563426ef814df6265cd67ab94) |
| sponsor | `create_call("Asian hornet sightings, UK (checked against GBIF)", "119019", "6857", "2026-08-01", "2027-01-14", "250000000000000000", 2, true, 30, 100, "", true, "1000000000000000000")` | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/RETURN/RETURN/RETURN | 40 | [`0x1422f391…`](https://explorer-bradbury.genlayer.com/tx/0x1422f391ad79ff3fbf6e4bc16e05996760f6ab2762d90d72dd596866d274a69d) |
| scout | `submit("call_0", "397236834")` | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/RETURN/RETURN/RETURN | 39 | [`0x059b4db0…`](https://explorer-bradbury.genlayer.com/tx/0x059b4db00ce3bc4642a5fa601a53dcf0b179f19b8a429b25d5e71a121a010ea6) |
| scout | `submit("call_0", "411158753")` | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/RETURN/RETURN/RETURN | 38 | [`0x68fb8bcf…`](https://explorer-bradbury.genlayer.com/tx/0x68fb8bcf65755d04c9450cba63f13e63babda91a3c9840593ded9ffb4fb493e4) |
| sponsor | `settle("sighting_0")` | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/RETURN/RETURN/RETURN | 38 | [`0x1aafa68b…`](https://explorer-bradbury.genlayer.com/tx/0x1aafa68b02ec75cc4f9eb1c8ca4bada76549230d1bf2265b78d7cb621aa8a4c9) |
| scout | `settle("sighting_1")` | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/RETURN/RETURN/RETURN | 39 | [`0x19830cdd…`](https://explorer-bradbury.genlayer.com/tx/0x19830cdd5f5429ddd1d766b741c590521dcfeb599b841b34e8f6be8199c79b93) |
| sponsor | `collect("sighting_0")` | ACCEPTED | FINISHED_WITH_ERROR | ERROR/ERROR/ERROR/ERROR/ERROR | 41 | [`0x31c952af…`](https://explorer-bradbury.genlayer.com/tx/0x31c952afd20b7aa450230a997f7e64edd9d412eda27023a5224de05f566137e7) |
| sponsor | `withdraw()` | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/RETURN/RETURN/RETURN | 40 | [`0x04708fcf…`](https://explorer-bradbury.genlayer.com/tx/0x04708fcfaed79b526e2455968fe481d5b12c891029135110a4160f58d5df85c1) |

| Point | Expected | Contract balance | Match |
|---|---|---|---|
| call open, 0.5 GEN of the deposit still credited | 1.5 GEN | 1.5 GEN | yes |
| both sightings settled | 1.5 GEN | 1.5 GEN | yes |
| end of run, after the sponsor withdrew the unused deposit | 1 GEN | 1 GEN | yes |

## Wallet test from the live app

MetaMask test from the production app (fieldcall-bars26.vercel.app) on Bradbury testnet, contract 0xA6280Ed66eF5Ea243DEC2236441Be0588EAFEb0f, five validators per transaction. The tester opens a call from the "Asian hornet nests, UK" preset with "Also check GBIF" ticked and 1 GEN of funding: the app first deposits the GEN, then opens the call, which sends none. A submission to that photo call ended without a majority (Bradbury validators often run out of time on image prompts, as the README says; the contract state did not change), so the tester submitted the same real observation to the demo's GBIF call without a photo condition, which all five validators ruled eligible. The rest exercises the credit path: a refused top-up is credited back and withdrawn, and the eligible sighting is settled once its response window has passed. Wallet `0x4f80b5c475fced34fc9a07ffccf39e1adc1406bf`.

| Step | GEN sent | Result | Tx |
|---|---|---|---|
| Deposit 1 GEN (sent by the app before opening the call) | 1 GEN | credited to the tester; 5/5 validators | [`0x9c53bee2…`](https://explorer-bradbury.genlayer.com/tx/0x9c53bee2ad4a3e9e8ca4e58cf9a803db8de1b6f504a36b30dadf59c4b3b6d282) |
| Open a call: Asian hornet nests, UK, GBIF required, funded with 1 GEN from the deposit |  | call_1 open; validators read taxon 119019 and place 6857 from iNaturalist; 5/5 | [`0x34ba80cf…`](https://explorer-bradbury.genlayer.com/tx/0x34ba80cfa845adf8011d2498981c540a0bacc038d0bb573ca0349396987ed3f3) |
| Submit observation 397236811 to the photo call |  | no majority (two validators disagreed on the photo reading, one timed out): no sighting stored, the pot untouched | [`0xfa8aeb47…`](https://explorer-bradbury.genlayer.com/tx/0xfa8aeb47f013fe9129b10900851281152f48db4d033558a4d7c82990a86cfa2f) |
| Collect the reward of the demo's sighting_0 |  | refused in code, 5/5: the observer has no wallet in their iNaturalist profile, so nobody can collect it yet | [`0x554d4054…`](https://explorer-bradbury.genlayer.com/tx/0x554d40540e89db732d01092bce444fd36ba3498c9822c2d310e7eec7de78dd8d) |
| Submit observation 397236811 to call_0 (GBIF required, no photo condition) |  | sighting_2 ELIGIBLE, 5/5: Vespa velutina, research grade, Romsey 2026-08-18, inside the UK; GBIF occurrence 6519102855 has the same species and date; reward held for the observer | [`0x10a0c97f…`](https://explorer-bradbury.genlayer.com/tx/0x10a0c97f227498920167b008c932dcd491fe7efa8c0c1f680ef8aba3659194e3) |
| Collect sighting_0 again |  | refused again, 5/5 (same reason) | [`0x6d1ec97a…`](https://explorer-bradbury.genlayer.com/tx/0x6d1ec97ae6ec6e51bc54d7361682cd253b2aa50e4cdae978b19a184731969afb) |
| Add 0.05 GEN to call_1 (below the 0.1 GEN minimum) | 0.05 GEN | REFUNDED: credited back to the tester, 5/5; totals() owed 0.05 GEN, contract balance matched | [`0x14f8a061…`](https://explorer-bradbury.genlayer.com/tx/0x14f8a0611a70297d4039776e2c9438f711a02ac3540bea97f7b3ab699977e589) |
| Withdraw |  | 0.05 GEN sent to the tester, 5/5; credit back to 0 | [`0xb6611237…`](https://explorer-bradbury.genlayer.com/tx/0xb6611237ce2168128f10fe99d1b016112ef6542feecedcbcec2d1f465510670b) |
| Settle sighting_2 after its 10-minute window |  | settled, 5/5: awaiting_wallet, 0.5 GEN held for the observer | [`0x4d9e74bf…`](https://explorer-bradbury.genlayer.com/tx/0x4d9e74bfcb8ea38ff916425062771ade34500a74d23a780d6b0242ead7daecec) |

## Every transaction

| Who | Call | GEN | Status | Result | Returned / refused | Tx |
|---|---|---|---|---|---|---|
| sponsor | `deposit()` | 9 | ACCEPTED | SUCCESS | 9000000000000000000 | [`0x68b3130d…`](https://explorer-studio.genlayer.com/tx/0x68b3130d358a00a95da64abd74ab89f582088d364dc4078a41ec4189e7d1c969) |
| sponsor | `create_call("Asian hornet nests, UK", "Vespa velutina", "6857", "2026-08-01", "2027-01-14", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest", true, 2 GEN)` | 0 | ACCEPTED | ERROR | taxon_id must be an iNaturalist taxon id, like 119019 | [`0xf78cf4b3…`](https://explorer-studio.genlayer.com/tx/0xf78cf4b355326a3adc431400c0b4d22399966e085670b171db6f2187587103d0) |
| sponsor | `create_call("Asian hornet nests, UK", "999999999", "6857", "2026-08-01", "2027-01-14", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest", true, 2 GEN)` | 0 | ACCEPTED | ERROR | iNaturalist has no taxon with that id | [`0x41712596…`](https://explorer-studio.genlayer.com/tx/0x417125965dfdfb7acdfcaed7be8af3142a3502b14eeec5841ce3ebcd97d25ad4) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "999999999", "2026-08-01", "2027-01-14", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest", true, 2 GEN)` | 0 | ACCEPTED | ERROR | iNaturalist has no place with that id | [`0xc7d49968…`](https://explorer-studio.genlayer.com/tx/0xc7d49968c59e7b87eaebf5a08a4320b35c60b7aa20724f75c9199c1b573d7883) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-08-01", "2026-09-30", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest", true, 2 GEN)` | 0 | ACCEPTED | ERROR | ends must be on or after starts, and not in the past | [`0x066a81f5…`](https://explorer-studio.genlayer.com/tx/0x066a81f5f554ee01b69259a2c82e35736e68f3b957c506a3999d774ec1c1f221) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-08-01", "2027-01-14", 0.05 GEN, 2, true, 30, 100, "The photo shows a hornet nest", true, 2 GEN)` | 0 | ACCEPTED | ERROR | reward must be a whole number from 100000000000000000 to 1000000000000000000000000000 | [`0xbfa9f16e…`](https://explorer-studio.genlayer.com/tx/0xbfa9f16ecd098333ec11b0921b646766c3fc095d2feb3dd2635b4a2aab4ea051) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-08-01", "2027-01-14", 1 GEN, 2, true, 30, 100, "The photo shows a hornet nest", true, 0.5 GEN)` | 0 | ACCEPTED | ERROR | fund the call with at least one reward | [`0x4beefe63…`](https://explorer-studio.genlayer.com/tx/0x4beefe639bd69db7f06ef90e23a0a2791979c79c3387282462b3fd5a96298364) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-02-31", "2027-01-14", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest", true, 2 GEN)` | 0 | ACCEPTED | ERROR | starts and ends must be real calendar dates written YYYY-MM-DD | [`0x2f7bf002…`](https://explorer-studio.genlayer.com/tx/0x2f7bf002cb295bff0e269b49e39162cbaa9d098320869a02fa4ef2e162fe834a) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-08-01", "2027-01-14", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest", true, 20 GEN)` | 0 | ACCEPTED | ERROR | deposit first: 20 GEN needed, 9 GEN credited | [`0xd5d25759…`](https://explorer-studio.genlayer.com/tx/0xd5d2575912efbddc0f88e3b284e2483c4e858a3dc23886b0fe76124b0717cddd) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-08-01", "2027-01-14", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest", true, 2 GEN)` | 0 | ACCEPTED | SUCCESS | call_0 | [`0x082c482d…`](https://explorer-studio.genlayer.com/tx/0x082c482d7b5dc7ec64e4aae3f823dd67454fc7223d90fee47e1f4b55c21490cf) |
| cofunder | `fund("call_0")` | 1 | ACCEPTED | SUCCESS | funded | [`0x4a4ac847…`](https://explorer-studio.genlayer.com/tx/0x4a4ac847f2fe9d115675a8d75c0d1cf3bbbe9bf9d4a77d696b4b710d45aa8b44) |
| bystander | `fund("call_0")` | 0.05 | ACCEPTED | SUCCESS | REFUNDED: Send at least 0.1 GEN to fund the call (your GEN is credited back: withdraw it) | [`0x684061a5…`](https://explorer-studio.genlayer.com/tx/0x684061a51e5fd9af72686452fb1b50f6960b27249ed20ee42b669d2d5bf1c6d5) |
| scout | `submit("call_0", "397236824")` | 0 | ACCEPTED | SUCCESS | sighting_0 | [`0x4ea76d22…`](https://explorer-studio.genlayer.com/tx/0x4ea76d22dd61505f2ad43b9debceebd3520e7d88468a1d4125c0e424d71c65c7) |
| scout | `submit("call_0", "397236834")` | 0 | ACCEPTED | SUCCESS | sighting_1 | [`0xcc669b7f…`](https://explorer-studio.genlayer.com/tx/0xcc669b7f598f428c398962907ed9f3aba510f9bb240184f22d904e9579769b19) |
| scout | `submit("call_0", "411158753")` | 0 | ACCEPTED | SUCCESS | sighting_2 | [`0xa03db9f6…`](https://explorer-studio.genlayer.com/tx/0xa03db9f6e40059a73d5733e6686f7483c59b32932995b858b49d7a262c2e0642) |
| scout | `submit("call_0", "411204951")` | 0 | ACCEPTED | SUCCESS | sighting_3 | [`0x65e3682b…`](https://explorer-studio.genlayer.com/tx/0x65e3682b514bbb854ba2fbaca0c51f8c31bc85ee27f2a3e13e654ee9f5122b67) |
| scout | `submit("call_0", "182971213")` | 0 | ACCEPTED | SUCCESS | sighting_4 | [`0x1fb91a8e…`](https://explorer-studio.genlayer.com/tx/0x1fb91a8e2a8b2f16d6dac9b2fba56a5996ada1340d388d7daf48e412c1679ddf) |
| scout | `submit("call_0", "397236824")` | 0 | ACCEPTED | ERROR | sighting_0 for this observation is still open | [`0x47b218c5…`](https://explorer-studio.genlayer.com/tx/0x47b218c5249fb65ff61ae720eabcd76d3e3b9a2717c4afac1462844569fab75d) |
| scout | `settle("sighting_0")` | 0 | ACCEPTED | ERROR | The response window is still open; only a funder can pay early | [`0xb4ffa06f…`](https://explorer-studio.genlayer.com/tx/0xb4ffa06fb289c705da0fb6ea18f2d424f1937ef114bee5003f0fbade95726715) |
| cofunder | `contest("sighting_0")` | 0 | ACCEPTED | SUCCESS | ELIGIBLE | [`0x1bfc6afc…`](https://explorer-studio.genlayer.com/tx/0x1bfc6afce5f7cbb9954a66bdd0aeb3de58ecdc4960bc462d750e34b0e66f0743) |
| scout | `contest("sighting_2")` | 0 | ACCEPTED | SUCCESS | INELIGIBLE | [`0x5ecaa796…`](https://explorer-studio.genlayer.com/tx/0x5ecaa796734e4146178964e33d4ed7f8816fdf237befd7f41f5edce83603ab1c) |
| scout | `settle("sighting_1")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0x26c8097c…`](https://explorer-studio.genlayer.com/tx/0x26c8097c20819d0117ecaa47086b12c664c984f78582f7dc89f6ec69588ee116) |
| scout | `settle("sighting_3")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0x77d736ee…`](https://explorer-studio.genlayer.com/tx/0x77d736ee17714ea55e46b033d145e2781c03c21524c080ae23cf8102da26da15) |
| scout | `submit("call_0", "411204951")` | 0 | ACCEPTED | SUCCESS | sighting_5 | [`0x694594fc…`](https://explorer-studio.genlayer.com/tx/0x694594fc2c40845ff8769d55310a9f6b2805baf33cfb0eb62547845804805f4c) |
| scout | `settle("sighting_5")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0x9758c6fa…`](https://explorer-studio.genlayer.com/tx/0x9758c6fa71ba088d23fb3ab0377905333eba1e443044ea4e6b97256114af24ff) |
| scout | `submit("call_0", "411204951")` | 0 | ACCEPTED | SUCCESS | sighting_6 | [`0x344d2fa6…`](https://explorer-studio.genlayer.com/tx/0x344d2fa64da49aff934027c0cc785d62e0b1db10e591b7decb3dc985ba0a614b) |
| scout | `settle("sighting_6")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0xbe15fd6b…`](https://explorer-studio.genlayer.com/tx/0xbe15fd6b379ef3bd4573eae9275e1d2b120d66b3347eb0389ee55ff0a4ed54bc) |
| scout | `submit("call_0", "411204951")` | 0 | ACCEPTED | ERROR | This observation has been submitted to this call 3 times | [`0xcdd907e4…`](https://explorer-studio.genlayer.com/tx/0xcdd907e43e053ed1710b159145681e979b01a3e9d1a00c4dee65cc1a0a847ba4) |
| sponsor | `create_call("Asian hornet sightings, UK", "119019", "6857", "2026-08-01", "2027-01-14", 0.25 GEN, 2, true, 30, 100, "", false, 1 GEN)` | 0 | ACCEPTED | SUCCESS | call_1 | [`0x4c5d0128…`](https://explorer-studio.genlayer.com/tx/0x4c5d01280bb86221f5c5c8d7cf8231e8ee54ec24b8d5db3e7a0ddae5eaae9a26) |
| scout | `submit("call_1", "397236834")` | 0 | ACCEPTED | SUCCESS | sighting_7 | [`0xc7417b08…`](https://explorer-studio.genlayer.com/tx/0xc7417b082807d3535ec7bb9945955df5426c09eff7a01a7a53bbf49de5e8c03f) |
| scout | `submit("call_1", "397236811")` | 0 | ACCEPTED | SUCCESS | sighting_8 | [`0x511641fd…`](https://explorer-studio.genlayer.com/tx/0x511641fd5613605ded207e11e49943b2e47604909cb1509cbd227d2ca9422358) |
| scout | `submit("call_1", "392140551")` | 0 | ACCEPTED | SUCCESS | sighting_9 | [`0x8d2ed6da…`](https://explorer-studio.genlayer.com/tx/0x8d2ed6da2a22432ff37ee6247960e66f10280746b6b53ba7374fa9b7c7724f8c) |
| sponsor | `settle("sighting_7")` | 0 | ACCEPTED | SUCCESS | awaiting_wallet | [`0x84773b47…`](https://explorer-studio.genlayer.com/tx/0x84773b479895325c28253d7c41ed108f1d1dffb45a1da1f2f5dc9278849646d5) |
| bystander | `collect("sighting_7")` | 0 | ACCEPTED | ERROR | simoncolenutt has not added a wallet address to their iNaturalist profile yet | [`0x018a2774…`](https://explorer-studio.genlayer.com/tx/0x018a27742b559b5204df9f0677e67a386300c48c652fdeae64d7c6020e64e9c5) |
| bystander | `close("call_1")` | 0 | ACCEPTED | ERROR | Sightings can be submitted and rewards collected until 2027-02-13 | [`0xd75b4a58…`](https://explorer-studio.genlayer.com/tx/0xd75b4a58e0d8d0c6e024af4c0aa614aa91e56d61f679610724e8063748ec14d7) |
| sponsor | `create_call("Hedgehogs, UK (checked against GBIF)", "43042", "6857", "2026-09-01", "2027-01-14", 0.25 GEN, 3, true, 30, 1000, "", true, 1 GEN)` | 0 | ACCEPTED | SUCCESS | call_2 | [`0xd576de3c…`](https://explorer-studio.genlayer.com/tx/0xd576de3cfcb837d019acde41a913c6ffce9649ade982898854ed9358a2df0aa8) |
| scout | `submit("call_2", "403107732")` | 0 | ACCEPTED | SUCCESS | sighting_10 | [`0x03dffb70…`](https://explorer-studio.genlayer.com/tx/0x03dffb706a241345f1b272cc125243d990200ef1d2826aa3a1050acffc248071) |
| scout | `submit("call_2", "414661608")` | 0 | ACCEPTED | SUCCESS | sighting_11 | [`0x01ad9672…`](https://explorer-studio.genlayer.com/tx/0x01ad9672d1ceb852cc0f27b07f374de3d962caf67fa11e7331fffc372f1abd80) |
| scout | `settle("sighting_11")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0x9696ff30…`](https://explorer-studio.genlayer.com/tx/0x9696ff3086bc3386314d9e039c19aeb38a5d4f60b8c730d75bc0b53d35d548e3) |
| bystander | `settle("sighting_0")` | 0 | ACCEPTED | SUCCESS | awaiting_wallet | [`0x27a3e9ea…`](https://explorer-studio.genlayer.com/tx/0x27a3e9ea3437cdd23de40ce29411928c8c1316de356c4b9f6cbfca118baf828b) |
| bystander | `settle("sighting_2")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0x5aec5b2b…`](https://explorer-studio.genlayer.com/tx/0x5aec5b2b28dd9c7cbb5277ff8c6f85628ea4ff6de7f3f8d13443e8774084e99b) |
| bystander | `settle("sighting_4")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0x16804b50…`](https://explorer-studio.genlayer.com/tx/0x16804b50324aabeb8575501f50ecc1983861a1869f9c20eb9dbf3bc8a85a6678) |
| bystander | `settle("sighting_8")` | 0 | ACCEPTED | SUCCESS | awaiting_wallet | [`0xc430cda3…`](https://explorer-studio.genlayer.com/tx/0xc430cda36c55b68b990c9972113ec12e2509fb46ad5da3be415176b5f2e69984) |
| bystander | `settle("sighting_9")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0x7679f72c…`](https://explorer-studio.genlayer.com/tx/0x7679f72cad0eeff9d09be2eb009246ff47b4611619169f0f94fd2e77520a584d) |
| bystander | `settle("sighting_10")` | 0 | ACCEPTED | SUCCESS | awaiting_wallet | [`0xae733d26…`](https://explorer-studio.genlayer.com/tx/0xae733d26117ae3026e7865b5571e3e7e2154e3fbfbe696ea8f7a39ac905e4bb4) |
| scout | `submit("call_0", "397236824")` | 0 | ACCEPTED | ERROR | This observation has already earned its reward (sighting_0) | [`0xaca26677…`](https://explorer-studio.genlayer.com/tx/0xaca26677d4438e427337b2c9c159e29c80277e3d7c1b1f5ef5833bfebde1692c) |
| sponsor | `withdraw()` | 0 | ACCEPTED | SUCCESS | 5000000000000000000 | [`0x33e1141b…`](https://explorer-studio.genlayer.com/tx/0x33e1141bbbb717ffe6e26bd8e33b0cb2e1f212b49b209a1e865e20cabbeb7057) |
| bystander | `withdraw()` | 0 | ACCEPTED | SUCCESS | 50000000000000000 | [`0x4d157fca…`](https://explorer-studio.genlayer.com/tx/0x4d157fca254707c99139a775977fbed6779ac7cdef016df158988b4875a93f7a) |
| bystander | `withdraw()` | 0 | ACCEPTED | ERROR | Nothing to withdraw | [`0xfa8f54ef…`](https://explorer-studio.genlayer.com/tx/0xfa8f54ef92347b88b55544c5f6fb306161a89f979d188bfe616f71ef947743ac) |

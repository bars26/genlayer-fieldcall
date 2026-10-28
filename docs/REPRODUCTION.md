# FieldCall: reproduction of the live run

Contract on GenLayer Studio: [`0x0F8709541c0ae378A2E1a1958032d7CaE3f269Dc`](https://explorer-studio.genlayer.com/address/0x0F8709541c0ae378A2E1a1958032d7CaE3f269Dc) (source: `contracts/field_call.py`, checked
byte-identical with `node scripts/verify-code.mjs 0x0F8709541c0ae378A2E1a1958032d7CaE3f269Dc`).

`scripts/demo.mjs` opened two **demo calls** with test wallets and submitted **real iNaturalist observations** of the
yellow-legged (Asian) hornet, *Vespa velutina*, an invasive predator of honeybees that the UK asks the public to report. Every
reading below is real validator consensus over iNaturalist's live API; where a call has a photo condition, the validators
looked at the photos themselves. None of these observers has a wallet address in their iNaturalist profile, so their rewards
are **held for them** (and return to the funders if nobody collects); nothing was paid to anyone else.

Accounts: sponsor `0x1933F1EcF5334bB888745d4FD7868811fB2ad909`, cofunder `0xb36f3bc2057dAc01068d401C76D378539B9dC170`, scout `0x88141EF57C1e8aaB69E027DE9AB08e937f9bfD47`, bystander `0xd8D24FffA980041dAbAAa4c23fc330dAac79699C`.

## Rulings

| Sighting | Call | Observation | What iNaturalist records | Ruling | Outcome |
|---|---|---|---|---|---|
| sighting_0 | call_0 | [397236824](https://www.inaturalist.org/observations/397236824) | Vespa velutina · 2026-08-20 · Spring Place, Romsey, UK | **ELIGIBLE** (eligible)<br>photos looked at: MEETS | awaiting_wallet |
| sighting_1 | call_0 | [397236834](https://www.inaturalist.org/observations/397236834) | Vespa velutina · 2026-08-20 · The Abbey, Romsey, UK | **INELIGIBLE** (condition_not_met)<br>photos looked at: NOT MEETS, NOT MEETS, NOT MEETS | nothing_paid |
| sighting_2 | call_0 | [411158753](https://www.inaturalist.org/observations/411158753) | Vespa crabro · 2026-10-25 · The Mill House, Liskeard, England, GB | **INELIGIBLE** (wrong_taxon) | nothing_paid |
| sighting_3 | call_0 | [411204951](https://www.inaturalist.org/observations/411204951) | Vespa velutina nigrithorax · 2026-10-23 · Allee des Pêcheurs-ZA du Turzon, Saint-Georges-les-Bains, Auvergne-Rhône-Alpes, FR | **INELIGIBLE** (outside_place) | nothing_paid |
| sighting_4 | call_0 | [182971213](https://www.inaturalist.org/observations/182971213) | Vespa velutina nigrithorax · 2023-09-11 · Hull HU9, UK | **INELIGIBLE** (outside_dates) | nothing_paid |
| sighting_5 | call_1 | [397236834](https://www.inaturalist.org/observations/397236834) | Vespa velutina · 2026-08-20 · The Abbey, Romsey, UK | **ELIGIBLE** (eligible) | awaiting_wallet |
| sighting_6 | call_1 | [397236811](https://www.inaturalist.org/observations/397236811) | Vespa velutina · 2026-08-18 · The Abbey, Romsey, UK | **ELIGIBLE** (eligible) | awaiting_wallet |
| sighting_7 | call_1 | [392140551](https://www.inaturalist.org/observations/392140551) | Vespa velutina · 2026-08-17 · The Abbey, Romsey, England, GB | **INELIGIBLE** (observer_cap) | nothing_paid |

### The reason stored with each ruling

- **sighting_0** (ELIGIBLE): Observation 397236824 by simoncolenutt is Vespa velutina (research grade), seen on 2026-08-20 at Spring Place, Romsey, UK, inside United Kingdom. Validators looked at the photos and they show what the call asks for: The photo shows a hornet nest. simoncolenutt has not put a wallet address in their iNaturalist profile yet, so the reward is held for them.
- **sighting_1** (INELIGIBLE): Validators looked at the photos of observation 397236834 and they do not show what the call asks for: The photo shows a hornet nest.
- **sighting_2** (INELIGIBLE): Observation 411158753 is identified as Vespa crabro, which is not Vespa velutina.
- **sighting_3** (INELIGIBLE): Observation 411204951 (Allee des Pêcheurs-ZA du Turzon, Saint-Georges-les-Bains, Auvergne-Rhône-Alpes, FR) is not inside United Kingdom.
- **sighting_4** (INELIGIBLE): Observation 182971213 was made on 2023-09-11, outside the call's dates.
- **sighting_5** (ELIGIBLE): Observation 397236834 by simoncolenutt is Vespa velutina (research grade), seen on 2026-08-20 at The Abbey, Romsey, UK, inside United Kingdom. simoncolenutt has not put a wallet address in their iNaturalist profile yet, so the reward is held for them.
- **sighting_6** (ELIGIBLE): Observation 397236811 by simoncolenutt is Vespa velutina (research grade), seen on 2026-08-18 at The Abbey, Romsey, UK, inside United Kingdom. simoncolenutt has not put a wallet address in their iNaturalist profile yet, so the reward is held for them.
- **sighting_7** (INELIGIBLE): simoncolenutt has already reached this call's limit of 2 paid sightings.

## Pots at the end of the run

| Call | Funded | Paid | Reserved (held) | Free | Rewards left | State | Submissions and collection until |
|---|---|---|---|---|---|---|---|
| call_0 | 3 GEN | 0 GEN | 0.5 GEN | 2.5 GEN | 5 | open | 2027-01-25 |
| call_1 | 1 GEN | 0 GEN | 0.5 GEN | 0.5 GEN | 2 | open | 2027-01-25 |

## Balance reconciliation

`totals()` (open pots plus reserved rewards) against the contract's on-chain balance, each time after every transfer had finalized:

| Point | Expected | Contract balance | Match |
|---|---|---|---|
| call 0 open, the nest's reward reserved | 3 GEN | 3 GEN | yes |
| both calls open | 4 GEN | 4 GEN | yes |
| end of run | 4 GEN | 4 GEN | yes |

Final wallet balances: sponsor 17 GEN, cofunder 4 GEN, scout 1 GEN, bystander 1 GEN.

## Evidence packets

One packet per reading, stored on-chain with the sighting: the facts every validator agreed on (hashed), the hash of the
observer's profile text (where the wallet address is read), and for photo conditions each photo's sha256 with the answer.

| Reading | At (UTC) | Ruling | packet_sha256 | facts_sha256 | profile | photos |
|---|---|---|---|---|---|---|
| sighting_0 #1 | 2026-10-27T23:14:15 | ELIGIBLE | `9d206bfdd65353b12d671ec2d5e774b660afaeb4f13c6f4a73970cfe13930d7c` | `397b1cb36605eb05a5367821ca217f3de2e1648de4e834a1997490641dbcfd11` | `c8cb34f3a77cfd7a…` | `b3907fd637b9…` MEETS |
| sighting_0 #2 | 2026-10-27T23:16:05 | ELIGIBLE | `5257978bcb702f657bc91fd432bdd497b311bc506d3e68b4341a5aef4421e48e` | `397b1cb36605eb05a5367821ca217f3de2e1648de4e834a1997490641dbcfd11` | `c8cb34f3a77cfd7a…` | `b3907fd637b9…` MEETS |
| sighting_1 #1 | 2026-10-27T23:14:39 | INELIGIBLE | `299e75cb604cf6c52bfdda901860fecb4a7f5a524d88b96e9c66b56022a1dd8a` | `26c5413b0547864c2c3f0ddd9f528258f85a4558bf78d57dda7e9eef0f9a8cde` | `c8cb34f3a77cfd7a…` | `0b3839d141f3…` NOT_MEETS<br>`1cbe3fc034c3…` NOT_MEETS<br>`1defd1ef39ce…` NOT_MEETS |
| sighting_2 #1 | 2026-10-27T23:15:13 | INELIGIBLE | `47e02b00b0e81ef7915370f293b4b3bbfa1e2d69dd05c3e48384426c63e43494` | `70808cec6aea228579f5fcfc1396d6296361afe7a9191fc06b4d3ee09471d78c` | `e3b0c44298fc1c14…` | — |
| sighting_2 #2 | 2026-10-27T23:16:44 | INELIGIBLE | `0beb7422cc99d4531abbce4760ca219217f51088fbe5be0e4517ed7cf7c2ea45` | `70808cec6aea228579f5fcfc1396d6296361afe7a9191fc06b4d3ee09471d78c` | `e3b0c44298fc1c14…` | — |
| sighting_3 #1 | 2026-10-27T23:15:21 | INELIGIBLE | `228859b0e787f425c42f219b4eb6e438df5a2d251e3231e0ef59a813100105bc` | `21c6e499640a4f02819f9fbe55b360fa8ef53736b767adf6a5710510f6699465` | `567612bc9377439d…` | — |
| sighting_4 #1 | 2026-10-27T23:15:39 | INELIGIBLE | `631974281b88df0d7ab3822a7788461f29481d6959f5d546e5b0ba4d32fba8d5` | `1cfe7b0a84fcb9bf4d3d7be46305c20bcb729c96815939e4e07652030e66fe2b` | `e3b0c44298fc1c14…` | — |
| sighting_5 #1 | 2026-10-27T23:18:05 | ELIGIBLE | `04d178d791647126206dbf9254b6b7d371bcd5346c9d0cd4a9e0e7fe1e191ab2` | `fd10efedb3804aeef590a2f9931bcebdb0b17cdc789baa641116565906bc7c8d` | `c8cb34f3a77cfd7a…` | — |
| sighting_6 #1 | 2026-10-27T23:18:23 | ELIGIBLE | `10df058a647de3b54576a5f247490db1fd4d90c5aa7df859cbb6ad3502fc8c72` | `6da853fd525210e1ecade6728e3fa2fdf149e563957b438b279f211c34a0e2b1` | `c8cb34f3a77cfd7a…` | — |
| sighting_7 #1 | 2026-10-27T23:18:36 | INELIGIBLE | `c592cbf6a61e69c1facdea0d36cffeea3b8b661c3daac4b51333fd8115fdf4d2` | `d1988cfb5d22d10920b0f7fce3b8c36d4dd21ae129ddaf3a7444cc84036e5675` | `c8cb34f3a77cfd7a…` | — |

## Timelines

- **sighting_0**: 2026-10-27T23:14:15 submitted → ELIGIBLE · 2026-10-27T23:16:05 contested → ELIGIBLE by funder · 2026-10-27T23:30:34 held 0.5 GEN until 2027-01-25
- **sighting_1**: 2026-10-27T23:14:39 submitted → INELIGIBLE · 2026-10-27T23:16:57 settled → INELIGIBLE
- **sighting_2**: 2026-10-27T23:15:13 submitted → INELIGIBLE · 2026-10-27T23:16:44 contested → INELIGIBLE by submitter · 2026-10-27T23:30:41 settled → INELIGIBLE
- **sighting_3**: 2026-10-27T23:15:21 submitted → INELIGIBLE · 2026-10-27T23:30:47 settled → INELIGIBLE
- **sighting_4**: 2026-10-27T23:15:39 submitted → INELIGIBLE · 2026-10-27T23:30:54 settled → INELIGIBLE
- **sighting_5**: 2026-10-27T23:18:05 submitted → ELIGIBLE · 2026-10-27T23:18:49 held 0.25 GEN until 2027-01-25
- **sighting_6**: 2026-10-27T23:18:23 submitted → ELIGIBLE · 2026-10-27T23:31:06 held 0.25 GEN until 2027-01-25
- **sighting_7**: 2026-10-27T23:18:36 submitted → INELIGIBLE · 2026-10-27T23:31:17 settled → INELIGIBLE

## Wallet test from the live app

MetaMask test from the production app (fieldcall-bars26.vercel.app): the tester opens a call from the "Live hedgehogs, UK" preset (Erinaceus europaeus, United Kingdom, sightings 2026-08-01 to 2026-12-27, 0.5 GEN each, 2 per observer, research grade, accounts at least 30 days old, located to 100 m, photo condition "The photo shows a living hedgehog") and submits three real iNaturalist observations, each chosen to reach a different rule. None of the three observers has a wallet in their profile, so the qualifying reward is held for its observer. Wallet `0x4f80b5c475fced34fc9a07ffccf39e1adc1406bf`. Every transaction is FINALIZED with execution result SUCCESS.

| Step | GEN sent | Result | Tx |
|---|---|---|---|
| Open a call: Live hedgehogs, UK, funded with 2 GEN | 2 GEN | call_2 open; validators read taxon 43042 and place 6857 from iNaturalist | [`0x659c8132…`](https://explorer-studio.genlayer.com/tx/0x659c8132695b2e2fe9d24b91993c9f7a08430d95ed78f5aeb6aa1153f562000d) |
| Submit observation 403107732 (a hedgehog walking on a road, Marlow) |  | sighting_8 ELIGIBLE: validators looked at the photo, MEETS; 0.5 GEN reserved, held for jennwren (no wallet in profile) | [`0xd915ee5c…`](https://explorer-studio.genlayer.com/tx/0xd915ee5ce18d18a4a6be308336f7b9f9c109ddfea146b960c46e9c039b17a19b) |
| Submit observation 402415645 (a dead hedgehog in leaf litter, Clydebank) |  | sighting_9 INELIGIBLE (condition_not_met): validators looked at the photo, NOT_MEETS | [`0xcebcfe8d…`](https://explorer-studio.genlayer.com/tx/0xcebcfe8dfba46dc506b2bb06921b19b0ef6c054aa977644815916c4bd97deb83) |
| Submit observation 405948698 (a live hedgehog in a garden, Spalding) |  | sighting_10 INELIGIBLE (new_account): the observer's account was opened 2026-10-03, two days before the sighting; decided in code, no photo read | [`0x4e8ee9d7…`](https://explorer-studio.genlayer.com/tx/0x4e8ee9d7d9d7aa1952b527544e4cfe1314c30a097a1cd0d3edaea98cf5c34777) |

## Every transaction

| Who | Call | GEN | Status | Result | Returned / refused | Tx |
|---|---|---|---|---|---|---|
| sponsor | `create_call("Asian hornet nests, UK", "Vespa velutina", "6857", "2026-08-01", "2026-12-26", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 2 | ACCEPTED | SUCCESS | REFUNDED: taxon_id must be an iNaturalist taxon id, like 119019 | [`0x269225f2…`](https://explorer-studio.genlayer.com/tx/0x269225f267e458ca969ce62dd904b6fe44c52a86d75298f09142226eab9e6248) |
| sponsor | `create_call("Asian hornet nests, UK", "999999999", "6857", "2026-08-01", "2026-12-26", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 2 | ACCEPTED | SUCCESS | REFUNDED: iNaturalist has no taxon with that id | [`0xa97f34f9…`](https://explorer-studio.genlayer.com/tx/0xa97f34f9cafa42b34aaed953749f914e1d1260b5e3052837b2b3131f7bcbfb7b) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "999999999", "2026-08-01", "2026-12-26", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 2 | ACCEPTED | SUCCESS | REFUNDED: iNaturalist has no place with that id | [`0x447351fd…`](https://explorer-studio.genlayer.com/tx/0x447351fd442d29df32fb5df7af75862a764144fcc676e459e9e9d94016878375) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-08-01", "2026-09-30", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 2 | ACCEPTED | SUCCESS | REFUNDED: ends must be on or after starts, and not in the past | [`0x61d172c5…`](https://explorer-studio.genlayer.com/tx/0x61d172c55e7397dd9c153013a51fa0bb6686dae685c01138269cfd3befaebfd7) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-08-01", "2026-12-26", 0.05 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 2 | ACCEPTED | SUCCESS | REFUNDED: reward must be at least 0.1 GEN | [`0xd09e32d8…`](https://explorer-studio.genlayer.com/tx/0xd09e32d806a363c1b4f1f8b3aeba563b54f9ee3ad25f15dd9f06350ad5a56bd5) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-08-01", "2026-12-26", 1 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 0.5 | ACCEPTED | SUCCESS | REFUNDED: fund the call with at least one reward | [`0xff8f9ce9…`](https://explorer-studio.genlayer.com/tx/0xff8f9ce9224e259da9e6db50c1b83e6adbe4f0e9206d8e352dd91411a0dc3fb9) |
| sponsor | `create_call("Asian hornet nests, UK", "119019", "6857", "2026-08-01", "2026-12-26", 0.5 GEN, 2, true, 30, 100, "The photo shows a hornet nest")` | 2 | ACCEPTED | SUCCESS | call_0 | [`0xc99fd64a…`](https://explorer-studio.genlayer.com/tx/0xc99fd64aedfd4705a09e99432e6e07338b0762659bbf8aab039e76a7d7b71e94) |
| cofunder | `fund("call_0")` | 1 | ACCEPTED | SUCCESS | funded | [`0x12648d2e…`](https://explorer-studio.genlayer.com/tx/0x12648d2e90d07952a97d818692bcf6b92ce592b2a444c363dc0ef74e215a5673) |
| scout | `submit("call_0", "397236824")` | 0 | ACCEPTED | SUCCESS | sighting_0 | [`0x8b107f21…`](https://explorer-studio.genlayer.com/tx/0x8b107f21801046da282f902bbfea35f31231cc322450ce39dd5bcd408664395a) |
| scout | `submit("call_0", "397236834")` | 0 | ACCEPTED | SUCCESS | sighting_1 | [`0x3e4f5936…`](https://explorer-studio.genlayer.com/tx/0x3e4f593639cff4ab1a34c79aab64553ce84aa4ea9181ff2c2ebe004c3998e252) |
| scout | `submit("call_0", "411158753")` | 0 | ACCEPTED | SUCCESS | sighting_2 | [`0xb94f149e…`](https://explorer-studio.genlayer.com/tx/0xb94f149e6d756b3014566667e3d11446c8aace4444b322b000c4c6c61eb847c6) |
| scout | `submit("call_0", "411204951")` | 0 | ACCEPTED | SUCCESS | sighting_3 | [`0xa755828c…`](https://explorer-studio.genlayer.com/tx/0xa755828cb0b1182619acf73135b776f43d7b781ddf9bad61a2c8763f9637e701) |
| scout | `submit("call_0", "182971213")` | 0 | ACCEPTED | SUCCESS | sighting_4 | [`0x21d34a86…`](https://explorer-studio.genlayer.com/tx/0x21d34a86e8c402a74030686fe2389be2db6df54b8d77fb4694197a8ea588b063) |
| scout | `submit("call_0", "397236824")` | 0 | ACCEPTED | ERROR | sighting_0 for this observation is still open | [`0x48d42338…`](https://explorer-studio.genlayer.com/tx/0x48d42338abeaa833ad555445ff9621c810c306b9167e09ac9bf11f0ae25d2abe) |
| scout | `settle("sighting_0")` | 0 | ACCEPTED | ERROR | The response window is still open; only a funder can pay early | [`0x36a43339…`](https://explorer-studio.genlayer.com/tx/0x36a43339bc811bad8eb89b49c263aa0b7efa3ee09cce0b6e5eac124e94c99be1) |
| cofunder | `contest("sighting_0")` | 0 | ACCEPTED | SUCCESS | ELIGIBLE | [`0x262005a8…`](https://explorer-studio.genlayer.com/tx/0x262005a835c4c26a661de7e1c2537db1cf9c1919b271811fdb845a9b8f34d909) |
| scout | `contest("sighting_2")` | 0 | ACCEPTED | SUCCESS | INELIGIBLE | [`0x98662c70…`](https://explorer-studio.genlayer.com/tx/0x98662c70dd6a6716224871196968d37af3e4aff3ee7e27131c758b844d895a11) |
| scout | `settle("sighting_1")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0x65fb16b6…`](https://explorer-studio.genlayer.com/tx/0x65fb16b6f45a9c28cf7492d74fe9108a9f93f519e1135471e876ac2b9b221fee) |
| sponsor | `create_call("Asian hornet sightings, UK", "119019", "6857", "2026-08-01", "2026-12-26", 0.25 GEN, 2, true, 30, 100, "")` | 1 | ACCEPTED | SUCCESS | call_1 | [`0x95350a68…`](https://explorer-studio.genlayer.com/tx/0x95350a681e701b3e4424065ae09ae4513a257ac3f02ff2a1788d3ccec9274b74) |
| scout | `submit("call_1", "397236834")` | 0 | ACCEPTED | SUCCESS | sighting_5 | [`0x6c6a990d…`](https://explorer-studio.genlayer.com/tx/0x6c6a990d80084a17cd8300fb744962900a60f0f8200b4faa77adf04627281cb3) |
| scout | `submit("call_1", "397236811")` | 0 | ACCEPTED | SUCCESS | sighting_6 | [`0x9f409ae8…`](https://explorer-studio.genlayer.com/tx/0x9f409ae83779185eb36ccbbdc03a4977f8b6d5c915fff688cacd983d72104b23) |
| scout | `submit("call_1", "392140551")` | 0 | ACCEPTED | SUCCESS | sighting_7 | [`0x7677eb3a…`](https://explorer-studio.genlayer.com/tx/0x7677eb3a4f8313682321112d54486eaa7cd3971f51000014c74528d1185544b9) |
| sponsor | `settle("sighting_5")` | 0 | ACCEPTED | SUCCESS | awaiting_wallet | [`0xe8cc1fbf…`](https://explorer-studio.genlayer.com/tx/0xe8cc1fbf905cdcf10f6c87fa440908738aa7b6ca85c7ed67d55e04bccdfb9945) |
| bystander | `collect("sighting_5")` | 0 | ACCEPTED | ERROR | simoncolenutt has not added a wallet address to their iNaturalist profile yet | [`0xe2651150…`](https://explorer-studio.genlayer.com/tx/0xe265115063bcea29647e2607b78fe420854cb9539908a04a6548cd6d6761aa26) |
| bystander | `close("call_1")` | 0 | ACCEPTED | ERROR | Sightings can be submitted and rewards collected until 2027-01-25 | [`0xda218708…`](https://explorer-studio.genlayer.com/tx/0xda218708f3daef2d0b4c436ab700da1e4d773eabf87c9177753bb039753b7e6f) |
| bystander | `settle("sighting_0")` | 0 | ACCEPTED | SUCCESS | awaiting_wallet | [`0x4953a957…`](https://explorer-studio.genlayer.com/tx/0x4953a9575e5e72cafaf751f31d160807b26b4a707a90c8060d01e52b1eebcbc0) |
| bystander | `settle("sighting_2")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0xef7cff7e…`](https://explorer-studio.genlayer.com/tx/0xef7cff7ef99967794a34f3a9af9198f1137f8b2e986159efd16088c41890cfb0) |
| bystander | `settle("sighting_3")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0xab2ffad5…`](https://explorer-studio.genlayer.com/tx/0xab2ffad58674a7d341920c5414a0e0249dd52b589086419082d7b037a393b749) |
| bystander | `settle("sighting_4")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0x72cc50bb…`](https://explorer-studio.genlayer.com/tx/0x72cc50bb08060f964c9b158c52a4a1f8d4352fcbdfe4f5020bc3fb7e61f2e77e) |
| bystander | `settle("sighting_6")` | 0 | ACCEPTED | SUCCESS | awaiting_wallet | [`0x3f7821da…`](https://explorer-studio.genlayer.com/tx/0x3f7821dafd99c288316870152580ea3b1da9ae92a5bf7f9c8f86e290c76a52af) |
| bystander | `settle("sighting_7")` | 0 | ACCEPTED | SUCCESS | nothing_paid | [`0xc38a679a…`](https://explorer-studio.genlayer.com/tx/0xc38a679abd3c21c9fa3e60fb5a34e1f3cc705cb18285e7f614b03c4d66fed93e) |
| scout | `submit("call_0", "397236824")` | 0 | ACCEPTED | ERROR | This observation has already earned its reward (sighting_0) | [`0xf4122f41…`](https://explorer-studio.genlayer.com/tx/0xf4122f41f6c1c2e860213594a8db087fdd7287036072e4af5fba3a638731dec4) |

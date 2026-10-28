"""Direct-mode tests for the FieldCall contract."""

import hashlib
import json
import re
from datetime import datetime, timedelta, timezone

import pytest

from tests.direct.conftest import to_hex

CONTRACT_PATH = "contracts/field_call.py"
GEN = 10**18
INAT = "https://api.inaturalist.org"
HORNET, UK = "119019", "6857"
OBS, OBS2, OBS3 = "397236834", "397236824", "397236811"
OBSERVER = 4831496
PHOTO = "https://inaturalist-open-data.s3.amazonaws.com/photos/728548649/medium.jpg"
PHOTO_BYTES = b"\xff\xd8\xff\xe0 fake jpeg of a hornet nest"
NEST = "The photo shows a nest"


def _sha(data):
    return hashlib.sha256(data if isinstance(data, bytes) else data.encode()).hexdigest()


def _days_from_now(n):
    return (datetime.now(timezone.utc) + timedelta(days=n)).strftime("%Y-%m-%d")


def _mock(direct_vm, url, body, status=200, raw=None, content_type=b"application/json"):
    payload = raw if raw is not None else json.dumps(body).encode()
    direct_vm.mock_web("^" + re.escape(url) + "$", {"method": "GET", "response": {
        "status": status, "headers": {"Content-Type": content_type}, "body": payload}})


def _observation(obs_id=OBS, taxon_id=119019, ancestors=(1, 47158, 52747, 84738, 54328), quality="research", captive=False,
                 observed_on="2026-08-20", place_ids=(6857, 6858, 97391), accuracy=2, geoprivacy=None, photos=1,
                 user_id=OBSERVER, login="simoncolenutt", since="2021-08-06T17:02:09+00:00", annotations=((22, 35),)):
    return {"total_results": 1, "results": [{
        "id": int(obs_id), "quality_grade": quality, "captive": captive, "observed_on": observed_on,
        "place_guess": "Spring Place, Romsey, UK", "place_ids": list(place_ids), "positional_accuracy": accuracy,
        "geoprivacy": geoprivacy, "description": None,
        "taxon": {"id": taxon_id, "name": "Vespa velutina" if taxon_id == 119019 else "Vespa crabro",
                  "preferred_common_name": "Yellow-legged Hornet" if taxon_id == 119019 else "European Hornet",
                  "ancestor_ids": list(ancestors) + [taxon_id]},
        "user": {"id": user_id, "login": login, "created_at": since},
        "photos": [{"id": 728548649 + i, "url": PHOTO.replace("medium", "square").replace("728548649", str(728548649 + i))}
                   for i in range(photos)],
        "annotations": [{"controlled_attribute_id": a, "controlled_value_id": v} for a, v in annotations],
        "outlinks": [{"source": "GBIF", "url": "http://www.gbif.org/occurrence/6519064393"}],
    }]}


def _setup(direct_vm, obs=None, obs_id=OBS, obs_status=200, bio="", profile_status=200, answer="MEETS", photo_status=200,
           taxon_status=200, place_status=200, since="2021-08-06T17:02:09+00:00", user_id=OBSERVER, extra=()):
    direct_vm.clear_mocks()
    _mock(direct_vm, f"{INAT}/v1/taxa/{HORNET}", {"results": [{"id": 119019, "name": "Vespa velutina", "rank": "species",
          "preferred_common_name": "Yellow-legged Hornet", "iconic_taxon_name": "Insecta"}]} if taxon_status == 200 else {}, taxon_status)
    _mock(direct_vm, f"{INAT}/v1/places/{UK}", {"results": [{"id": 6857, "name": "United Kingdom",
          "display_name": "United Kingdom"}]} if place_status == 200 else {}, place_status)
    observations = [(obs_id, obs if obs is not None else _observation(obs_id), obs_status)] + list(extra)
    for oid, body, status in observations:
        _mock(direct_vm, f"{INAT}/v1/observations/{oid}", body, status)
    _mock(direct_vm, f"{INAT}/v2/users/{user_id}?fields=description,login,created_at",
          {"results": [{"id": user_id, "login": "simoncolenutt", "created_at": since, "description": bio}]}, profile_status)
    for i in range(3):
        _mock(direct_vm, PHOTO.replace("728548649", str(728548649 + i)), None, photo_status, raw=PHOTO_BYTES,
              content_type=b"image/jpeg")
    direct_vm.mock_llm(r".*", json.dumps({"answer": answer}))


def _call(direct_vm, direct_deploy, sponsor, fund=2 * GEN, setup=None, **terms):
    direct_vm.sender = sponsor
    contract = direct_deploy(CONTRACT_PATH)
    _setup(direct_vm, **(setup or {}))
    args = dict(title="Asian hornet sightings, UK", taxon_id=HORNET, place_id=UK, starts="2026-08-01", ends=_days_from_now(60),
                reward=GEN // 2, per_observer=2, research_only=True, min_account_days=30, max_accuracy_m=100, condition="")
    args.update(terms)
    direct_vm.value = fund
    result = contract.create_call(*args.values())
    direct_vm.value = 0
    return contract, result


def _submit(direct_vm, contract, who, obs_id=OBS, call_id="call_0", **setup):
    _setup(direct_vm, obs_id=obs_id, **setup)
    direct_vm.sender = who
    return contract.submit(call_id, obs_id)


def _expire(contract, sighting_id):
    contract.sightings[sighting_id].window_from = "2000-01-01T00:00:00"


def _bio(addr):
    return f"Hampshire naturalist. FieldCall rewards: {to_hex(addr)}"


# --- calls -------------------------------------------------------------------


def test_call_freezes_taxon_place_and_terms(direct_vm, direct_deploy, direct_alice):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice, condition=NEST)
    assert call_id == "call_0"
    c = contract.get_call(call_id)
    assert json.loads(c.taxon_json) == {"name": "Vespa velutina", "common": "Yellow-legged Hornet", "rank": "species", "group": "Insecta"}
    assert (c.place_name, c.starts, c.condition, int(c.reward), int(c.per_observer)) == ("United Kingdom", "2026-08-01", NEST, GEN // 2, 2)
    assert c.collect_until == (datetime.fromisoformat(c.ends) + timedelta(days=30)).strftime("%Y-%m-%d")
    assert json.loads(contract.pot(call_id)) == {"pot": str(2 * GEN), "reserved": "0", "paid": "0", "funded": str(2 * GEN),
                                                 "returnable": "0", "returned": "0", "funders": 1, "refunded": 0,
                                                 "rewards_left": 4, "state": "open", "collect_until": c.collect_until}
    assert json.loads(contract.totals()) == {"expected_balance": str(2 * GEN)}


@pytest.mark.parametrize("terms, setup, fund, reason", [
    (dict(title="ab"), None, 2 * GEN, "title must be 3 to 80 characters"),
    (dict(taxon_id="Vespa velutina"), None, 2 * GEN, "taxon_id must be an iNaturalist taxon id"),
    (dict(place_id="UK"), None, 2 * GEN, "place_id must be an iNaturalist place id"),
    (dict(starts="August"), None, 2 * GEN, "starts and ends must be real calendar dates written YYYY-MM-DD"),
    (dict(ends="2026-07-01"), None, 2 * GEN, "ends must be on or after starts, and not in the past"),
    (dict(starts="2025-01-01", ends=_days_from_now(1)), None, 2 * GEN, "a call covers at most 366 days"),
    (dict(reward=GEN // 20), None, 2 * GEN, "reward must be at least 0.1 GEN"),
    (dict(per_observer=0), None, 2 * GEN, "per_observer must be a whole number from 1 to 50"),
    (dict(min_account_days=-1), None, 2 * GEN, "min_account_days must be a whole number"),
    (dict(max_accuracy_m=200000), None, 2 * GEN, "max_accuracy_m must be a whole number from 0 to 100000"),
    (dict(condition="x" * 201), None, 2 * GEN, "condition must be at most 200 characters"),
    ({}, None, GEN // 4, "fund the call with at least one reward"),
    ({}, dict(taxon_status=404), 2 * GEN, "iNaturalist has no taxon with that id"),
    ({}, dict(place_status=404), 2 * GEN, "iNaturalist has no place with that id"),
    ({}, dict(taxon_status=503), 2 * GEN, "Could not read iNaturalist right now"),
])
def test_invalid_calls_are_refunded(direct_vm, direct_deploy, direct_alice, terms, setup, fund, reason):
    contract, result = _call(direct_vm, direct_deploy, direct_alice, fund=fund, setup=setup, **terms)
    assert result.startswith("REFUNDED: ") and reason in result
    assert int(contract.call_count) == 0
    assert json.loads(contract.totals()) == {"expected_balance": "0"}


def test_anyone_funds_a_call_and_funding_stops_at_the_end(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender, direct_vm.value = direct_bob, GEN
    assert contract.fund(call_id) == "funded"
    direct_vm.value = 0
    assert direct_vm.value == 0 and contract.fund(call_id).startswith("REFUNDED: Send at least 0.1 GEN")
    direct_vm.value = GEN // 20
    assert contract.fund(call_id) == "REFUNDED: Send at least 0.1 GEN to fund the call"  # no dust funders
    direct_vm.sender, direct_vm.value = direct_alice, GEN // 2
    assert contract.fund(call_id) == "funded"  # a second top-up adds to the same funder
    c = contract.get_call(call_id)
    assert json.loads(contract.get_funders(call_id, 0, 200)) == [
        {"address": to_hex(direct_alice), "amount": str(5 * GEN // 2), "refunded": False},
        {"address": to_hex(direct_bob), "amount": str(GEN), "refunded": False}]
    assert json.loads(contract.funding_of(to_hex(direct_bob))) == {call_id: {"amount": str(GEN), "refunded": False}}
    assert (int(c.pot), int(c.funded_total), int(c.n_funders)) == (7 * GEN // 2, 7 * GEN // 2, 2)
    contract.calls[call_id].ends = "2020-01-01"
    direct_vm.value = GEN
    assert contract.fund(call_id) == "REFUNDED: This call no longer takes funding"
    assert contract.fund("call_9") == "REFUNDED: No call with id call_9"


# --- sightings ---------------------------------------------------------------


def test_eligible_sighting_reserves_the_reward_for_the_profile_wallet(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice)
    sid = _submit(direct_vm, contract, direct_bob, bio=_bio(direct_charlie))
    s = contract.get_sighting(sid)
    assert (s.ruling, s.code, s.observer_login, s.payee.as_hex, int(s.reward)) == ("ELIGIBLE", "eligible", "simoncolenutt",
                                                                                 to_hex(direct_charlie), GEN // 2)
    assert "is Vespa velutina (research grade), seen on 2026-08-20 at Spring Place, Romsey, UK, inside United Kingdom" in s.why
    assert f"The reward goes to {to_hex(direct_charlie)}" in s.why
    facts = json.loads(s.facts_json)
    assert facts["annotations"] == ["Evidence of Presence: Construction"]
    assert facts["gbif"] == "http://www.gbif.org/occurrence/6519064393"
    pot = json.loads(contract.pot(call_id))
    assert (pot["pot"], pot["reserved"], pot["rewards_left"]) == (str(3 * GEN // 2), str(GEN // 2), 3)
    assert json.loads(contract.totals())["expected_balance"] == str(2 * GEN)
    assert contract.sighting_for(call_id, OBS) == sid


@pytest.mark.parametrize("obs, setup, code, text", [
    (_observation(taxon_id=54327, ancestors=(1, 47158, 52747, 84738, 54328)), {}, "wrong_taxon",
     "is identified as Vespa crabro, which is not Vespa velutina"),
    (_observation(quality="needs_id"), {}, "not_research_grade", "is needs_id"),
    (_observation(captive=True), {}, "captive", "captive or cultivated"),
    (_observation(observed_on="2026-07-31"), {}, "outside_dates", "made on 2026-07-31, outside the call's dates"),
    (_observation(observed_on=""), {}, "outside_dates", "unknown date"),
    (_observation(place_ids=(6753, 97164)), {}, "outside_place", "is not inside United Kingdom"),
    (_observation(geoprivacy="private"), {}, "location_private", "hides its location"),
    (_observation(accuracy=781), {}, "imprecise", "within 781 metres; the call asks for 100 metres or better"),
    (_observation(accuracy=None), {}, "imprecise", "unrecorded"),
    (_observation(photos=0), {}, "no_photo", "has no photo"),
    (_observation(), dict(since="2026-08-01T00:00:00+00:00"), "new_account", "opened on 2026-08-01, less than 30 days"),
    ({"total_results": 0, "results": []}, {}, "not_found", "iNaturalist has no observation"),
])
def test_ineligible_sightings_reserve_nothing(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, obs, setup, code, text):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice)
    sid = _submit(direct_vm, contract, direct_bob, obs=obs, bio=_bio(direct_charlie), **setup)
    s = contract.get_sighting(sid)
    assert (s.ruling, s.code, int(s.reward)) == ("INELIGIBLE", code, 0)
    assert text in s.why
    assert json.loads(contract.pot(call_id))["reserved"] == "0"


def test_genus_level_call_accepts_any_species_below_it(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice)
    contract.calls[call_id].taxon_id = "54328"  # Vespa (genus): a European hornet counts too
    sid = _submit(direct_vm, contract, direct_bob, obs=_observation(taxon_id=54327), bio=_bio(direct_charlie))
    assert contract.get_sighting(sid).ruling == "ELIGIBLE"


@pytest.mark.parametrize("obs_status, profile_status, photo_status", [(503, 200, 200), (200, 500, 200), (200, 200, 404)])
def test_outages_decide_nothing(direct_vm, direct_deploy, direct_alice, direct_bob, obs_status, profile_status, photo_status):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice, condition=NEST)
    sid = _submit(direct_vm, contract, direct_bob, obs_status=obs_status, profile_status=profile_status, photo_status=photo_status)
    s = contract.get_sighting(sid)
    assert (s.ruling, s.code, int(s.reward)) == ("UNCLEAR", "unreachable", 0)
    _expire(contract, sid)
    assert contract.settle(sid) == "nothing_paid"
    sid2 = _submit(direct_vm, contract, direct_bob)  # an unclear reading can be submitted again
    assert contract.get_sighting(sid2).ruling == "ELIGIBLE"


def test_photo_condition_is_judged_by_looking_at_the_photos(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice, condition=NEST)
    sid = _submit(direct_vm, contract, direct_bob, obs=_observation(photos=4), bio=_bio(direct_charlie), answer="MEETS")
    s = contract.get_sighting(sid)
    assert (s.ruling, json.loads(s.facts_json)["photo_answer"]) == ("ELIGIBLE", "MEETS")
    assert "Validators looked at the photos and they show what the call asks for: The photo shows a nest." in s.why
    photos = json.loads(s.evidence_json)[0]["photos"]
    assert photos == [{"url": PHOTO, "sha256": _sha(PHOTO_BYTES), "answer": "MEETS"}]  # the first photo that shows it decides
    sid2 = _submit(direct_vm, contract, direct_bob, obs_id=OBS2, obs=_observation(OBS2, photos=4), answer="NOT_MEETS")
    assert (contract.get_sighting(sid2).ruling, contract.get_sighting(sid2).code) == ("INELIGIBLE", "condition_not_met")
    looked = json.loads(contract.get_sighting(sid2).evidence_json)[0]["photos"]
    assert [p["answer"] for p in looked] == ["NOT_MEETS"] * 3  # at most three photos are looked at
    sid3 = _submit(direct_vm, contract, direct_bob, obs_id=OBS3, obs=_observation(OBS3), answer="UNCLEAR")
    assert (contract.get_sighting(sid3).ruling, contract.get_sighting(sid3).code) == ("UNCLEAR", "photo_unclear")


def test_calls_without_a_condition_never_ask_the_llm(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice)
    sid = _submit(direct_vm, contract, direct_bob, answer="NOT_A_WORD")  # would revert if the LLM were asked
    s = contract.get_sighting(sid)
    assert s.ruling == "ELIGIBLE" and "photo_answer" not in json.loads(s.facts_json)
    assert "photos" not in json.loads(s.evidence_json)[0]


def test_non_enum_photo_answer_reverts(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice, condition=NEST)
    with direct_vm.expect_revert("LLM answer must be one of"):
        _submit(direct_vm, contract, direct_bob, answer="PROBABLY")


def test_submissions_are_checked(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice, fund=GEN // 2)
    with direct_vm.expect_revert("observation_id must be an iNaturalist observation number"):
        _submit(direct_vm, contract, direct_bob, obs_id="abc", obs={})
    with direct_vm.expect_revert("No call with id call_7"):
        _submit(direct_vm, contract, direct_bob, call_id="call_7")
    sid = _submit(direct_vm, contract, direct_bob, bio=_bio(direct_charlie))
    with direct_vm.expect_revert(f"{sid} for this observation is still open"):
        _submit(direct_vm, contract, direct_bob)
    with direct_vm.expect_revert("This call's pot is empty"):
        _submit(direct_vm, contract, direct_bob, obs_id=OBS2, obs=_observation(OBS2))
    _expire(contract, sid)
    contract.settle(sid)
    with direct_vm.expect_revert(f"This observation has already earned its reward ({sid})"):
        _submit(direct_vm, contract, direct_bob)
    contract.calls[call_id].collect_until = "2020-01-01"
    with direct_vm.expect_revert("This call closed to sightings on 2020-01-01"):
        _submit(direct_vm, contract, direct_bob, obs_id=OBS3, obs=_observation(OBS3))


def test_per_observer_cap(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice, fund=3 * GEN)
    for oid in (OBS, OBS2):
        assert contract.get_sighting(_submit(direct_vm, contract, direct_bob, obs_id=oid, obs=_observation(oid),
                                             bio=_bio(direct_charlie))).ruling == "ELIGIBLE"
    sid = _submit(direct_vm, contract, direct_bob, obs_id=OBS3, obs=_observation(OBS3), bio=_bio(direct_charlie))
    s = contract.get_sighting(sid)
    assert (s.ruling, s.code, int(s.reward)) == ("INELIGIBLE", "observer_cap", 0)
    assert "simoncolenutt has already reached this call's limit of 2 paid sightings" in s.why
    assert int(contract.observer_counts[f"{call_id}|{OBSERVER}"]) == 2
    other = _observation("500", user_id=777, login="someone")
    sid4 = _submit(direct_vm, contract, direct_bob, obs_id="500", obs=other, user_id=777)
    assert contract.get_sighting(sid4).ruling == "ELIGIBLE"


def test_a_funder_cannot_be_paid_by_their_own_call(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice)
    sid = _submit(direct_vm, contract, direct_bob, bio=_bio(direct_alice))
    s = contract.get_sighting(sid)
    assert (s.ruling, s.code, s.payee.as_hex, int(s.reward)) == ("INELIGIBLE", "payee_is_funder", to_hex(bytes(20)), 0)


# --- settling, holding, collecting -------------------------------------------


def test_settle_pays_the_profile_wallet_once(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice)
    sid = _submit(direct_vm, contract, direct_bob, bio=_bio(direct_charlie))
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("only a funder can pay early"):
        contract.settle(sid)
    direct_vm.sender = direct_alice
    assert contract.settle(sid) == "paid"  # the sponsor pays at once
    s, c = contract.get_sighting(sid), contract.get_call(call_id)
    assert (s.state, s.outcome) == ("settled", "paid")
    assert (int(c.pot), int(c.reserved), int(c.paid_total), int(c.n_paid), int(c.n_eligible)) == (3 * GEN // 2, 0, GEN // 2, 1, 1)
    assert json.loads(contract.totals())["expected_balance"] == str(3 * GEN // 2)
    assert json.loads(s.timeline_json)[-1]["event"] == "paid"
    with direct_vm.expect_revert("already settled"):
        contract.settle(sid)


def test_reward_is_held_until_the_observer_links_a_wallet(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice)
    sid = _submit(direct_vm, contract, direct_bob, bio="Hampshire birder")
    s = contract.get_sighting(sid)
    assert s.ruling == "ELIGIBLE" and "has not put a wallet address in their iNaturalist profile yet" in s.why
    _expire(contract, sid)
    assert contract.settle(sid) == "awaiting_wallet"
    assert json.loads(contract.pot(call_id))["reserved"] == str(GEN // 2)
    _setup(direct_vm, bio="Hampshire birder")
    with direct_vm.expect_revert("simoncolenutt has not added a wallet address to their iNaturalist profile yet"):
        contract.collect(sid)
    _setup(direct_vm, bio=_bio(direct_alice))
    with direct_vm.expect_revert("The wallet in the profile funds this call"):
        contract.collect(sid)
    _setup(direct_vm, bio=_bio(direct_charlie))
    direct_vm.sender = direct_bob  # anyone can trigger it; the reward goes to the profile wallet
    assert contract.collect(sid) == "paid"
    s = contract.get_sighting(sid)
    assert (s.payee.as_hex, s.outcome) == (to_hex(direct_charlie), "paid")
    assert [e["event"] for e in json.loads(s.timeline_json)] == ["submitted", "held", "wallet_linked", "paid"]
    with direct_vm.expect_revert("Only a held reward can be collected"):
        contract.collect(sid)


def test_ineligible_settles_for_nothing_and_only_the_submitter_accepts_early(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice)
    sid = _submit(direct_vm, contract, direct_bob, obs=_observation(quality="needs_id"))
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("only the submitter can accept early"):
        contract.settle(sid)
    direct_vm.sender = direct_bob
    assert contract.settle(sid) == "nothing_paid"
    sid2 = _submit(direct_vm, contract, direct_bob)  # once research grade, it can come back
    assert contract.get_sighting(sid2).ruling == "ELIGIBLE"


def test_contests_reread_and_each_side_contests_once(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice)
    sid = _submit(direct_vm, contract, direct_bob, bio=_bio(direct_charlie))
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only a funder of this call can contest an eligible sighting"):
        contract.contest(sid)
    _setup(direct_vm, obs=_observation(quality="needs_id"), bio=_bio(direct_charlie))  # the community changed its mind
    direct_vm.sender = direct_alice
    assert contract.contest(sid) == "INELIGIBLE"
    assert json.loads(contract.pot(call_id))["reserved"] == "0"
    assert int(contract.observer_counts[f"{call_id}|{OBSERVER}"]) == 0
    _setup(direct_vm, bio=_bio(direct_charlie))
    direct_vm.sender = direct_charlie  # the observer's wallet answers back
    assert contract.contest(sid) == "ELIGIBLE"
    assert json.loads(contract.pot(call_id))["reserved"] == str(GEN // 2)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("The funders have already contested this sighting"):
        contract.contest(sid)
    s = contract.get_sighting(sid)
    assert [e["event"] for e in json.loads(s.timeline_json)] == ["submitted", "contested", "contested"]
    assert len(json.loads(s.evidence_json)) == 3
    _expire(contract, sid)
    with direct_vm.expect_revert("The response window has closed"):
        contract.contest(sid)


def test_contest_by_a_co_funder_and_a_reserved_reward_is_released_once(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender, direct_vm.value = direct_bob, GEN
    contract.fund(call_id)
    direct_vm.value = 0
    sid = _submit(direct_vm, contract, direct_charlie, bio=_bio(direct_charlie))
    _setup(direct_vm, obs=_observation(captive=True), bio=_bio(direct_charlie))
    direct_vm.sender = direct_bob
    assert contract.contest(sid) == "INELIGIBLE"
    pot = json.loads(contract.pot(call_id))
    assert (pot["pot"], pot["reserved"]) == (str(3 * GEN), "0")


# --- closing -----------------------------------------------------------------


def _payments(contract, monkeypatch):
    """Record every GEN transfer the contract makes (refunds, rewards, returns) instead of sending it."""
    import sys

    sent = []

    class Recorder:
        def __init__(self, to):
            self.to = to

        def emit_transfer(self, value):
            sent.append((self.to.as_hex, int(value)))

    monkeypatch.setattr(sys.modules[type(contract).__module__], "_Wallet", Recorder)
    return sent


def _wallet(n):
    return (0xF1E1D000 + n).to_bytes(20, "big")


def test_close_returns_the_pot_pro_rata_and_expires_held_rewards(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie,
                                                                monkeypatch):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice)
    sent = _payments(contract, monkeypatch)
    direct_vm.sender, direct_vm.value = direct_bob, GEN
    contract.fund(call_id)
    direct_vm.value = 0
    paid = _submit(direct_vm, contract, direct_charlie, bio=_bio(direct_charlie))
    _expire(contract, paid)
    contract.settle(paid)
    held = _submit(direct_vm, contract, direct_charlie, obs_id="500", obs=_observation("500", user_id=777), user_id=777)
    with direct_vm.expect_revert("Close the call first"):
        contract.refund(call_id, to_hex(direct_bob))
    with direct_vm.expect_revert("Sightings can be submitted and rewards collected until"):
        contract.close(call_id)
    contract.calls[call_id].collect_until = "2020-01-01"
    with direct_vm.expect_revert("Settle the open sightings first"):
        contract.close(call_id)
    _expire(contract, held)
    assert contract.settle(held) == "awaiting_wallet"
    with direct_vm.expect_revert("could be collected until 2020-01-01"):
        contract.collect(held)
    assert contract.close(call_id) == str(5 * GEN // 2)  # 3 GEN funded, 0.5 paid; the held 0.5 expires
    c = contract.get_call(call_id)
    assert (c.state, int(c.pot), int(c.reserved), int(c.returnable), int(c.returned_total)) == ("closed", 0, 0, 5 * GEN // 2, 0)
    assert json.loads(c.history_json)[-1]["event"] == "closed" and json.loads(c.history_json)[-1]["expired"] == str(GEN // 2)
    with direct_vm.expect_revert("held reward expired"):
        contract.collect(held)
    assert json.loads(contract.totals())["expected_balance"] == str(5 * GEN // 2)
    direct_vm.sender = direct_charlie  # anyone sends a funder their share, but only to that funder
    assert contract.refund(call_id, to_hex(direct_alice)) == str(5 * GEN // 2 * 2 // 3)
    with direct_vm.expect_revert("has already been returned"):
        contract.refund(call_id, to_hex(direct_alice))
    with direct_vm.expect_revert("did not fund call_0"):
        contract.refund(call_id, to_hex(direct_charlie))
    with direct_vm.expect_revert("funder must be a 0x address"):
        contract.refund(call_id, "alice")
    assert contract.refund(call_id, to_hex(direct_bob)) == str(5 * GEN // 2 - 5 * GEN // 2 * 2 // 3)  # last one: the remainder
    c = contract.get_call(call_id)
    assert (int(c.returned_total), int(c.n_refunded)) == (5 * GEN // 2, 2)
    assert json.loads(contract.totals())["expected_balance"] == "0"
    assert sent[-2:] == [(to_hex(direct_alice), 5 * GEN // 2 * 2 // 3), (to_hex(direct_bob), 5 * GEN // 2 - 5 * GEN // 2 * 2 // 3)]
    assert sum(a for _, a in sent) == 3 * GEN  # everything funded left the contract: 0.5 paid out, 2.5 returned
    with direct_vm.expect_revert("already closed"):
        contract.close(call_id)


@pytest.mark.parametrize("starts, ends", [("2026-02-31", None), ("2026-08-01", "2026-13-01"), ("2026-08-01", "2027-02-29"),
                                          ("2026-00-10", None), ("2026-08-01", "2026-11-31")])
def test_impossible_calendar_dates_are_refunded_not_crashed(direct_vm, direct_deploy, direct_alice, monkeypatch, starts, ends):
    direct_vm.sender = direct_alice
    contract = direct_deploy(CONTRACT_PATH)
    sent = _payments(contract, monkeypatch)
    _setup(direct_vm)
    direct_vm.value = 2 * GEN
    result = contract.create_call("Asian hornet sightings, UK", HORNET, UK, starts, ends or _days_from_now(60), GEN // 2,
                                  2, True, 30, 100, "")
    direct_vm.value = 0
    assert result == "REFUNDED: starts and ends must be real calendar dates written YYYY-MM-DD"
    assert sent == [(to_hex(direct_alice), 2 * GEN)]  # the caller's GEN came back in full
    assert int(contract.call_count) == 0 and json.loads(contract.totals()) == {"expected_balance": "0"}


def test_an_observation_can_be_submitted_to_a_call_at_most_three_times(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice)
    for n in range(3):
        sid = _submit(direct_vm, contract, direct_bob, obs=_observation(captive=True))
        assert contract.get_sighting(sid).code == "captive"
        _expire(contract, sid)
        contract.settle(sid)
    _setup(direct_vm, obs=_observation(captive=True))
    with direct_vm.expect_revert("has been submitted to this call 3 times"):
        contract.submit(call_id, OBS)
    assert int(contract.get_call(call_id).n_sightings) == 3


def test_stress_hundreds_of_funders_and_refused_sightings_still_close_and_repay_everyone(
        direct_vm, direct_deploy, direct_alice, direct_bob, monkeypatch):
    """An attacker pads a call with 300 minimum top-ups from 300 wallets and 120 refused submissions (40 observations,
    each resubmitted to the cap). Closing still does a fixed amount of work, every funder is repaid by their own
    refund, and every wei the call received leaves the contract."""
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice, fund=2 * GEN)
    sent = _payments(contract, monkeypatch)
    funders = [_wallet(i) for i in range(300)]
    for i, who in enumerate(funders):
        direct_vm.sender, direct_vm.value = who, GEN // 10 + i  # uneven amounts, so shares do not divide evenly
        assert contract.fund(call_id) == "funded"
    direct_vm.value = 0
    funded = 2 * GEN + sum(GEN // 10 + i for i in range(300))
    refused = 0
    for o in range(40):
        oid = str(900000 + o)
        for _ in range(3):
            sid = _submit(direct_vm, contract, direct_bob, obs_id=oid, obs=_observation(oid, captive=True))
            _expire(contract, sid)
            contract.settle(sid)
            refused += 1
        _setup(direct_vm, obs_id=oid, obs=_observation(oid, captive=True))
        with direct_vm.expect_revert("submitted to this call 3 times"):
            contract.submit(call_id, oid)
    c = contract.get_call(call_id)
    assert (int(c.n_funders), int(c.n_sightings), int(c.funded_total)) == (301, refused, funded)
    assert len(contract.get_call(call_id).history_json) < 4000  # the call record itself does not grow with use

    contract.calls[call_id].collect_until = "2020-01-01"
    reads = {"n": 0}
    real = type(contract.sightings).__getitem__
    per_item = lambda k: str(k).startswith("sighting_") or "|" in str(k)  # sightings, funders, observer counts
    monkeypatch.setattr(type(contract.sightings), "__getitem__",
                        lambda m, k: (reads.__setitem__("n", reads["n"] + per_item(k)), real(m, k))[1])
    direct_vm.sender = direct_bob
    assert contract.close(call_id) == str(funded)
    assert reads["n"] == 0  # closing touched no sighting and no funder: its cost does not depend on either
    monkeypatch.setattr(type(contract.sightings), "__getitem__", real)

    rows = []
    for offset in (0, 200):
        rows += json.loads(contract.get_funders(call_id, offset, 200))
    assert len(rows) == 301 and rows[0]["address"] == to_hex(direct_alice)
    for row in rows:  # one bounded transaction per funder, sent by anyone, in any order
        assert int(contract.refund(call_id, row["address"])) > 0
    c = contract.get_call(call_id)
    assert (int(c.n_refunded), int(c.returned_total)) == (301, funded)
    assert sum(a for _, a in sent) == funded and len(sent) == 301
    for row, (to, amount) in zip(rows, sent):
        assert to == row["address"] and abs(amount - funded * int(row["amount"]) // funded) <= 301
    assert json.loads(contract.totals()) == {"expected_balance": "0"}
    assert all(r["refunded"] for r in json.loads(contract.get_funders(call_id, 0, 200)))


# --- evidence and registry ---------------------------------------------------


def test_every_reading_keeps_an_evidence_packet(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice, condition=NEST)
    sid = _submit(direct_vm, contract, direct_bob, bio=_bio(direct_charlie))
    s = contract.get_sighting(sid)
    packet = json.loads(s.evidence_json)[0]
    assert packet["observation"] == f"https://www.inaturalist.org/observations/{OBS}"
    assert packet["source"] == f"{INAT}/v1/observations/{OBS}"
    assert packet["profile"] == "https://www.inaturalist.org/people/simoncolenutt"
    assert packet["profile_bio_sha256"] == _sha(_bio(direct_charlie))
    facts = json.loads(s.facts_json)
    assert packet["facts_sha256"] == _sha(json.dumps({k: v for k, v in facts.items()}, sort_keys=True))
    body = {k: v for k, v in packet.items() if k != "packet_sha256"}
    assert packet["packet_sha256"] == _sha(json.dumps(body, sort_keys=True))
    assert json.loads(s.timeline_json)[0]["evidence"] == packet["packet_sha256"]


def test_registry_reads_in_one_call(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, call_id = _call(direct_vm, direct_deploy, direct_alice)
    _submit(direct_vm, contract, direct_bob, bio=_bio(direct_charlie))
    _submit(direct_vm, contract, direct_bob, obs_id=OBS2, obs=_observation(OBS2, captive=True))
    assert [c.id for c in contract.get_calls(0, 200)] == ["call_0"]
    assert [s.id for s in contract.get_sightings(0, 200)] == ["sighting_0", "sighting_1"]
    assert [s.id for s in contract.get_sightings(1, 5)] == ["sighting_1"]
    assert contract.explain_sighting("sighting_1").startswith("INELIGIBLE: Observation 397236824 is marked captive")
    assert contract.response_window_seconds() == 600
    assert contract.sighting_for(call_id, "999") == ""

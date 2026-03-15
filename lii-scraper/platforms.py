# lii-scraper/platforms.py
# All 16 LII platforms with jurisdiction detection.
# Peachjam platforms (14) use the REST JSON API.
# SAFLII (CGI) and OHADA (Joomla) use BeautifulSoup HTML scraping.

from urllib.parse import quote_plus


def _africanlii_url(q, jur=None, doc_type=None):
    params = f"q={quote_plus(q)}"
    if jur:
        params += f"&jurisdiction={jur}"
    if doc_type:
        params += f"&doc_type={doc_type}"
    return f"https://africanlii.org/en/search/?{params}"


PLATFORMS = [
    # ── 1. AfricanLII – Pan-African (Peachjam) ─────────────────────────────
    {
        "id": "africanlii",
        "name": "AfricanLII",
        "base_url": "https://africanlii.org",
        "type": "peachjam",
        "country_codes": ["*"],
        "country_names": ["africa", "pan-african", "african union", "au"],
        "africanlii_jurisdiction": None,
        "search_url": lambda q: _africanlii_url(q),
        "legislation_url": lambda q: _africanlii_url(q, doc_type="act"),
        "selectors": None,
    },
    # ── 2. SAFLII – South Africa / Lesotho / Eswatini (CGI) ────────────────
    {
        "id": "saflii",
        "name": "SAFLII",
        "base_url": "https://www.saflii.org",
        "type": "cgi",
        "country_codes": ["ZA", "LS", "SZ"],
        "country_names": ["south africa", "south african", "sa", "lesotho",
                          "basotho", "eswatini", "swaziland", "swazi"],
        "africanlii_jurisdiction": "za",
        "search_url": lambda q: (
            f"https://www.saflii.org/cgi-bin/sinosrch.cgi"
            f"?method=boolean&query={quote_plus(q)}&meta=/za&results=20&format=rm"
        ),
        "legislation_url": lambda q: (
            f"https://www.saflii.org/cgi-bin/sinosrch.cgi"
            f"?method=boolean&query={quote_plus(q + ' legislation act')}&meta=/za&results=20&format=rm"
        ),
        "selectors": {
            "container": "dl, li",
            "title_tag": "dt a, a",
            "snippet_tag": "dd",
            "domain_filter": "saflii.org",
        },
    },
    # ── 3. Kenya Law (Peachjam) ─────────────────────────────────────────────
    {
        "id": "kenyalaw",
        "name": "Kenya Law",
        "base_url": "https://new.kenyalaw.org",
        "type": "peachjam",
        "country_codes": ["KE"],
        "country_names": ["kenya", "kenyan"],
        "africanlii_jurisdiction": "ke",
        "search_url": lambda q: f"https://new.kenyalaw.org/search/?q={quote_plus(q)}",
        "legislation_url": lambda q: f"https://new.kenyalaw.org/search/?q={quote_plus(q)}&doc_type=act",
        "selectors": None,
    },
    # ── 4. GhaLII – Ghana (Peachjam) ────────────────────────────────────────
    {
        "id": "ghalii",
        "name": "GhaLII",
        "base_url": "https://ghalii.org",
        "type": "peachjam",
        "country_codes": ["GH"],
        "country_names": ["ghana", "ghanaian"],
        "africanlii_jurisdiction": "gh",
        "search_url": lambda q: f"https://ghalii.org/search/?q={quote_plus(q)}",
        "legislation_url": lambda q: f"https://ghalii.org/search/?q={quote_plus(q)}&doc_type=act",
        "selectors": None,
    },
    # ── 5. NigeriaLII (Peachjam) ────────────────────────────────────────────
    {
        "id": "nigerialii",
        "name": "NigeriaLII",
        "base_url": "https://nigerialii.org",
        "type": "peachjam",
        "country_codes": ["NG"],
        "country_names": ["nigeria", "nigerian"],
        "africanlii_jurisdiction": "ng",
        "search_url": lambda q: f"https://nigerialii.org/search/?q={quote_plus(q)}",
        "legislation_url": lambda q: f"https://nigerialii.org/search/?q={quote_plus(q)}&doc_type=act",
        "selectors": None,
    },
    # ── 6. ZimLII – Zimbabwe (Peachjam) ────────────────────────────────────
    {
        "id": "zimlii",
        "name": "ZimLII",
        "base_url": "https://zimlii.org",
        "type": "peachjam",
        "country_codes": ["ZW"],
        "country_names": ["zimbabwe", "zimbabwean", "zim"],
        "africanlii_jurisdiction": "zw",
        "search_url": lambda q: f"https://zimlii.org/search/?q={quote_plus(q)}",
        "legislation_url": lambda q: f"https://zimlii.org/search/?q={quote_plus(q)}&doc_type=act",
        "selectors": None,
    },
    # ── 7. ULII – Uganda (Peachjam) ────────────────────────────────────────
    {
        "id": "ulii",
        "name": "ULII",
        "base_url": "https://ulii.org",
        "type": "peachjam",
        "country_codes": ["UG"],
        "country_names": ["uganda", "ugandan"],
        "africanlii_jurisdiction": "ug",
        "search_url": lambda q: f"https://ulii.org/search/?q={quote_plus(q)}",
        "legislation_url": lambda q: f"https://ulii.org/search/?q={quote_plus(q)}&doc_type=act",
        "selectors": None,
    },
    # ── 8. TanzLII – Tanzania (Peachjam) ───────────────────────────────────
    {
        "id": "tanzlii",
        "name": "TanzLII",
        "base_url": "https://tanzlii.org",
        "type": "peachjam",
        "country_codes": ["TZ"],
        "country_names": ["tanzania", "tanzanian"],
        "africanlii_jurisdiction": "tz",
        "search_url": lambda q: f"https://tanzlii.org/search/?q={quote_plus(q)}",
        "legislation_url": lambda q: f"https://tanzlii.org/search/?q={quote_plus(q)}&doc_type=act",
        "selectors": None,
    },
    # ── 9. MalawiLII (Peachjam) ─────────────────────────────────────────────
    {
        "id": "malawilii",
        "name": "MalawiLII",
        "base_url": "https://malawilii.org",
        "type": "peachjam",
        "country_codes": ["MW"],
        "country_names": ["malawi", "malawian"],
        "africanlii_jurisdiction": "mw",
        "search_url": lambda q: f"https://malawilii.org/search/?q={quote_plus(q)}",
        "legislation_url": lambda q: f"https://malawilii.org/search/?q={quote_plus(q)}&doc_type=act",
        "selectors": None,
    },
    # ── 10. NamibiaLII (Peachjam) ───────────────────────────────────────────
    {
        "id": "namibialii",
        "name": "NamibiaLII",
        "base_url": "https://namibialii.org",
        "type": "peachjam",
        "country_codes": ["NA"],
        "country_names": ["namibia", "namibian"],
        "africanlii_jurisdiction": "na",
        "search_url": lambda q: f"https://namibialii.org/search/?q={quote_plus(q)}",
        "legislation_url": lambda q: f"https://namibialii.org/search/?q={quote_plus(q)}&doc_type=act",
        "selectors": None,
    },
    # ── 11. LesothoLII (Peachjam) ───────────────────────────────────────────
    {
        "id": "lesotholii",
        "name": "LesothoLII",
        "base_url": "https://lesotholii.org",
        "type": "peachjam",
        "country_codes": ["LS"],
        "country_names": ["lesotho"],
        "africanlii_jurisdiction": "ls",
        "search_url": lambda q: f"https://lesotholii.org/search/?q={quote_plus(q)}",
        "legislation_url": lambda q: f"https://lesotholii.org/search/?q={quote_plus(q)}&doc_type=act",
        "selectors": None,
    },
    # ── 12. SwaziLII – Eswatini (Peachjam) ─────────────────────────────────
    {
        "id": "swazilii",
        "name": "SwaziLII",
        "base_url": "https://swazilii.org",
        "type": "peachjam",
        "country_codes": ["SZ"],
        "country_names": ["eswatini", "swaziland", "swazi"],
        "africanlii_jurisdiction": "sz",
        "search_url": lambda q: f"https://swazilii.org/search/?q={quote_plus(q)}",
        "legislation_url": lambda q: f"https://swazilii.org/search/?q={quote_plus(q)}&doc_type=act",
        "selectors": None,
    },
    # ── 13. SeyLII – Seychelles (Peachjam) ─────────────────────────────────
    {
        "id": "seylii",
        "name": "SeyLII",
        "base_url": "https://seylii.org",
        "type": "peachjam",
        "country_codes": ["SC"],
        "country_names": ["seychelles", "seychellois"],
        "africanlii_jurisdiction": "sc",
        "search_url": lambda q: f"https://seylii.org/search/?q={quote_plus(q)}",
        "legislation_url": lambda q: f"https://seylii.org/search/?q={quote_plus(q)}&doc_type=act",
        "selectors": None,
    },
    # ── 14. MauritiusLII (Peachjam) ────────────────────────────────────────
    {
        "id": "mauritiuslii",
        "name": "MauritiusLII",
        "base_url": "https://mauritiuslii.org",
        "type": "peachjam",
        "country_codes": ["MU"],
        "country_names": ["mauritius", "mauritian"],
        "africanlii_jurisdiction": "mu",
        "search_url": lambda q: f"https://mauritiuslii.org/search/?q={quote_plus(q)}",
        "legislation_url": lambda q: f"https://mauritiuslii.org/search/?q={quote_plus(q)}&doc_type=act",
        "selectors": None,
    },
    # ── 15. EthiopiaLII (Peachjam) ──────────────────────────────────────────
    {
        "id": "ethiopialii",
        "name": "EthiopiaLII",
        "base_url": "https://ethiopialii.org",
        "type": "peachjam",
        "country_codes": ["ET"],
        "country_names": ["ethiopia", "ethiopian"],
        "africanlii_jurisdiction": "et",
        "search_url": lambda q: f"https://ethiopialii.org/search/?q={quote_plus(q)}",
        "legislation_url": lambda q: f"https://ethiopialii.org/search/?q={quote_plus(q)}&doc_type=act",
        "selectors": None,
    },
    # ── 16. OHADA / CCJA (Joomla) ───────────────────────────────────────────
    {
        "id": "ohada",
        "name": "OHADA / CCJA",
        "base_url": "https://www.ohadalex.org",
        "type": "joomla",
        "country_codes": [
            "BJ", "BF", "CM", "CF", "KM", "CG", "CI", "GA",
            "GN", "GW", "GQ", "ML", "NE", "SN", "TD", "TG", "CD",
        ],
        "country_names": [
            "ohada", "ccja", "francophone",
            "benin", "burkina faso", "cameroon", "cameroun",
            "central african republic", "comoros", "congo",
            "côte d'ivoire", "ivory coast", "gabon",
            "guinea", "guinea-bissau", "equatorial guinea",
            "mali", "niger", "senegal", "chad", "togo",
            "democratic republic of congo",
        ],
        "africanlii_jurisdiction": "sn",
        "search_url": lambda q: (
            f"https://www.ohadalex.org/index.php"
            f"?option=com_search&searchword={quote_plus(q)}&Itemid=3"
        ),
        "legislation_url": lambda q: (
            f"https://www.ohadalex.org/index.php"
            f"?option=com_search&searchword={quote_plus(q + ' acte uniforme loi')}&Itemid=3"
        ),
        "selectors": {
            "container": "dl, .search-result, .result",
            "title_tag": "dt a, h3 a, a",
            "snippet_tag": "dd, .search-description, p",
            "domain_filter": "ohadalex.org",
        },
    },
]

PLATFORM_MAP = {p["id"]: p for p in PLATFORMS}


def detect_platform(jurisdiction_hint: str) -> dict:
    """Return the best-matching LII platform for the given jurisdiction hint."""
    hint = jurisdiction_hint.lower().strip()

    # Match by country name first
    for p in PLATFORMS:
        if p["id"] == "africanlii":
            continue
        if any(hint in n or n in hint for n in p["country_names"]):
            return p

    # Match by ISO country code
    upper = hint.upper()
    for p in PLATFORMS:
        if upper in p["country_codes"]:
            return p

    # Default: pan-African fallback
    return PLATFORM_MAP["africanlii"]

/*
 * SourceCo law firm valuation model (prototype).
 * One file, shared by the browser calculator and the Node build (prerendered example).
 * Output is directional, not an appraisal or legal advice.
 * Every range here traces to a numbered source in SOURCES.
 */
(function (root) {
  'use strict';

  // ---------- Sources (single source of truth for every page) ----------
  // tag: THIRD-PARTY | PRIMARY | PRACTITIONER ESTIMATE | SOURCECO FIRST-PARTY
  var SOURCES = {
    clio_rot: { name: 'Clio, Law firm valuation rule of thumb, undated', url: 'https://www.clio.com/blog/law-firm-valuation-rule-of-thumb/', tag: 'PRACTITIONER ESTIMATE' },
    pela: { name: 'Private Equity Legal Alliance, PI firm investment guide, 2026', url: 'https://www.hklaw.com/-/media/files/insights/publications/2026/01/pelapersonalinjurylawfirmpeguide.pdf?rev=2cfb2a2c86f246ae9b3f410e7892860f&hash=203C8726ABF46B21DBDDF02CFAA02923', tag: 'PRACTITIONER ESTIMATE' },
    fairfax: { name: 'Fairfax Associates, 2025 year-end merger report, Jan 2026', url: 'https://fairfaxassociates.com/wp-content/uploads/2026/01/Fairfax-Associates-2025-Year-End-Mergers-PR.pdf', tag: 'THIRD-PARTY' },
    lek: { name: 'L.E.K. Consulting, How investors evaluate legal MSO opportunities, Feb 2026', url: 'https://www.lek.com/insights/business-services/how-investors-evaluate-legal-mso-opportunities', tag: 'THIRD-PARTY' },
    citizens: { name: 'Citizens, Law firms as an investor frontier, Aug 2025', url: 'https://content.citizenscommercial.com/pdf_1285/Citizens%20Law%20Firms-Private%20Equitys%20Next%20Frontier.pdf', tag: 'THIRD-PARTY' },
    sidley: { name: 'Sidley Austin, Outside investment in US law firms, Nov 2025', url: 'https://www.sidley.com/en/insights/newsupdates/2025/11/private-equity-investment-in-us-law-firms-current-models-and-recent-developments', tag: 'THIRD-PARTY' },
    aba117: { name: 'ABA Senior Lawyers Division, Model Rule 1.17 overview', url: 'https://www.americanbar.org/groups/senior_lawyers/resources/voice-of-experience/2010-2022/selling-law-practice-under-aba-model-rule-117/', tag: 'THIRD-PARTY' },
    ma117: { name: 'Massachusetts SJC, Rule 1.17 text and comments', url: 'https://www.mass.gov/supreme-judicial-court-rules/rules-of-professional-conduct-rule-117-sale-of-law-practice', tag: 'PRIMARY' },
    bloomberg_ab931: { name: 'Bloomberg Law, California AB 931 report, Oct 2025', url: 'https://news.bloomberglaw.com/business-and-practice/california-bans-contingent-fee-sharing-with-alternative-firms', tag: 'THIRD-PARTY' },
    aslj: { name: 'Arizona State Law Journal, Arizona ABS program, Jan 27, 2026', url: 'https://arizonastatelawjournal.org/2026/01/27/arizonas-alternative-business-structures-innovation-meets-neighboring-resistance/', tag: 'THIRD-PARTY' },
    abaj_kpmg: { name: 'ABA Journal, KPMG legal arm approved in Arizona, Feb 2025', url: 'https://www.abajournal.com/news/article/accounting-firm-kpmg-allowed-to-offer-legal-services-in-arizona-through-subsidiary', tag: 'THIRD-PARTY' },
    abaj_utah: { name: 'ABA Journal, Utah sandbox tightens, 2025', url: 'https://www.abajournal.com/news/article/nearly-30-legal-entities-may-leave-utahs-regulatory-sandbox-after-state-tightens-rules', tag: 'THIRD-PARTY' },
    hk_co: { name: 'Holland & Knight, Colorado HB26-1421, Jul 2026', url: 'https://www.hklaw.com/en/insights/publications/2026/07/colorado-to-enact-hb26-1421-targeting-abs-and-mso-structures', tag: 'THIRD-PARTY' },
    hk_il: { name: 'Holland & Knight, Illinois HB 5487, Aug 2026', url: 'https://www.hklaw.com/en/news/intheheadlines/2026/08/illinois-governor-signs-bill-limiting-investor-influence-on-law-firms', tag: 'THIRD-PARTY' },
    hk_tn: { name: 'Holland & Knight, Tennessee Supreme Court order, Oct 2026', url: 'https://www.hklaw.com/en/insights/publications/2026/10/tennessee-supreme-court-keeps-nonlawyer-ownership-rules', tag: 'THIRD-PARTY' },
    ij_tn: { name: 'Insurance Journal, Tennessee ruling, Oct 22, 2026', url: 'https://www.insurancejournal.com/news/southeast/2026/10/22/889892.htm', tag: 'THIRD-PARTY' },
    hk_tx: { name: 'Holland & Knight, Texas Ethics Opinion 706, Aug 2025', url: 'https://www.hklaw.com/en/insights/publications/2025/08/law-firm-msos-and-legal-ethics-regulations-lessons-from-texas', tag: 'THIRD-PARTY' },
    bw_orion: { name: 'Business Wire, Orion Legal and Dudley DeBosier, Jan 22, 2026', url: 'https://www.businesswire.com/news/home/20260122313960/en/Uplift-Investors-Launches-and-Closes-First-Investment-Forming-Orion-Legal-MSO-with-Dudley-DeBosier-Injury-Lawyers', tag: 'PRIMARY' },
    bw_hughes: { name: 'Business Wire, Orion Legal and Hughes & Coleman, May 21, 2026', url: 'https://www.businesswire.com/news/home/20260521267465/en/Uplift-Investors-Orion-Legal-MSO-Forms-Partnership-with-Hughes-Coleman-Injury-Lawyers', tag: 'PRIMARY' },
    abc15_rafi: { name: 'ABC15 Arizona, Rafi $125M back-office deal, Mar 2026', url: 'https://www.abc15.com/news/business/phoenix-law-firm-separates-back-office-with-125m-private-equity-investment', tag: 'THIRD-PARTY' },
    dailyrecord_mm: { name: 'The Daily Record, Morgan & Morgan stake sale, Jun 5, 2026', url: 'https://thedailyrecord.com/2026/06/05/morgan-morgan-explores-minority-stake-sale-ipo/', tag: 'THIRD-PARTY' },
    csuite_pi: { name: 'CSuite Financial Partners, PI firm valuation', url: 'https://csuitefinancialpartners.com/blog/personal-injury-law-firm-valuation/', tag: 'PRACTITIONER ESTIMATE' },
    olmstead_pi: { name: 'Olmstead & Associates, Valuing a PI practice', url: 'https://www.olmsteadassoc.com/blog/valuing-a-personal-injury-law-practice/', tag: 'PRACTITIONER ESTIMATE' },
    adastra: { name: 'Ad Astra Equity, How to value a law firm (citing LeanLaw, Eton, Olmstead)', url: 'https://www.adastraequity.com/guides/how-to-value-a-law-firm', tag: 'PRACTITIONER ESTIMATE' },
    aba_profile2025: { name: 'ABA, 2025 Profile of the Legal Profession, Dec 2025', url: 'https://www.americanbar.org/news/abanews/aba-news-archives/2025/12/aba-2025-profile-of-the-legal-profession-report/', tag: 'PRIMARY' },
    aba_profile2021: { name: 'ABA, 2021 Profile of the Legal Profession, Jul 2021', url: 'https://www.americanbar.org/news/abanews/aba-news-archives/2021/07/2021-aba-profile-of-the-legal-profession-highlights-how-the-pand/', tag: 'PRIMARY' },
    clio_succession: { name: 'Clio, Succession planning (citing Thomson Reuters 2018)', url: 'https://www.clio.com/blog/law-firm-succession-planning/', tag: 'THIRD-PARTY' },
    clio_trends: { name: 'Clio, Legal Trends for Solo and Small Firms, 2025', url: 'https://www.clio.com/about/press/legal-trends-solo-small-law-firms-2025/', tag: 'THIRD-PARTY' },
    lmnc_tail: { name: 'Lawyers Mutual NC, Retiring lawyers and malpractice coverage', url: 'https://lawyersmutualnc.com/article/what-retiring-lawyers-need-to-know-about-malpractice-coverage-2/', tag: 'THIRD-PARTY' },
    lmnc_sell: { name: 'Lawyers Mutual NC, Selling your law practice', url: 'https://lawyersmutualnc.com/risk-management-resources/articles/selling-your-law-practice', tag: 'THIRD-PARTY' },
    nysba1168: { name: 'NYSBA, Ethics Opinion 1168, 2019', url: 'https://nysba.org/ethics-opinion-1168/', tag: 'PRIMARY' },
    scbar2003: { name: 'South Carolina Bar, Ethics Advisory Opinion 20-03', url: 'https://www.scbar.org/for-lawyers/quicklinks/legal-resources/ethics-advisory-opinions/ethics-advisory-opinion-20-03/', tag: 'PRIMARY' },
    myshingle: { name: 'MyShingle, MSOs and solo firms, Apr 2026', url: 'https://www.myshingle.com/2026/04/why-msos-are-a-no-go-for-solo-and-small-law-firms/', tag: 'THIRD-PARTY' },
    lpe_buy: { name: 'The Law Practice Exchange, Buy a law firm (fees), 2026', url: 'https://thelawpracticeexchange.com/buy/', tag: 'THIRD-PARTY' },
    paragon_fee: { name: 'PARAGON (dental practice transitions), seller fee post, undated', url: 'https://paragon.us.com/?p=1613', tag: 'THIRD-PARTY' },
    ca117: { name: 'State Bar of California, Rule 1.17 text and executive summary, effective Nov 1, 2018', url: 'https://www.calbar.ca.gov/Portals/0/documents/rules/Rule_1.17-Exec_Summary-Redline.pdf', tag: 'PRIMARY' },
    ab931_text: { name: 'AB 931 (Ch. 565, Stats. 2025), bill text via CalMatters Digital Democracy', url: 'https://calmatters.digitaldemocracy.org/bills/ca_202520260ab931', tag: 'THIRD-PARTY' },
    irs_8594: { name: 'IRS, Instructions for Form 8594 (Rev. 11/2021)', url: 'https://www.irs.gov/instructions/i8594', tag: 'PRIMARY' },
    irs_sale: { name: 'IRS, Sale of a business (updated Feb 10, 2026)', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/sale-of-a-business', tag: 'PRIMARY' },
    irs_p541: { name: 'IRS, Publication 541, Partnerships (Rev. 12/2025)', url: 'https://www.irs.gov/publications/p541', tag: 'PRIMARY' },
    irs_p537: { name: 'IRS, Publication 537, Installment Sales (2025)', url: 'https://www.irs.gov/pub/irs-pdf/p537.pdf', tag: 'PRIMARY' },
    irs_tc409: { name: 'IRS, Topic 409, Capital gains and losses (updated Sep 24, 2026)', url: 'https://www.irs.gov/taxtopics/tc409', tag: 'PRIMARY' },
    usc197: { name: '26 U.S.C. 197, Amortization of goodwill (Cornell LII)', url: 'https://www.law.cornell.edu/uscode/text/26/197', tag: 'PRIMARY' },
    howard: { name: 'Howard v. United States, 448 F. App\'x 752 (9th Cir. 2011), unpublished', url: 'https://cetient.com/case/612789/larry-howard-v-united-states', tag: 'PRIMARY' },
    ssa_fee: { name: 'Social Security Administration, Fee agreements', url: 'https://www.ssa.gov/representation/fee_agreements.htm', tag: 'PRIMARY' },
    fl440: { name: 'Florida Statutes 440.34, Attorney fees (2024)', url: 'https://flsenate.gov/Laws/Statutes/2024/440.34', tag: 'PRIMARY' },
    nywcb: { name: 'New York Workers\' Compensation Board, Finding legal representation', url: 'https://www.wcb.ny.gov/content/main/Reps/findRep.jsp', tag: 'PRIMARY' },
    iardc: { name: 'Illinois ARDC, Succession planning and practice transitions (quoting Rule 1.3, Comment 5)', url: 'https://iardc.org/EducationAndOutreach/SuccessionPlanningAndPracticeTransitions', tag: 'PRIMARY' },
    flbar_inv: { name: 'The Florida Bar News, Inventory attorney designation (Rule 1-3.8), Sep 4, 2025', url: 'https://www.floridabar.org/the-florida-bar-news/florida-lawyers-must-designate-an-inventory-attorney-heres-how', tag: 'PRIMARY' },
    cobar147: { name: 'Colorado Bar Association, Formal Ethics Opinion 147, Succession planning', url: 'https://Www.Cobar.org/Portals/COBAR/Repository/ethicsOpinions/2023-12-13%20Succession%20Planning%20Opinion_FINAL.pdf', tag: 'PRIMARY' },
    nysba961: { name: 'NYSBA, Ethics Opinion 961, Mar 13, 2013', url: 'https://nysba.org/?p=8807', tag: 'PRIMARY' },
    nysba1035: { name: 'NYSBA, Ethics Opinion 1035, Nov 14, 2014', url: 'https://nysba.org/ethics-opinion-1035/', tag: 'PRIMARY' },
    olmstead_value: { name: 'Olmstead & Associates, Law firm value: what is a firm worth, undated', url: 'https://www.illinoislawyernow.com/2026/06/law-firm-value-what-is-a-firm-worth/', tag: 'PRACTITIONER ESTIMATE' },
    sourceco_pnw: { name: 'SourceCo, Pacific Northwest family law and estate planning platform memo, 2026', url: 'https://www.sourcecodeals.com/off-market-deal-memos/pacific-northwest-family-law-estate-planning-platform', tag: 'SOURCECO FIRST-PARTY' },
    sourceco_re: { name: 'SourceCo, Multi-office real estate-led law firm platform memo, 2026', url: 'https://www.sourcecodeals.com/off-market-deal-memos/multi-office-real-estate-led-law-firm-platform-with-mso-ready-structure', tag: 'SOURCECO FIRST-PARTY' },
    sourceco_memos: { name: 'SourceCo, off-market law firm deal memos, 2025 to 2026', url: 'https://www.sourcecodeals.com/off-market-deal-memos/personal-injury-law-firm-platform-with-mso-ready-structure', tag: 'SOURCECO FIRST-PARTY' }
  };

  // ---------- Practice areas ----------
  // fit follows L.E.K. (Feb 2026) investor fit tiers; workers comp / SSD per Citizens (Aug 2025).
  var PRACTICES = [
    { key: 'pi', label: 'Personal injury', fit: 'high', contingency: true },
    { key: 'masstort', label: 'Mass tort', fit: 'high', contingency: true },
    { key: 'wc', label: 'Workers comp / SSD', fit: 'high', contingency: true },
    { key: 'bankruptcy', label: 'Consumer bankruptcy / debt', fit: 'high', contingency: false },
    { key: 'family', label: 'Family', fit: 'middle', contingency: false },
    { key: 'estate', label: 'Estate planning / elder', fit: 'middle', contingency: false },
    { key: 'immigration', label: 'Immigration', fit: 'neutral', contingency: false },
    { key: 'criminal', label: 'Criminal defense', fit: 'constrained', contingency: false },
    { key: 'realestate', label: 'Real estate', fit: 'neutral', contingency: false },
    { key: 'employment', label: 'Employment (plaintiff)', fit: 'neutral', contingency: true },
    { key: 'corporate', label: 'Business / corporate', fit: 'low', contingency: false },
    { key: 'ip', label: 'IP', fit: 'neutral', contingency: false },
    { key: 'general', label: 'General practice', fit: 'neutral', contingency: false }
  ];

  var FIT = {
    high: { label: 'High investor fit', shiftB: 0.25, shiftA: 0.05, note: 'Marketing-driven demand, fragmented clients and repeatable workflows. The profile PE-backed MSOs look at first.' },
    middle: { label: 'Middle investor fit', shiftB: 0, shiftA: 0.1, note: 'Recurring clients help, but local courts and relationships limit how far a platform can scale it.' },
    neutral: { label: 'Selective buyer pool', shiftB: -0.25, shiftA: 0, note: 'Fewer dedicated buyers. Most deals are firm to firm.' },
    constrained: { label: 'Constrained investor fit', shiftB: -0.5, shiftA: -0.15, note: 'Value follows the individual lawyer, so most deals are lawyer to lawyer.' },
    low: { label: 'Low investor fit', shiftB: -0.5, shiftA: -0.1, note: 'Value sits with individual partners. Mergers and laterals are more common than outright sales.' }
  };

  // ---------- States ----------
  var STATES = [
    ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['PR', 'Puerto Rico'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming']
  ];

  // level: restrict | open | note | standard
  var STATE_NOTES = {
    AZ: { level: 'open', title: 'Arizona licenses nonlawyer ownership (ABS)', text: 'Arizona licenses alternative business structures, so investors can own part of a firm. 151 entities were licensed by January 2026, including KPMG Law US.', src: ['aslj', 'abaj_kpmg'] },
    CA: { level: 'restrict', title: 'California limits fee sharing with out-of-state ABS firms', text: 'AB 931, signed October 2025, bars California lawyers from sharing contingency fees with out-of-state ABS firms on contracts from January 1, 2026. It runs to January 1, 2030. MSO fee design needs counsel.', src: ['bloomberg_ab931', 'aslj'] },
    CO: { level: 'restrict', title: 'Colorado restricts ABS and MSO fee structures', text: 'HB26-1421, effective August 12, 2026, effectively bans ABS firms. MSOs may only be paid flat or hourly fees not tied to profits or recoveries, and clients and competitors can sue.', src: ['hk_co'] },
    DC: { level: 'open', title: 'DC allows limited nonlawyer ownership', text: 'DC has allowed limited nonlawyer ownership since 1991. A Rule 1.17 sale to another lawyer is still the common path.', src: ['sidley'] },
    IL: { level: 'restrict', title: 'Illinois limits MSO fees and influence', text: 'HB 5487, signed August 7, 2026, bars MSOs from interfering with lawyers\' judgment or hiring, and from fees based directly or indirectly on firm revenue, fees or profits.', src: ['hk_il'] },
    MA: { level: 'note', title: 'Massachusetts: no geographic cease-practice rule', text: 'Massachusetts\' Rule 1.17 does not require the seller to stop practicing in a geographic area. Client notice still applies.', src: ['ma117'] },
    NC: { level: 'note', title: 'North Carolina: the seller can stay on', text: 'North Carolina lets a selling lawyer keep working as the buyer\'s employee, which helps client retention.', src: ['lmnc_sell'] },
    NY: { level: 'note', title: 'New York: the buyer may keep your firm name', text: 'NY Ethics Opinion 1168 (2019) says a buyer may keep the seller\'s firm name if it is not misleading.', src: ['nysba1168'] },
    PR: { level: 'open', title: 'Puerto Rico allows up to 49% nonlawyer ownership', text: '2025 rules allow nonlawyers to own up to 49% of a firm, with a review after three years.', src: ['sidley'] },
    SC: { level: 'note', title: 'South Carolina: successor firms can keep retired names', text: 'SC Ethics Opinion 20-03 lets a bona fide successor firm keep retired partners\' names.', src: ['scbar2003'] },
    TN: { level: 'restrict', title: 'Tennessee kept its nonlawyer ownership ban', text: 'On October 2, 2026, the Tennessee Supreme Court declined to allow nonlawyer ownership or fee sharing. It did not rule on MSOs.', src: ['hk_tn', 'ij_tn'] },
    TX: { level: 'restrict', title: 'Texas: no percentage-of-revenue MSO fees', text: 'Texas Ethics Opinion 706 (February 2025) says paying an MSO a percentage of firm revenue is improper fee splitting. Fixed or cost-plus fees are the safer design.', src: ['hk_tx'] },
    UT: { level: 'note', title: 'Utah\'s sandbox has narrowed', text: 'Utah\'s regulatory sandbox shrank from 39 participants in 2022 to 11 in April 2025. Most sellers should not plan around it.', src: ['sidley', 'abaj_utah'] }
  };
  var STATE_DEFAULT = { level: 'standard', title: 'Standard path: Rule 1.17 sale, Rule 5.4 limits', text: 'Plan on your state\'s version of Model Rule 1.17 for a sale to another attorney or firm, and Rule 5.4 limits on nonlawyer ownership and fee sharing. Confirm the details with ethics counsel.', src: ['aba117', 'sidley'] };

  // ---------- Helpers ----------
  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : 0;
  }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function practice(key) { for (var i = 0; i < PRACTICES.length; i++) if (PRACTICES[i].key === key) return PRACTICES[i]; return PRACTICES[0]; }
  function stateName(code) { for (var i = 0; i < STATES.length; i++) if (STATES[i][0] === code) return STATES[i][1]; return ''; }
  function stateRule(code) { return STATE_NOTES[code] || STATE_DEFAULT; }
  function nice(v) {
    var a = Math.abs(v), step;
    if (a < 1e5) step = 5e3; else if (a < 1e6) step = 1e4; else if (a < 1e7) step = 5e4; else step = 2.5e5;
    return Math.round(v / step) * step;
  }
  function money(v) {
    v = nice(v);
    if (Math.abs(v) >= 1e6) {
      var m = v / 1e6;
      var s = m >= 10 ? m.toFixed(1) : m.toFixed(2);
      s = s.replace(/\.?0+$/, '');
      return '$' + s + 'M';
    }
    return '$' + Math.round(v / 1e3) + 'K';
  }
  function moneyFull(v) { return '$' + Math.round(v).toLocaleString('en-US'); }
  function x(v, d) { return (Math.round(v * 10) / 10).toFixed(d == null ? 1 : d).replace(/\.0$/, '') + 'x'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var DEFAULTS = { practice: 'pi', state: 'OH', revenue: 2400000, profit: 1100000, owners: 2, salary: 175000, pipeline: 0, orig: '25to50', flow: 'marketing', stay: '1yr', timeline: '2to3' };

  // ---------- The model ----------
  function compute(input) {
    var i = {};
    for (var k in DEFAULTS) i[k] = (input && input[k] != null && input[k] !== '') ? input[k] : DEFAULTS[k];
    var p = practice(i.practice);
    var fit = FIT[p.fit];
    var rev = Math.max(0, num(i.revenue));
    var profit = num(i.profit);
    var owners = Math.max(0, Math.round(num(i.owners)));
    var salary = Math.max(0, num(i.salary));
    var pipeline = Math.max(0, num(i.pipeline));
    var ebitda = profit - owners * salary;

    // Durability score, -1 (fragile) to +1 (transferable).
    var origW = { lt25: 0.45, '25to50': 0.15, '50to75': -0.25, gt75: -0.55 }[i.orig]; if (origW == null) origW = 0;
    var flowW = { marketing: 0.3, mixed: 0.05, referral: -0.3 }[i.flow]; if (flowW == null) flowW = 0;
    var stayW = { lt6: -0.35, '1yr': 0, '2to3': 0.3, partner: 0.45 }[i.stay]; if (stayW == null) stayW = 0;
    var s = clamp(origW + flowW + stayW, -1, 1);
    var c = 0.5 + 0.5 * s; // position inside the band, 0 to 1
    var W = { orig: origW, flow: flowW, stay: stayW };

    var r = { input: i, practice: p, fit: fit, revenue: rev, ebitda: ebitda, pipeline: pipeline, score: s, empty: rev <= 0 };
    var rule = stateRule(i.state);
    r.state = { code: i.state, name: stateName(i.state), level: rule.level, title: rule.title, text: rule.text, src: rule.src };

    if (rev < 1e6 || ebitda < 250000) {
      // Path A: Rule 1.17 sale to another lawyer or firm, priced off fees (Clio: 0.5 to 3.0x gross revenue).
      r.path = 'A';
      r.pathLabel = 'Attorney-to-attorney sale (Rule 1.17)';
      var ca = clamp(0.5 + c * 1.0 + fit.shiftA, 0.6, 1.4);
      r.multLo = clamp(ca - 0.2, 0.5, 1.5);
      r.multHi = clamp(ca + 0.2, 0.5, 1.5);
      r.multMid = (r.multLo + r.multHi) / 2;
      r.basis = rev; r.basisLabel = 'annual fees'; r.scaleMax = 3;
      r.bandLo = 0.5; r.bandW = 1.0; r.fitShift = fit.shiftA;
      r.buyer = p.fit === 'middle' ? 'A local firm in your practice area, buying under Rule 1.17' : 'Another attorney or firm, buying under Rule 1.17';
      if (i.timeline === 'capital') r.buyer += ', or an associate as internal successor';
      r.structure = 'Usually paid over several years, with part tied to the clients who stay (an earnout). Rule 1.17 requires written notice to every client.';
    } else {
      // Path B: firm or PE-backed MSO buyer, priced off adjusted EBITDA (PELA 2026: 3 to 5x smaller, high single digits larger, 7 to 10x largest PI platforms).
      r.path = 'B';
      var lo = 3, hi = 5, tier = 'smaller';
      if (ebitda > 1e7 && (p.key === 'pi' || p.key === 'masstort')) { lo = 7; hi = 10; tier = 'platform'; }
      else if (ebitda > 3e6) { lo = 5; hi = 8; tier = 'larger'; }
      r.tier = tier;
      var floor = Math.max(2.5, lo - 0.5), ceil = Math.min(10, hi + (p.fit === 'high' ? 0.25 : 0));
      var half = tier === 'smaller' ? 0.5 : 0.75;
      var center = clamp(lo + c * (hi - lo) + fit.shiftB, floor, ceil);
      r.multLo = Math.max(floor, center - half);
      r.multHi = Math.min(ceil, center + half);
      if (r.multHi - r.multLo < 2 * half * 0.75) {
        if (r.multHi >= ceil) r.multLo = Math.max(floor, ceil - 2 * half * 0.75);
        else r.multHi = Math.min(ceil, floor + 2 * half * 0.75);
      }
      r.multMid = (r.multLo + r.multHi) / 2;
      r.basis = ebitda; r.basisLabel = 'adjusted EBITDA'; r.scaleMax = 10;
      r.bandLo = lo; r.bandW = hi - lo; r.fitShift = fit.shiftB;
      r.pathLabel = tier === 'smaller' ? 'Firm or MSO buyer, EBITDA multiple' : (tier === 'larger' ? 'Larger firm, EBITDA multiple' : 'Platform-scale PI, earnings multiple');
      if (p.fit === 'high') r.buyer = ebitda >= 1e6 ? 'A PE-backed MSO platform or a larger regional firm' : 'A regional firm, with MSO platforms watching as you grow';
      else if (p.fit === 'middle') r.buyer = 'A regional firm or merger partner. PE-backed platforms are selective here';
      else if (p.fit === 'neutral') r.buyer = 'Another firm, through a merger or acquisition';
      else r.buyer = 'Another firm through a merger. PE interest is limited';
      r.structure = p.fit === 'high'
        ? 'One 2026 PI guide example: 70% cash at close, 30% rolled into the new entity. Expect a quality of earnings review, usually $30K to $50K.'
        : 'Usually cash at close plus an earnout tied to retained revenue, often with you staying 1 to 3 years. Larger deals add a quality of earnings review.';
      if (rule.level === 'restrict' && (p.fit === 'high' || p.fit === 'middle')) r.buyer += '. Your state limits MSO fee structures';
    }

    r.lo = nice(r.basis * r.multLo);
    r.hi = nice(r.basis * r.multHi);
    r.mid = nice(r.basis * r.multMid);
    if (r.hi < r.lo) { var t = r.lo; r.lo = r.hi; r.hi = t; }
    r.revMultiple = rev > 0 ? r.mid / rev : 0;

    // What moves the number
    var d = [];
    if (i.orig === 'gt75' || i.orig === '50to75') d.push({ dir: 'down', text: 'You personally originate most of the revenue. Buyers discount books that depend on one person.' });
    if (i.orig === 'lt25') d.push({ dir: 'up', text: 'Revenue does not depend on you. That is what buyers pay the most for.' });
    if (i.flow === 'referral') d.push({ dir: 'down', text: 'Referral-driven work often follows the lawyer, not the firm.' });
    if (i.flow === 'marketing') d.push({ dir: 'up', text: 'Marketing-driven intake can be measured and scaled by a buyer.' });
    if (i.stay === 'lt6') d.push({ dir: 'down', text: 'A transition under 6 months puts client retention at risk.' });
    if (i.stay === '2to3') d.push({ dir: 'up', text: 'Staying 2 to 3 years protects retention and any earnout.' });
    if (i.stay === 'partner') d.push({ dir: 'up', text: 'Staying on long term as a partner protects client retention and fits rollover equity deals.' });
    if (r.path === 'B' && rev > 0) {
      var margin = ebitda / rev;
      if (margin >= 0.3) d.push({ dir: 'up', text: 'Strong margin after paying each partner a replacement salary.' });
      else if (margin < 0.12) d.push({ dir: 'down', text: 'Thin profit after paying each partner a replacement salary.' });
    }
    if (r.path === 'A' && ebitda < 250000 && rev >= 1e6) d.push({ dir: 'down', text: 'Profit after a replacement salary is under $250K, so buyers price off retained fees.' });
    if (p.fit === 'high') d.push({ dir: 'up', text: p.label + ' sits in investors\' high-fit group.' });
    if (p.fit === 'low' || p.fit === 'constrained') d.push({ dir: 'down', text: p.label + ' value tends to follow individual lawyers.' });
    if (p.contingency && pipeline > 0) d.push({ dir: 'info', text: 'Your case inventory (' + money(pipeline) + ') is usually paid as cases resolve, on top of this range.' });
    if (r.path === 'B') d.push({ dir: 'info', text: 'A documented, metrics-based plan can add 1 to 2 turns.' });
    r.drivers = d.slice(0, 4);
    r.w = W;
    return r;
  }

  // ---------- Result card renderer (same HTML in Node prerender and browser) ----------
  // ---------- Dollar breakdown, levers and payout (directional) ----------
  var ORIG_L = { lt25: 'Under 25% of fees depend on you', '25to50': 'You bring in 25 to 50% of fees', '50to75': 'You bring in 50 to 75% of fees', gt75: 'You originate over 75% of fees' };
  var FLOW_L = { marketing: 'Marketing-driven case flow', mixed: 'A mix of referrals and marketing', referral: 'Mostly referral-driven work' };
  var STAY_L = { lt6: 'Transition under 6 months', '1yr': 'About a year of transition', '2to3': 'Can stay 2 to 3 years', partner: 'Staying on long term as a partner' };
  function breakdown(r) {
    if (r.empty) return { base: 0, items: [] };
    var center = r.bandLo + 0.5 * r.bandW;
    var base = r.basis * center;
    var items = [];
    var add = function (label, dm) { var v = nice(dm * r.basis); if (Math.abs(v) >= 1000) items.push({ label: label, v: v }); };
    add(ORIG_L[r.input.orig] || 'Owner origination', 0.5 * r.w.orig * r.bandW);
    add(FLOW_L[r.input.flow] || 'Intake', 0.5 * r.w.flow * r.bandW);
    add(STAY_L[r.input.stay] || 'Transition', 0.5 * r.w.stay * r.bandW);
    add(r.fit.label + ': ' + r.practice.label.toLowerCase(), r.fitShift);
    items.sort(function (a, b) { return Math.abs(b.v) - Math.abs(a.v); });
    items = items.slice(0, 4);
    var sum = nice(base) + items.reduce(function (t, it) { return t + it.v; }, 0), gap = nice(r.mid - sum);
    if (Math.abs(gap) > 0.03 * r.mid) items.push({ label: gap < 0 ? 'Capped at the top of the published range' : 'Held at the floor of the published range', v: gap });
    return { base: nice(base), center: center, items: items };
  }
  function levers(r) {
    if (r.empty) return [];
    var out = [];
    var tries = [['orig', 'lt25', 'Hand clients to other attorneys until under 25% of fees depend on you'], ['flow', 'marketing', 'Build measurable, marketing-driven intake'], ['stay', '2to3', 'Plan to stay 2 to 3 years after the sale']];
    for (var i = 0; i < tries.length; i++) {
      var t = tries[i]; if (r.input[t[0]] === t[1]) continue;
      var v = {}; for (var k in r.input) v[k] = r.input[k]; v[t[0]] = t[1];
      var d = nice(compute(v).mid - r.mid);
      if (d > 0) out.push({ label: t[2], v: d });
    }
    if (r.path === 'B') out.push({ label: 'Document a metrics-based plan: worth 1 to 2 turns', v: nice(r.ebitda), range: nice(2 * r.ebitda) });
    out.sort(function (a, b) { return b.v - a.v; });
    return out.slice(0, 2);
  }
  function payout(r) {
    var share = r.path === 'B' ? 0.7 : 0.5;
    var close = nice(r.mid * share), deferred = nice(r.mid - close);
    var cost = r.path === 'B' ? 40000 : 0;
    return { share: share, close: close, deferred: deferred, cost: cost, keep: close - cost };
  }
  var LAW_MEMOS = {
    pi: { url: 'https://www.sourcecodeals.com/off-market-deal-memos/personal-injury-law-firm-platform-with-mso-ready-structure', title: 'Personal injury law firm platform with MSO-ready structure' },
    closing: { url: 'https://www.sourcecodeals.com/off-market-deal-memos/multi-office-family-law-platform-with-in-house-attorney-bench', title: '6-office closing and title law firm handling 300+ property closings a month' },
    estate: { url: 'https://www.sourcecodeals.com/off-market-deal-memos/pacific-northwest-family-law-estate-planning-platform', title: 'Pacific Northwest family law and estate planning platform' },
    realestate: { url: 'https://www.sourcecodeals.com/off-market-deal-memos/multi-office-real-estate-led-law-firm-platform-with-mso-ready-structure', title: 'Multi-office real estate-led law firm platform with MSO-ready structure' }
  };
  var MEMO_FOR = { pi: 'pi', masstort: 'pi', wc: 'pi', employment: 'pi', family: 'estate', estate: 'estate', realestate: 'realestate' };
  function memoFor(key) { return LAW_MEMOS[MEMO_FOR[key] || 'pi']; }
  function sign(v) { return (v >= 0 ? '+' : '-') + money(Math.abs(v)); }
  function moneyP(v) {
    var a = Math.abs(v);
    if (a >= 1e6) return '$' + (v / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
    return '$' + Math.round(v / 1e3) + 'K';
  }

  // Gated detail cards (rendered in the browser only; blurred until the email gate is passed).
  function renderDetails(r) {
    if (r.empty) return '<p class="dempty">Enter your fees to build your breakdown.</p>';
    var p = payout(r), lv = levers(r), memo = memoFor(r.practice.key);
    var payLabel = r.path === 'B' ? 'Using the 70/30 example from one 2026 guide. Terms vary by buyer.' : 'Illustration only: half at close, half as an earnout over several years. Terms vary.';
    var deferLabel = r.path === 'B' ? 'Rollover equity or earnout' : 'Earnout tied to clients who stay';
    var buyers = r.path === 'B'
      ? ['A regional or national law firm buying for scale', 'An investor-backed services platform (MSO), where your state allows it', 'An Arizona ABS firm, if you are open to licensed outside owners']
      : ['Another attorney or local firm, under Rule 1.17', 'An associate or partner as internal successor', 'A regional firm adding your practice area'];
    var lvHtml = lv.length ? lv.map(function (l) { return '<li><span>' + esc(l.label) + '</span><b>+' + money(l.v) + (l.range ? ' to +' + money(l.range) : '') + '</b></li>'; }).join('') : '<li><span>Your inputs are already at the strongest settings in this model.</span><b></b></li>';
    return '<div class="dgrid">' +
      '<div class="dcard"><p class="dk">How you would likely be paid</p><div class="dsplit"><div><b>' + money(p.close) + '</b><span>Cash at close (' + Math.round(p.share * 100) + '%)</span></div><div><b>' + money(p.deferred) + '</b><span>' + deferLabel + '</span></div></div><div class="dbar"><i style="width:' + (p.share * 100) + '%"></i></div><p class="dnote">' + payLabel + '</p></div>' +
      '<div class="dcard"><p class="dk">What you would keep</p><table class="dtable"><tbody>' +
        '<tr><td>Directional price (midpoint)</td><td>' + moneyP(r.mid) + '</td></tr>' +
        '<tr><td>' + deferLabel + ', not cash at close</td><td>-' + moneyP(p.deferred) + '</td></tr>' +
        '<tr><td>' + (r.path === 'B' ? 'Quality of earnings review, about $30K to $50K' : 'Legal and advisory fees') + '</td><td>' + (r.path === 'B' ? '-' + moneyP(p.cost) : 'varies') + '</td></tr>' +
        '<tr class="dtot"><td>Cash at close, before tax</td><td>' + moneyP(p.keep) + '</td></tr>' +
      '</tbody></table><p class="dnote">Pre-tax and illustrative. Taxes depend partly on how goodwill is allocated; see a CPA.</p></div>' +
      '<div class="dcard"><p class="dk">Which buyers fit</p><ul class="dlist">' + buyers.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul><a class="dmemo" href="' + memo.url + '" target="_blank" rel="noopener" data-cta="details_memo"><span class="dlive">Live</span>' + esc(memo.title) + '</a></div>' +
      '<div class="dcard"><p class="dk">What would add the most to your price</p><ul class="dlevers">' + lvHtml + '</ul><p class="dnote">Changes in the directional midpoint from this model, holding everything else the same.</p></div>' +
    '</div>';
  }

  // The email gate card (white), matching SourceCo's live calculators.
  function renderGate(opts) {
    opts = opts || {};
    var checks = ['Where your number comes from, step by step, and which buyers fit', 'What would add the most to your price, in dollars', 'How you would likely be paid, and what you would keep after the deal structure', 'A PDF report by email'];
    // Follow-up is attributed to a SourceCo advisor (no individual named) until SourceCo assigns an owner for law firm leads.
    return '<div class="gatecard" data-gate>' +
      '<div class="gc-head"><div><p class="gc-k">Free and instant</p><p class="gc-h">See your full breakdown, free</p></div>' + (opts.preview ? '<img class="gc-pdf" src="' + opts.preview + '" alt="" width="84" height="108" loading="lazy">' : '') + '</div>' +
      '<ul class="gc-checks">' + checks.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul>' +
      '<form class="form" novalidate>' +
        '<!-- PRODUCTION: send to the Webflow form or HubSpot Forms API (see calc.js). Nothing is sent in this prototype. -->' +
        '<label class="fl" for="g-name">Full name</label><input id="g-name" name="name" autocomplete="name" required placeholder="Jane Smith">' +
        '<label class="fl" for="g-email">Email</label><input id="g-email" name="email" type="email" autocomplete="email" required placeholder="you@yourfirm.com">' +
        '<p class="consent">By continuing you agree to SourceCo\'s <a href="https://www.sourcecodeals.com/privacy-policy" target="_blank" rel="noopener">privacy policy</a>.</p>' +
        '<button class="btn-dark btn-block" type="submit" data-cta="report_submit">Show my full breakdown <span class="arrow"></span></button>' +
        '<p class="gc-note">Free and instant, with a PDF report by email.</p>' +
        '<p class="err" role="alert"></p>' +
      '</form>' +
      '<div class="success" tabindex="-1" role="status"><b>Unlocked.</b> Your full breakdown is now open on this page, and the PDF report is on its way. <em>Prototype: nothing was sent.</em></div>' +
      '<div class="gc-person"><span class="avatar" aria-hidden="true">SC</span><p><b>A SourceCo advisor</b> follows up the same business day, and only calls if you ask for a call. Call or text <a href="tel:+16146995764">+1 (614) 699-5764</a>.</p></div>' +
    '</div>';
  }

  function renderResult(r, opts) {
    opts = opts || {};
    if (r.empty) {
      return '<p class="rc-eyebrow">Your directional valuation</p><p class="rc-empty">Enter your trailing 12 month fee revenue to see a range.</p>';
    }
    var eyebrow = opts.example
      ? 'Example: a ' + money(r.revenue) + ' ' + r.practice.label.toLowerCase() + ' firm in ' + (r.state.name || 'your state') + '. Enter your numbers to replace it.'
      : 'Your directional valuation, ' + r.practice.label.toLowerCase() + (r.state.name ? ', ' + r.state.name : '');
    var max = r.scaleMax;
    var left = clamp(r.multLo / max * 100, 0, 100), width = clamp((r.multHi - r.multLo) / max * 100, 1.5, 100), mark = clamp(r.multMid / max * 100, 0, 100);
    var ticks = '';
    for (var t = 0; t <= 20; t++) ticks += '<i' + (t % 5 === 0 ? ' class="maj"' : '') + '></i>';
    var lvl = { restrict: 'Restricted', open: 'More open', note: 'State note', standard: 'Standard' }[r.state.level];
    var bd = breakdown(r);
    return '' +
      '<p class="rc-eyebrow">' + esc(eyebrow) + '</p>' +
      '<p class="rc-range"><span class="rc-v" data-v="' + nice(r.lo) + '">' + money(r.lo) + '</span><span class="rc-to">to</span><span class="rc-v" data-v="' + nice(r.hi) + '">' + money(r.hi) + '</span></p>' +
      '<p class="rc-sub"><span class="nw">Midpoint ' + money(r.mid) + '</span> <span class="rc-dot">&#183;</span> <span class="nw">about ' + x(r.multMid) + ' ' + r.basisLabel + '</span>' + (r.path === 'B' ? ' <span class="rc-dot">&#183;</span> <span class="nw">' + x(r.revMultiple, 1) + ' annual fees</span>' : '') + '</p>' +
      '<div class="rc-scale" role="img" aria-label="Range of ' + x(r.multLo) + ' to ' + x(r.multHi) + ' ' + r.basisLabel + ' on a scale of 0 to ' + max + 'x">' +
        '<div class="rc-track"></div><div class="rc-ticks">' + ticks + '</div>' +
        '<div class="rc-band" style="left:' + left.toFixed(1) + '%;width:' + width.toFixed(1) + '%"></div>' +
        '<div class="rc-mark" style="left:' + mark.toFixed(1) + '%"></div>' +
        '<div class="rc-axis"><span>0x</span><span>' + (max / 2) + 'x</span><span>' + max + 'x ' + (r.path === 'B' ? 'EBITDA' : 'fees') + '</span></div>' +
      '</div>' +
      '<p class="rc-basis">' + esc(r.pathLabel) + (r.path === 'B' ? ', on ' + money(r.ebitda) + ' adjusted EBITDA' : ', on ' + money(r.revenue) + ' in fees') + '</p>' +
      '<p class="rc-h">Where the number comes from</p><ul class="rc-break">' +
        '<li class="base"><span>Typical ' + x(bd.center) + ' ' + r.basisLabel + ' for your size</span><b>' + money(bd.base) + '</b></li>' +
        bd.items.map(function (it) { return '<li class="' + (it.v >= 0 ? 'up' : 'down') + '"><span>' + esc(it.label) + '</span><b>' + sign(it.v) + '</b></li>'; }).join('') +
      '</ul>' +
      '<dl class="rc-facts">' +
        '<div class="rc-state rs-' + r.state.level + '"><dt>' + (r.state.name ? esc(r.state.name) + ' rules' : 'State rules') + ' <span class="rc-pill">' + lvl + '</span></dt><dd><strong>' + esc(r.state.title) + '.</strong> ' + esc(r.state.text) + '</dd></div>' +
      '</dl>' +
      '<p class="rc-h">What your number means</p><p class="rc-legal">Directional, not an appraisal or legal advice. Ranges come from dated third-party sources listed on this page; adjustments are approximate and before limits and rounding.</p>';
  }

  var api = { SOURCES: SOURCES, PRACTICES: PRACTICES, FIT: FIT, STATES: STATES, STATE_NOTES: STATE_NOTES, STATE_DEFAULT: STATE_DEFAULT, DEFAULTS: DEFAULTS, compute: compute, renderResult: renderResult, renderDetails: renderDetails, renderGate: renderGate, breakdown: breakdown, levers: levers, payout: payout, memoFor: memoFor, money: money, moneyFull: moneyFull, num: num, practice: practice, stateRule: stateRule, stateName: stateName, esc: esc };
  root.SCModel = api;
})(typeof window !== 'undefined' ? window : globalThis);

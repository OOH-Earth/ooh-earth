# OOH Earth — Changelog & Pre-Launch Checklist

_Last updated: 2026-08-01_

## Recent fixes

- **Map page bottom nav** — Leaflet/MapLibre panes (z-index 200–700) escaped the map container and painted over the `z-50` mobile bottom tabs. Added `isolate` to the map wrapper so its internal stacking context can no longer cover the nav.
- **Mobile menu clipping** — `NavMenu` now portals to `document.body`, escaping the backdrop-blur containing block so the full-screen launcher fills the viewport on mobile.
- **Header hidden under nav on notched devices** — the fixed nav inflates by `env(safe-area-inset-top)` on iPhones with notches/dynamic islands, but page top padding was a fixed `pt-24/pt-28`, causing masthead H1s to slip underneath. Added a `.page-top` utility (`calc(6rem + env(safe-area-inset-top))`, `7rem` on md) and applied it to `Channel.jsx`.

## [1.3.0](https://github.com/OOH-Earth/ooh-earth/compare/v1.2.0...v1.3.0) (2026-09-05)


### Features

* **a11y:** adopt useFocusTrap in UnitFinder ([#65](https://github.com/OOH-Earth/ooh-earth/issues/65)) ([96942cd](https://github.com/OOH-Earth/ooh-earth/commit/96942cd7573a7eb0be6d293cc37e7a114e6e1027))
* **a11y:** WAI-ARIA focus-trap foundation for CommandCenter/NavMenu/QuickCapture ([#62](https://github.com/OOH-Earth/ooh-earth/issues/62)) ([73a496b](https://github.com/OOH-Earth/ooh-earth/commit/73a496b7701dec7cf43da28ecdf9131d62a2ab31))
* **advertiser:** give parent-corp sector data a real, structured source ([#75](https://github.com/OOH-Earth/ooh-earth/issues/75)) ([d5093dc](https://github.com/OOH-Earth/ooh-earth/commit/d5093dc628c20ff5c438b60b07260b10cb4982c4))
* **analytics:** Tier 1 traction instrumentation via base44.analytics.track ([#121](https://github.com/OOH-Earth/ooh-earth/issues/121)) ([00bb001](https://github.com/OOH-Earth/ooh-earth/commit/00bb001c467cbb87b591e2eac99132f63538ad98))
* **ar:** identify the brand in AR-filed reports via the same scanner /report uses ([#80](https://github.com/OOH-Earth/ooh-earth/issues/80)) ([89fc849](https://github.com/OOH-Earth/ooh-earth/commit/89fc849f322704bceae1f4667edd638f2a351b4e))
* **ar:** surface parent corporation in AR's done-state summary ([#95](https://github.com/OOH-Earth/ooh-earth/issues/95)) ([fec6c47](https://github.com/OOH-Earth/ooh-earth/commit/fec6c473d0f102f0a0de5ca7b6221dc6b4170c61))
* **campaign:** confirm donation payment_confirmed from webhook state, not the URL ([#151](https://github.com/OOH-Earth/ooh-earth/issues/151)) ([ca31d87](https://github.com/OOH-Earth/ooh-earth/commit/ca31d873d977f5b91658ebe53f9a4f026804f3bd))
* **campaign:** track offer_viewed and checkout_started on donations ([#148](https://github.com/OOH-Earth/ooh-earth/issues/148)) ([00c3152](https://github.com/OOH-Earth/ooh-earth/commit/00c31526060c081e3bbf3f2046271580cbf8eb0f))
* **careers:** migrate Careers/CareerRole to a shared react-query hook ([#130](https://github.com/OOH-Earth/ooh-earth/issues/130)) ([98679ce](https://github.com/OOH-Earth/ooh-earth/commit/98679cea5b37653b69f392506c77cddb7b092e02))
* **context:** add biodiversity evidence v1 ([#225](https://github.com/OOH-Earth/ooh-earth/issues/225)) ([e95d537](https://github.com/OOH-Earth/ooh-earth/commit/e95d53742e32e37c2a15b0c76867128cba0daea5))
* **context:** add bounded heritage resolver ([#223](https://github.com/OOH-Earth/ooh-earth/issues/223)) ([8c22b1f](https://github.com/OOH-Earth/ooh-earth/commit/8c22b1fe5050cbf30aed6292324883b64695ddc2))
* **context:** add bounded weather resolver ([#224](https://github.com/OOH-Earth/ooh-earth/issues/224)) ([719c607](https://github.com/OOH-Earth/ooh-earth/commit/719c607d3e0fd44a0362b2c1bbf6431acd2d8b31))
* **context:** add location evidence foundation ([#222](https://github.com/OOH-Earth/ooh-earth/issues/222)) ([682849c](https://github.com/OOH-Earth/ooh-earth/commit/682849c37bd69915bd949bdc247f1b39781888b9))
* **data:** pilot useQuery on StoreAdmin, hard-stop on LabAdmin ([#69](https://github.com/OOH-Earth/ooh-earth/issues/69)) ([53bd499](https://github.com/OOH-Earth/ooh-earth/commit/53bd49925cfca5ead6e44b5bbb5f59c2171e1768))
* **evidence:** instrument the re-check funnel to distinguish discovery/start/failure/submission ([#184](https://github.com/OOH-Earth/ooh-earth/issues/184)) ([82d0263](https://github.com/OOH-Earth/ooh-earth/commit/82d026363975ba93e07a15e7c86876b2f220c6a7))
* **field-evidence:** connect Verification Priority Queue to the field-check workflow ([#210](https://github.com/OOH-Earth/ooh-earth/issues/210)) ([f9af5cd](https://github.com/OOH-Earth/ooh-earth/commit/f9af5cd9ad45f64cb529abdf2df55d7aefe0734a))
* **fieldcheck:** honest "Last confirmed" freshness signal on /location/:id ([#119](https://github.com/OOH-Earth/ooh-earth/issues/119)) ([fda8404](https://github.com/OOH-Earth/ooh-earth/commit/fda84047d017b5ddcf2b826ab31222d7ca0e950b))
* **fieldcheck:** wire re-checks into moderation + derive a real "what changed" summary ([#117](https://github.com/OOH-Earth/ooh-earth/issues/117)) ([1fcc253](https://github.com/OOH-Earth/ooh-earth/commit/1fcc2531b2aa7ee31c4d0b12938fa2029116290a))
* **functions:** add deno check type coverage for base44/functions ([#126](https://github.com/OOH-Earth/ooh-earth/issues/126)) ([08279b6](https://github.com/OOH-Earth/ooh-earth/commit/08279b660aaf9f7cc4c282df32b166587dd82f83))
* **gamification:** add generic Brand Explorer / Brand Collector milestone badges ([#110](https://github.com/OOH-Earth/ooh-earth/issues/110)) ([98523a7](https://github.com/OOH-Earth/ooh-earth/commit/98523a762d99c1bd634e44be45b008602b24b7df))
* **gamification:** reward verified re-checks with real XP + badges ([#160](https://github.com/OOH-Earth/ooh-earth/issues/160)) ([a0078f3](https://github.com/OOH-Earth/ooh-earth/commit/a0078f383674de13f25b3111898d4351a305a5cf))
* **gamification:** show live X/Y progress toward locked collector milestones ([#111](https://github.com/OOH-Earth/ooh-earth/issues/111)) ([707b4a2](https://github.com/OOH-Earth/ooh-earth/commit/707b4a2120b582824013d745dfe70bc3352c4838))
* **geo:** add bounded location intelligence queries ([e429721](https://github.com/OOH-Earth/ooh-earth/commit/e429721f25b7809abf3d9ea17eea2cfa032da0d5))
* **geo:** add deterministic duplicate review candidates ([#207](https://github.com/OOH-Earth/ooh-earth/issues/207)) ([3edfd05](https://github.com/OOH-Earth/ooh-earth/commit/3edfd0598c7ce416dc9504bd3694fa6f308c3931))
* **geo:** integrate bounded location intelligence queries ([#209](https://github.com/OOH-Earth/ooh-earth/issues/209)) ([bcf6ef0](https://github.com/OOH-Earth/ooh-earth/commit/bcf6ef067ef0e78c3408c6de29be2837f1cec8bb))
* **geo:** surface geospatial intelligence in a real admin decision surface ([#205](https://github.com/OOH-Earth/ooh-earth/issues/205)) ([09f9093](https://github.com/OOH-Earth/ooh-earth/commit/09f90932b77256b7e6c1f951624e94439800b9e4))
* **geo:** wire spatial duplicate intelligence into ops ([#208](https://github.com/OOH-Earth/ooh-earth/issues/208)) ([11c2508](https://github.com/OOH-Earth/ooh-earth/commit/11c250872ae42e4b3fa4dbd191d14223126e2f82))
* **lab:** migrate LabHub to react-query, defer the bigger NavMenu/LabAccessRoute case ([#134](https://github.com/OOH-Earth/ooh-earth/issues/134)) ([73bec72](https://github.com/OOH-Earth/ooh-earth/commit/73bec7226974924e75963173bab904106a71f1c9))
* **location:** cross-reference ooh_operator against the real MediaCorp registry ([#78](https://github.com/OOH-Earth/ooh-earth/issues/78)) ([dd5e58d](https://github.com/OOH-Earth/ooh-earth/commit/dd5e58d07d192f4f4bd47738a864560a94dfeff1))
* **map:** add My Discoveries layer to /map ([#114](https://github.com/OOH-Earth/ooh-earth/issues/114)) ([e1eef99](https://github.com/OOH-Earth/ooh-earth/commit/e1eef9996abd98bca9c3219ec0a5956e7c36bef0))
* **map:** add report-density Activity Heat layer ([#92](https://github.com/OOH-Earth/ooh-earth/issues/92)) ([f3e896f](https://github.com/OOH-Earth/ooh-earth/commit/f3e896fba9b3d5c5618c8c0e3a870462f9dc2f9c))
* **map:** clicking a heat hotspot opens the nearest report ([#96](https://github.com/OOH-Earth/ooh-earth/issues/96)) ([5877661](https://github.com/OOH-Earth/ooh-earth/commit/587766177f0611872b3e0fa5301c2fadf941b606))
* **map:** highlight a user's own newly-created contribution ([#84](https://github.com/OOH-Earth/ooh-earth/issues/84)) ([33b1522](https://github.com/OOH-Earth/ooh-earth/commit/33b15226354b94d63afe7ac1df1b9a8fc9866eab))
* **map:** make brand and parent corporation searchable/filterable ([#93](https://github.com/OOH-Earth/ooh-earth/issues/93)) ([c447448](https://github.com/OOH-Earth/ooh-earth/commit/c447448956fad433500d7346cc6faf278e8282b8))
* **map:** propagate FieldCheck freshness signal into LocationCard ([#120](https://github.com/OOH-Earth/ooh-earth/issues/120)) ([e8e8b6c](https://github.com/OOH-Earth/ooh-earth/commit/e8e8b6c876cdcf41dcd928cdd2cb40436c890c7b))
* **map:** surface corporate footprint via parent_corp cross-referencing ([#91](https://github.com/OOH-Earth/ooh-earth/issues/91)) ([da16399](https://github.com/OOH-Earth/ooh-earth/commit/da16399a1266c00ad2ab51d418f0cb06c53e7fe6))
* **nav:** lead the primary menu with Tools, add progressive disclosure ([#71](https://github.com/OOH-Earth/ooh-earth/issues/71)) ([30ba3ad](https://github.com/OOH-Earth/ooh-earth/commit/30ba3ade4577d8b976eae4221dde91486af3138f))
* **nft:** connect earned merit badges to the NFT studio ([#98](https://github.com/OOH-Earth/ooh-earth/issues/98)) ([4ca1381](https://github.com/OOH-Earth/ooh-earth/commit/4ca138105fd0dabd8175cf34e36b2769ca0edc1b))
* **observability:** add bounded operational health state ([#157](https://github.com/OOH-Earth/ooh-earth/issues/157)) ([0c7e74c](https://github.com/OOH-Earth/ooh-earth/commit/0c7e74cc1eb9d9dc4e30ffaf9fc9b0a4198061c9))
* **observability:** add production telemetry foundation ([419d1c6](https://github.com/OOH-Earth/ooh-earth/commit/419d1c678486b71e5b4decf97c0709a11da88cda))
* **operative:** add Brands Discovered collection view ([#109](https://github.com/OOH-Earth/ooh-earth/issues/109)) ([a3ebde5](https://github.com/OOH-Earth/ooh-earth/commit/a3ebde55e05ecba0202651a0947d2ee76f641ffa))
* **operative:** add Recent Discoveries intelligence feed to /operative ([#113](https://github.com/OOH-Earth/ooh-earth/issues/113)) ([02f84a1](https://github.com/OOH-Earth/ooh-earth/commit/02f84a1ac13fa60c8916e2ca7380337c4747452a))
* **operative:** add Recently Changed, a platform-wide field intelligence feed ([#124](https://github.com/OOH-Earth/ooh-earth/issues/124)) ([6d359ce](https://github.com/OOH-Earth/ooh-earth/commit/6d359cebff4dce93a05aef3d4263cf8c5f297869))
* **operative:** recognize badges earned since the user's last visit ([#116](https://github.com/OOH-Earth/ooh-earth/issues/116)) ([9ff158b](https://github.com/OOH-Earth/ooh-earth/commit/9ff158b4886bdf657ca5d642cfaddeb4d7be2efe))
* **operative:** surface real FieldCheck re-check activity on /operative ([#123](https://github.com/OOH-Earth/ooh-earth/issues/123)) ([e5aae4f](https://github.com/OOH-Earth/ooh-earth/commit/e5aae4fbb4da100410194c98a10f49ea65c2eca2))
* **platform:** add continuous reliability intelligence ([#177](https://github.com/OOH-Earth/ooh-earth/issues/177)) ([4ff0939](https://github.com/OOH-Earth/ooh-earth/commit/4ff0939f76773fcd4599749238cc9514d5b91acc))
* **platform:** add critical production truth model ([dff000e](https://github.com/OOH-Earth/ooh-earth/commit/dff000e32f9cf57b8e4acda5c61fe310287b177c))
* **platform:** add deterministic JARVIS intelligence ([b1487e6](https://github.com/OOH-Earth/ooh-earth/commit/b1487e654258f3d633acd27a2dadcb947bcac89c))
* **platform:** add Mission Control v1 cockpit ([18a7e0b](https://github.com/OOH-Earth/ooh-earth/commit/18a7e0b806d2ef46e28c8e72268ac095814c8ce0))
* **platform:** add release reliability state machine ([e9dbcfe](https://github.com/OOH-Earth/ooh-earth/commit/e9dbcfe13436055cc6b528bf3c020a63dbb8a379))
* **platform:** add reliability autopilot reasoning ([023fac8](https://github.com/OOH-Earth/ooh-earth/commit/023fac8e51dc8f6c8e3923b88529089f3be568de))
* **platform:** codify transaction integrity and geospatial foundation ([483c747](https://github.com/OOH-Earth/ooh-earth/commit/483c7470ed5745264a20a0051fe195f364cec208))
* **protocol-one:** add Open Graph/Twitter Card metadata for shareable link previews ([#107](https://github.com/OOH-Earth/ooh-earth/issues/107)) ([7c3cd2f](https://github.com/OOH-Earth/ooh-earth/commit/7c3cd2f4b32247aa4b5d935891d178daaefd8b38))
* **protocol-one:** thin static story page over the existing product loop ([#106](https://github.com/OOH-Earth/ooh-earth/issues/106)) ([7c17992](https://github.com/OOH-Earth/ooh-earth/commit/7c1799208529fc0f5d1290bd1fc66361434aa1ab))
* **pwa:** rasterize real app icons, closing KNOWN_ISSUES [#11](https://github.com/OOH-Earth/ooh-earth/issues/11)/[#12](https://github.com/OOH-Earth/ooh-earth/issues/12) ([#131](https://github.com/OOH-Earth/ooh-earth/issues/131)) ([c31984f](https://github.com/OOH-Earth/ooh-earth/commit/c31984f858ce0ec95559f0cadaa5226955bf96fd))
* **release:** publish certified evidence safely ([#180](https://github.com/OOH-Earth/ooh-earth/issues/180)) ([1c6588b](https://github.com/OOH-Earth/ooh-earth/commit/1c6588b1c7ad7064c45554acc67e77c05394ac4f))
* **report:** add Discovery Intelligence panel to the report success screen ([#112](https://github.com/OOH-Earth/ooh-earth/issues/112)) ([ab4db08](https://github.com/OOH-Earth/ooh-earth/commit/ab4db080409d4a5d837b1a313db9241b495ac97b))
* **report:** verify scanAd sector against the advertiser registry at capture time ([#142](https://github.com/OOH-Earth/ooh-earth/issues/142)) ([d24f3b2](https://github.com/OOH-Earth/ooh-earth/commit/d24f3b2bdc49a5c42b3cded03ca93dc5c2476a25))
* **seo:** bake per-route metadata into static HTML for non-JS crawlers ([#102](https://github.com/OOH-Earth/ooh-earth/issues/102)) ([cf8df31](https://github.com/OOH-Earth/ooh-earth/commit/cf8df313225ba7b463bde4c39ac62025806c84c0))
* **share:** add crawler-readable Location cards ([#215](https://github.com/OOH-Earth/ooh-earth/issues/215)) ([b61e15b](https://github.com/OOH-Earth/ooh-earth/commit/b61e15bdac015eedbfeea51b76ef367761070927))


### Bug Fixes

* **a11y:** make CommandCenter's aria-hidden overlay actually inert ([#165](https://github.com/OOH-Earth/ooh-earth/issues/165)) ([01470e1](https://github.com/OOH-Earth/ooh-earth/commit/01470e1881b6b6c62f4fdea15732e4dccfd0e6ea))
* **a11y:** make label-wrapped file-picker controls keyboard-operable ([#72](https://github.com/OOH-Earth/ooh-earth/issues/72)) ([d366499](https://github.com/OOH-Earth/ooh-earth/commit/d366499f3036016b95197e635b738e40fcb2305a))
* **ar:** frame the AR CO2 overlay as an average, not a per-billboard measurement ([#81](https://github.com/OOH-Earth/ooh-earth/issues/81)) ([ed5fca9](https://github.com/OOH-Earth/ooh-earth/commit/ed5fca9801d67e3747afb7bb2deed28c20b4ba50))
* **ar:** give a filed AR report a way back into the product ([#83](https://github.com/OOH-Earth/ooh-earth/issues/83)) ([5b85b32](https://github.com/OOH-Earth/ooh-earth/commit/5b85b32566ff990097d31f46d05cad9ea0179d94))
* **auth:** prevent invalid token login redirect loop ([#104](https://github.com/OOH-Earth/ooh-earth/issues/104)) ([3241ace](https://github.com/OOH-Earth/ooh-earth/commit/3241aced8a0d2cd12190dcae97fb1f39ac15fe52))
* **ci:** give gh workflow run explicit repo context in release-please.yml ([#70](https://github.com/OOH-Earth/ooh-earth/issues/70)) ([7bbc797](https://github.com/OOH-Earth/ooh-earth/commit/7bbc79789a34017d1b01b62fa59afe43feae15d3))
* **evidence:** label rejected field checks, drop dead checked_by, add freshness/change tests ([#181](https://github.com/OOH-Earth/ooh-earth/issues/181)) ([9d6573a](https://github.com/OOH-Earth/ooh-earth/commit/9d6573ab97e3d647acacf956ec0e6e3ab69d1879))
* **functions:** accept scanAd's real base44.app upload URL shape ([#144](https://github.com/OOH-Earth/ooh-earth/issues/144)) ([516f7b7](https://github.com/OOH-Earth/ooh-earth/commit/516f7b72a34c8238827ff6134317db83ea4564c6))
* **functions:** cache fieldStats/cryptoWatch/fetchMapLocations instead of a per-IP throttle (R-05) ([#127](https://github.com/OOH-Earth/ooh-earth/issues/127)) ([89090aa](https://github.com/OOH-Earth/ooh-earth/commit/89090aa55266a1f56c09f0b007946ab65ca53251))
* **functions:** harden checkout rewards and account controls ([f72c39c](https://github.com/OOH-Earth/ooh-earth/commit/f72c39ce6c6d08d3f86e09828679d1e945729272))
* **functions:** harden mutation and webhook paths ([076cbf9](https://github.com/OOH-Earth/ooh-earth/commit/076cbf96aee8fc22977cf9777f9365e9acdc9cdd))
* **functions:** remove unused handler imports ([dc54e62](https://github.com/OOH-Earth/ooh-earth/commit/dc54e6248395f36bd6131853d77ae7fbc41d934e))
* **globe:** restore the space-fog/atmosphere effect via setSky() ([#167](https://github.com/OOH-Earth/ooh-earth/issues/167)) ([63eabfb](https://github.com/OOH-Earth/ooh-earth/commit/63eabfb8b8f7d53508509d060889e0a27df40ea3))
* **map:** avoid unsupported dateline query operator ([13b9cf8](https://github.com/OOH-Earth/ooh-earth/commit/13b9cf8311a157f6109942f86fb93df80696204d))
* **media:** surface and retry partial Location photo uploads ([1be7f04](https://github.com/OOH-Earth/ooh-earth/commit/1be7f04a0399592ca02c2375253c7588122e31cc))
* **mobile:** clear the fixed bottom nav from SiteFooter's last content ([#67](https://github.com/OOH-Earth/ooh-earth/issues/67)) ([0b36a9e](https://github.com/OOH-Earth/ooh-earth/commit/0b36a9e86af3e2e3028a71ab61a2afd85f342286))
* **mobile:** stabilize auth, location layout and sharing ([8158bf5](https://github.com/OOH-Earth/ooh-earth/commit/8158bf5740da265845b482701505d5afc5a0300f))
* **nft:** surface AI-generate failures, stop overclaiming "Mint on Zora" ([#77](https://github.com/OOH-Earth/ooh-earth/issues/77)) ([723cc29](https://github.com/OOH-Earth/ooh-earth/commit/723cc29d424b207cd6207fe13653e0c773987326))
* **observability:** accept valid empty map reads ([25b6f06](https://github.com/OOH-Earth/ooh-earth/commit/25b6f0690b4043c7b5f43bcd1aa9a8241466766c))
* **observability:** keep operational health bundles self-contained ([#159](https://github.com/OOH-Earth/ooh-earth/issues/159)) ([368a898](https://github.com/OOH-Earth/ooh-earth/commit/368a8982303db78f8fb0fb4af244b413af28a02a))
* **observability:** keep telemetry bundles self-contained ([a045074](https://github.com/OOH-Earth/ooh-earth/commit/a045074fb1c06d8ba5fcea6dd4dddc5115a28fe4))
* **observability:** route fieldStats through telemetry handler ([35b8ba3](https://github.com/OOH-Earth/ooh-earth/commit/35b8ba33388f5337d16e959ee04b5743037e55f5))
* **offline:** preserve captures after sync retry exhaustion ([#176](https://github.com/OOH-Earth/ooh-earth/issues/176)) ([dcfe176](https://github.com/OOH-Earth/ooh-earth/commit/dcfe1768cb24ea09c03fa4ef5deb4227ff73eff3))
* **operative:** differentiate Recent Discoveries cards and fix milestone track relevance ([#115](https://github.com/OOH-Earth/ooh-earth/issues/115)) ([6d63e86](https://github.com/OOH-Earth/ooh-earth/commit/6d63e8664d7657680c77eb6081d5ba0c872e5e4c))
* **ops:** make the Ops Console's function-probe outcomes truthful ([#171](https://github.com/OOH-Earth/ooh-earth/issues/171)) ([3bedd4b](https://github.com/OOH-Earth/ooh-earth/commit/3bedd4b7c07ccfa7535cbd3b2869ba9f7f789de6))
* **payments:** add durable Stripe webhook ledger ([bd1832e](https://github.com/OOH-Earth/ooh-earth/commit/bd1832e98a1c74d1be8d02869697d889f8616fbb))
* **perf:** add justified staleTime to LocationDetail's location query ([#169](https://github.com/OOH-Earth/ooh-earth/issues/169)) ([185295e](https://github.com/OOH-Earth/ooh-earth/commit/185295ed2a9b3a6095fa220b731ac90f88e30fdb))
* **platform:** deterministic preflight guard for Base44 entity deployment ([#196](https://github.com/OOH-Earth/ooh-earth/issues/196)) ([245daf4](https://github.com/OOH-Earth/ooh-earth/commit/245daf419fc91276503c19d4843c55aac3dac25d))
* **platform:** include certified public smoke evidence ([aa58b9d](https://github.com/OOH-Earth/ooh-earth/commit/aa58b9d10785072f255546f9fba9950b9de0fe6d))
* **platform:** make autopilot health functions deployable ([91f2d59](https://github.com/OOH-Earth/ooh-earth/commit/91f2d59e84aef23a10fe43011b7b5911dedf8f1d))
* **portals:** disclose sample-data fallback on the adbusting/graffiti discovery portals ([#79](https://github.com/OOH-Earth/ooh-earth/issues/79)) ([b76b504](https://github.com/OOH-Earth/ooh-earth/commit/b76b504d865ebbec37cb30d8a739b4f51d7716b7))
* **privacy:** strip metadata from field evidence uploads ([#178](https://github.com/OOH-Earth/ooh-earth/issues/178)) ([4cddb2b](https://github.com/OOH-Earth/ooh-earth/commit/4cddb2b3b079cf7ae5679dc00695413000bfbe90))
* **release:** synchronize published manifest artifact ([e07b752](https://github.com/OOH-Earth/ooh-earth/commit/e07b752c0fcc1502eab0b00e0beb47e63f1049ce))
* **report:** stop Step 2 from silently re-running Step 1's AI scan ([#74](https://github.com/OOH-Earth/ooh-earth/issues/74)) ([a4de958](https://github.com/OOH-Earth/ooh-earth/commit/a4de958e0dc788c15e22ff9d733f25023136987e))
* restore canonical dashboard and social share links ([#122](https://github.com/OOH-Earth/ooh-earth/issues/122)) ([1887386](https://github.com/OOH-Earth/ooh-earth/commit/1887386daaf9811b6a5591c71eb5849a72b39562))
* **security:** close moderation-bypass via forged status on evidence entities ([#200](https://github.com/OOH-Earth/ooh-earth/issues/200)) ([1d9f4a2](https://github.com/OOH-Earth/ooh-earth/commit/1d9f4a20b71814cf2a2e2f29e8a30b4b59de7208))
* **security:** lock role/access/agency to admin-only writes on User entity ([#185](https://github.com/OOH-Earth/ooh-earth/issues/185)) ([c8adae5](https://github.com/OOH-Earth/ooh-earth/commit/c8adae5d2122cde65c9b0006bfc1727613901be0))
* **seo:** add 11 missing route-metadata entries, fix sitemap/robots gaps ([#137](https://github.com/OOH-Earth/ooh-earth/issues/137)) ([1367cb5](https://github.com/OOH-Earth/ooh-earth/commit/1367cb5b6c993e11186982c8cd10f5d7bf3c6310))
* **share:** allow human redirect under CSP ([#218](https://github.com/OOH-Earth/ooh-earth/issues/218)) ([d62ce44](https://github.com/OOH-Earth/ooh-earth/commit/d62ce441a7834932f39bc2149e47a86d24573327))
* **share:** classify malformed ids as not found ([#219](https://github.com/OOH-Earth/ooh-earth/issues/219)) ([45b6ee7](https://github.com/OOH-Earth/ooh-earth/commit/45b6ee7b146fcb7450f251560e56fa80b9dd98a4))
* **share:** classify missing locations as not found ([d7213cb](https://github.com/OOH-Earth/ooh-earth/commit/d7213cbb20d7af61693d22cf762d9750d2557655))
* **share:** correct Base44 function entry path ([#216](https://github.com/OOH-Earth/ooh-earth/issues/216)) ([a7ed00c](https://github.com/OOH-Earth/ooh-earth/commit/a7ed00c56ae228de44154ee2ffab20123d6a5cb7))
* **status:** consolidate duplicated status-color logic, fix rejected/verified badge collision ([#76](https://github.com/OOH-Earth/ooh-earth/issues/76)) ([3b5d73f](https://github.com/OOH-Earth/ooh-earth/commit/3b5d73f24cde90e230cc4ce36127c16535353db8))
* **toast:** wire the missing close-button dismiss handler ([#118](https://github.com/OOH-Earth/ooh-earth/issues/118)) ([9ea817d](https://github.com/OOH-Earth/ooh-earth/commit/9ea817d6abb2406652a695256009ac2aa202fdf4))
* **ui:** stop CommandCenter's closed state from trapping GraffitiCamera ([#73](https://github.com/OOH-Earth/ooh-earth/issues/73)) ([0338c8c](https://github.com/OOH-Earth/ooh-earth/commit/0338c8c3bfb1aa272f8acb0339e32e11d8baf395))
* **ux:** improve field log cards and readable profile type ([bebfee0](https://github.com/OOH-Earth/ooh-earth/commit/bebfee0560cc502d8ec2dc52fe0554e3b315a22a))


### Performance Improvements

* **app:** reduce frontend payload and repeated data work ([502d96a](https://github.com/OOH-Earth/ooh-earth/commit/502d96a0ffe92d6890775900ed12fdb7bf731cab))
* **bundle:** lazy-load CommandCenter to shrink the eager initial chunk ([#170](https://github.com/OOH-Earth/ooh-earth/issues/170)) ([3af6e44](https://github.com/OOH-Earth/ooh-earth/commit/3af6e447945fd92ae9f2beb48f5986f3c42ccb98))
* **map:** bound viewport retrieval and offline submissions ([f9170eb](https://github.com/OOH-Earth/ooh-earth/commit/f9170ebdb4d469a5a3a3b5879958ab8c2f31dc89))
* **react-query:** migrate BusStopDetail off raw useEffect fetch ([#172](https://github.com/OOH-Earth/ooh-earth/issues/172)) ([567e1f7](https://github.com/OOH-Earth/ooh-earth/commit/567e1f7c191ced36ddc59a462a14689e284eddd9))
* **react-query:** migrate FieldId off raw useEffect fetch ([#168](https://github.com/OOH-Earth/ooh-earth/issues/168)) ([938f972](https://github.com/OOH-Earth/ooh-earth/commit/938f972305c2b1c42e4fbd63330a1c0d27553946))
* **react-query:** migrate LocationDetail off raw useEffect fetch ([#166](https://github.com/OOH-Earth/ooh-earth/issues/166)) ([3083bf7](https://github.com/OOH-Earth/ooh-earth/commit/3083bf70284ec08358b0159cbad07f5353670586))

## [1.2.0](https://github.com/OOH-Earth/ooh-earth/compare/v1.1.0...v1.2.0) (2026-08-13)


### Features

* **location:** use original report photo as before/after baseline ([#56](https://github.com/OOH-Earth/ooh-earth/issues/56)) ([6e8eea1](https://github.com/OOH-Earth/ooh-earth/commit/6e8eea166c8f41bec394b46acbdc4562447834dc))
* **map:** spotlight locations with verified before/after evidence ([#59](https://github.com/OOH-Earth/ooh-earth/issues/59)) ([c45f819](https://github.com/OOH-Earth/ooh-earth/commit/c45f819008a3a8e885ed5af03fb52073cca55390))


### Performance Improvements

* **fonts:** load Google Fonts asynchronously to unblock first paint ([#58](https://github.com/OOH-Earth/ooh-earth/issues/58)) ([2590416](https://github.com/OOH-Earth/ooh-earth/commit/259041694655c11776637072bbfb3ba928208702))

## [1.1.0](https://github.com/OOH-Earth/ooh-earth/compare/v1.0.0...v1.1.0) (2026-08-12)


### Features

* **field-check:** AI condition scan in the revisit flow ([#53](https://github.com/OOH-Earth/ooh-earth/issues/53)) ([0c1f0be](https://github.com/OOH-Earth/ooh-earth/commit/0c1f0bed9d255084adb523255e1c18d1fcf9d6e4))
* **leadClaim:** move LeadClaim.create behind a validated server function ([#40](https://github.com/OOH-Earth/ooh-earth/issues/40)) ([f0c282d](https://github.com/OOH-Earth/ooh-earth/commit/f0c282d18e36d39521bb1db2efeca9429ace1143))


### Bug Fixes

* **security:** client-side validation on all real photo-upload sites ([#50](https://github.com/OOH-Earth/ooh-earth/issues/50)) ([0cb676a](https://github.com/OOH-Earth/ooh-earth/commit/0cb676acab82f1899d5df80fe6c9651f1682a2bf))
* **security:** close incomplete HTML sanitization + double-escape bugs ([#48](https://github.com/OOH-Earth/ooh-earth/issues/48)) ([4e97ed6](https://github.com/OOH-Earth/ooh-earth/commit/4e97ed6a6efcbf97fc4a84884e39231dc035a23f))
* **security:** remove unused react-quill/quill ([#41](https://github.com/OOH-Earth/ooh-earth/issues/41)) ([7a1e54d](https://github.com/OOH-Earth/ooh-earth/commit/7a1e54d08762eff19fda4fec7bca4eb54a694950))
* **telemetry:** correct cancelled-flag typo in TelemetryBar air-quality effect ([#54](https://github.com/OOH-Earth/ooh-earth/issues/54)) ([7774b4b](https://github.com/OOH-Earth/ooh-earth/commit/7774b4b6ff1ecbedf81e09e607f30fd7cd367226))


### Performance Improvements

* **home:** lazy-load below-the-fold sections, cut entry chunk 27% ([#46](https://github.com/OOH-Earth/ooh-earth/issues/46)) ([135777e](https://github.com/OOH-Earth/ooh-earth/commit/135777ec4baeded45062f0f9aba00d31751b4f22))

## 1.0.0 (2026-08-12)


### Features

* establish production engineering foundation ([#1](https://github.com/OOH-Earth/ooh-earth/issues/1)) ([b3c4c38](https://github.com/OOH-Earth/ooh-earth/commit/b3c4c388b919a7bcdf0186a118f17e591c7e7fa8))


### Bug Fixes

* **types:** bump framer-motion to 12.43.0, fix Variants type break ([#27](https://github.com/OOH-Earth/ooh-earth/issues/27)) ([c16ccfe](https://github.com/OOH-Earth/ooh-earth/commit/c16ccfee89c269758772853286708ee442687ce1))

## 2026-08-01 — Lab: OE-1K/66 Streetrunner (Akira-class concept bike)

- New Lab project at `/lab/streetrunner` (`LabStreetRunner.jsx`): an **original** Akira-class field-bike concept in our Orbital Perspective palette (genre references only: Katalis × Machine56 EV-1K/56, Akira — not reproduced). One SVG geometry, three treatments via an interactive build-up stepper — **01 vector → 02 blueprint → 03 3D concept render** — plus a rebranded concept spec sheet. Route + `LabHub` tile (`Bike` icon) wired.
- Hub tile now **self-surfaces on main** via a built-in default in `LabHub` (no DB record needed); a real `LabPrototype` row via `/lab/admin` still takes precedence.
- Added a **Roadmap** section (hero render, livery variants, exploded view, poster) as scaffolding for the next design passes.
- **Lab project registry + auto-provisioning** — new `labProjects.js` is the single source of truth for code-defined Lab projects. The **Control Console (`/lab/admin`) auto-provisions** a `LabPrototype` record for any registry project missing one on load, so new Lab pages appear in the control panel automatically and stay togglable (access / status / visible). The hub reads the same registry. Adding a project is now: page + route + one registry line.
- **Fix (visible toggle):** the hub's registry fallback checked the *visible-filtered* list, so a project set to `visible: off` in the console got re-added from the registry and stayed on the hub. It now falls back only when **no record exists at all** — so access / status / visible from the console sync correctly for every registry project, current and future.

## 2026-08-01 — Hero dispatch panel + licence placement

- **Hero dispatch reworked** — the `// Field dispatch` + open-source/copyleft/licence lines were overlapping the corner reticle (desktop) and the console card + “Descend” cue (mobile). Rebuilt as a bordered HUD panel (backdrop-blur), lifted clear of the bracket, **desktop-only**. `LicenseMark` simplified to a clean block (ethos line + micro licence line — no superscript collision).
- **Licence in the footer** — added `AGPL-3.0 · CC BY-SA 4.0` to the footer © line, so mobile keeps the licence and it sits in the natural place.
- **Mobile dispatch restored** — the desktop-only panel left mobile with nothing; added an in-flow mobile version (below the console, above “Descend”) that shows on mobile without overlapping.
- **Globe header (orbital atlas) reworked** — stacked the title + `global surveillance grid` / spots / `cluster intel` sublabels vertically so they no longer collide, and gave the “Open field map” button a backdrop. (BACKUP also: dropped the redundant standalone surveillance-grid label from `Globe3D`.)

## 2026-08-01 — Removed “No VC” credential copy

- Stripped the “No VC” / “zero VC” / “Zero VC by design” lines from `LicenseMark`, `AuthShell` (trust list), `Plans`, `Store`, and the gated-page footers (`CapitalLead`, `Console`, `InvestorHub`). Separators cleaned — no dangling middots.
- Held (flagged for a call): the `anti-VC` ethos statements in `README.md` and the journey personas (`panelsB.js` ×2) — structural-ethos framing, not marketing badges.

## 2026-08-01 — Brandmark symbol placed across the site

- **Footer** (`SiteFooter`, global — 25 pages) now shows the **animated brandmark symbol only** (was a wordmark lockup), h-16→h-20. Symbol spins; tagline line kept below.
- **Auth screens** (`AuthShell` — login / register / reset / plans) gained the symbol beside the “OOH EARTH” wordmark in the header.
- **404** (`PageNotFound`) rebranded from the stock light-theme scaffold to Orbital Perspective (void / ozone / flare) — animated symbol as centrepiece, “Signal lost / Off the map”, and “Return to base” + “Open field map” actions. Admin note + auth check preserved.
- **Hero** — the animated symbol now crowns the `oohearth.app` wordmark (mark-over-wordmark lockup, h-14→h-20 with glow).
- **Field Pulse** — removed the FUNDED / amount-raised item from the ticker.
- **Beta tag** — new `BetaTag` (flare chip + blinking dot + tooltip) sits beside the symbol in the header, hero, footer, and auth screens to signal public beta / early access.
- **Licence dispatch** — new `LicenseMark` in the hero dispatch area: “Open source · Copyleft · Community-funded · No VC” with the licence pair (AGPL-3.0 · CC BY-SA 4.0) set in superscript, like a rights mark.
- Symbol-only throughout (`BrandMark`), consistent with the masthead.

## 2026-08-01 — Field Pulse reweighted to the movement (since 2012)

- **Orbital-atlas Field Pulse** (`FieldStatsHud`) now opens with a clearly-tagged **movement-wide estimate** of global subvertising since 2012 — ~5K+ subverters, ~50K+ interventions, 40+ collectives, 25+ countries, 14 yrs. Every figure carries an `EST` tag and sits under a `MOVEMENT · EST · SINCE 2012` divider, visually separated from our own numbers.
- **Platform honesty preserved** — our live counts still come from the audited `fieldStats` (confirmed-only, no inflation), now under an `OOH EARTH · LIVE PLATFORM` divider followed by an `EARLY ACCESS · FOUNDING BACKERS SOUGHT` status chip, so day-one platform scale is never mistaken for movement scale.
- **`movementEstimate.js`** — single documented source of truth for the estimate (method + provenance in-file: Brandalism 2012, Subvertisers Intl, Adfree Cities, Les Déboulonneurs, Adbusters, independents). Tune the numbers in one place.
- **Operative Network** section gained an honest movement-context caption beneath the live tally (“day-one platform … the wider resistance is not new”).
- **Estimate tuned & sourced** — figures dialled to conservative, verifiable numbers after checking anchors (Brandalism 2012 first drop 30+ boards/5 cities; COP21 2015 = 82 artists, 19 countries, ~600 subverts; Adfree Cities founded 2017). Now ~3K+ subverters, ~25K+ interventions, 30+ collectives, 20+ countries. Added `MOVEMENT_ANCHORS` (sourced milestones).
- **Investor + Campaign context** — `MovementContext` (Tailwind) added to `/campaign`; a matching `inv-`styled “Not starting from zero” section added to `/investor`. Both restate the day-one / founding-backers status beside the sourced movement estimate, driven by the one shared module.

## 2026-08-01 — Y2K logo system wired in (live)

- **New brandmark** — `BrandMark.jsx` reworked from the abstract orbit into the Y2K wireframe globe + tilted orbital ring + satellite node (Orbital Perspective). Same `{ className }` / 32-viewBox API, so all four consumers (Nav, Field-ID cards, NFC card, UI kit) render unchanged; keeps the rotating-orbit animation via an `animate` prop (default on).
- **Header now carries the logo** — the top-left home link was a generic `Gauge` icon; swapped for `<BrandMark/>`. First time the actual mark appears in the masthead.
- **Favicon + apple-touch** upgraded (inline data-URI, no network cost) from the crosshair-globe to the wireframe globe + orange orbit node; apple-touch gets a rounded tile.
- **PWA manifest** — added `public/manifest.json` (the `/manifest.json` link was 404ing); icon → `/brand/oohearth-mark.svg` (`any maskable`). `public/` confirmed copied into `dist/`.
- **Brand component library** (additive) — `src/components/ooh/brand/`: `OohEmblem`, `OohWordmark`, `AdFreeStreetsBadge` — theme-aware (ozone/flare tokens) for hero, share cards, and the `/kit` brand guide.
- **Orbitron** display face added to the Google-Fonts link (wordmark type).
- Proven on BACKUP first (vite build exit 0), then promoted to main (vite build exit 0). Full downloadable kit (SVG/PNG/favicon/.ico) is delivered outside the repo.

## 2026-07-28 — OOH Radio Ops (scaffolding, shipped dark)

- **Radio Ops architecture decided** — self-hosted AzuraCast (open-source) on our own VPS as the broadcast engine; the app stays a thin client that points at one Icecast stream URL. Not a rented service; not a from-scratch streaming server. Full runbook: `RADIO-SELF-HOST-RUNBOOK.md`; strategy: `OOH-Radio-Ops-Plan.md`.
- **`src/lib/radioOps.js`** — single control file. Empty `AZURACAST_BASE` + `OOH_STREAM_URL` keep `RADIO_OPS_ENABLED=false`, so the whole feature is inert until configured (nothing appears, no polling). Includes `fetchNowPlaying()` normaliser for the AzuraCast now-playing API.
- **`radioContext.jsx`** — merges the OOH broadcast channel into the *player list only* (RADIO_STATIONS untouched, so map/globe are unaffected); polls now-playing every 15s while OOH Radio is on air.
- **`RadioMiniPlayer.jsx`** — shows current track under the station name + ● LIVE badge during live DJ sets.
- **`RadioOps.jsx` + `/radio-ops` route (protected)** — read-only ops dashboard (on-air, listeners, up-next, recent history, progress, "Manage in AzuraCast"), Orbital Perspective styling. Shows a clean "not connected" state until configured.
- Build verified green (vite build exit 0). Ships dark — no live UI change until the two URLs are pasted.

## 2026-07-27 — Pre-launch sweep

- **Page-top migration** — all top-level pages migrated from `pt-24/pt-28` → `.page-top` utility (Support, Plans, Careers, Report, Campaign, TrueCost, TrashId, BusStops, LocationDetail, BusStopDetail, Dashboard, Zora). Safe-area-inset-top now clears notched/dynamic-island devices everywhere.
- **Sub-nav safe-area fix** — Guides, FieldId, UiKit fixed sub-navs + content padding now use `calc(Npx + env(safe-area-inset-top))` so they don't slip under the nav on notched devices. UiKit sticky sidebar height also adjusted.
- **SuperCard stats** — stale "50 Sites logged" corrected to "755+" (post-London import).
- **SEO / index.html** — added canonical URL, `og:url`, apple-touch-icon, apple-mobile-web-app-capable + status-bar-style meta tags.
- **Radio visualizer (mobile)** — refactored to two-element architecture (playback + muted analysis) so real FFT data renders on iOS without silencing non-CORS streams; AudioContext created lazily inside first user gesture per mobile autoplay policy.
- **Stripe checkout** — verified: iframe blocking on `StripeDonate`, `metadata.base44_app_id` on both `createDonationCheckout` and `createProductCheckout`, allowed-origin whitelist, server-authoritative price lookup on product checkout.
- **Hero video** — confirmed `autoPlay muted loop playsInline` (no click-to-play facade needed for ambient bg video).
- **Mobile bottom tabs** — confirmed `env(safe-area-inset-bottom)` on nav + body padding.
- **Accessibility** — focus-visible rings, `prefers-reduced-motion` disables parallax/CRT/matrix, TypeEnhancer + ReadAloudToggle all confirmed.

## Pre-launch checklist — needs to verify

### Layout / mobile
- [x] Migrate every top-level page `<main>` from `pt-24/pt-28` → `.page-top` — done Jul 27 (all pages + sub-nav safe-area fixes).
- [x] Confirm bottom content clears the mobile tab bar (`pb-24`+ on scrollable pages).
- [x] Verify `env(safe-area-inset-bottom)` on body + tab bar for home-indicator devices.
- [x] Map page: bottom tabs visible above map on both Leaflet + Globe views (isolate fix).
- [x] NavMenu full-screen launcher fills viewport on small + large phones (portal fix).

### Payments / treasury
- [x] Stripe checkout: block inside preview iframe; gate to published app only.
- [x] Stripe `metadata.base44_app_id` set on every checkout session.
- [ ] Resolve USDC.e vs native USDC on the crypto funding panel.
- [x] Treasury balance read-only display accurate; no private-key paste surfaces.

### Data / security
- [x] RLS: Location & DigitalBust — create/read open for public field reports; update/delete admin-only. Confirmed no open writes.
- [x] LeadClaim / FundingLead create open; admin-only mutations.
- [x] `SendEmail` only reaches registered app users — external addresses rejected. Use invitations for non-registered recipients.

### Native / HTTPS-gated features
- [ ] TrueCost + Trash ID camera scan — requires full HTTPS deployment; blocked in preview iframe. Test after publish. _(cannot verify in preview)_
- [ ] NFC Field Card — verify on real device post-publish. _(cannot verify in preview)_
- [x] Geolocation prompt + user-loc marker on Map (ArLens + Map both use `navigator.geolocation`).

### Accessibility
- [x] TypeEnhancer (text-size) works across pages.
- [x] Read-aloud toggle off by default; triggers only on demand.
- [x] Focus-visible rings on all interactive elements.
- [x] `prefers-reduced-motion` disables parallax / CRT flicker / matrix scanlines.

### Performance / SEO
- [x] Hero video: muted, loop, `playsInline`, no autoplay of content video (click-to-play facades).
- [x] index.html: title, meta description, Open Graph, favicon, canonical URL, apple-touch-icon set before publish.
- [x] Map clustering handles 500+ markers smoothly.

### Polish
- [x] Theme toggle persists (dark / light / matrix) across reloads.
- [ ] Cognitive toggles (haptics/sound/read-aloud) desktop-only — confirm intended mobile hide.
- [x] Pull-to-refresh on Dashboard (Map is canvas-based, not scrollable).
- [x] Walkthrough tours registered on Home + Map.

## Notes
- Keep this file updated with each shipped change so the launch changelog is ready.
- Dead-ends (do not retry): backend fetch of oohearth.app (bot-blocked), full-screen overlay menu, Enter-the-Void title sequence, predator-rune logo, private-key paste.

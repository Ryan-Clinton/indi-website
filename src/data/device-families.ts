// Hand-kept additions to the device search on the home page.
// Most devices come from the INDI driver lists and the libgphoto2 camera list at build time
// (see src/lib/devices.ts). This file covers what those lists cannot answer by name.

export type Family = {
  /** Shown in the suggestions and in the answer */
  name: string;
  kind: string;
  /** The INDI driver to pick in your client */
  driver: string;
  /** Tested against the visitor's text: lowercase, with every non letter or digit turned into a space */
  match: RegExp;
};

// One driver serves every model of these brands, so the driver lists name the brand, not the models.
export const FAMILIES: Family[] = [
  // Cameras with a vendor SDK
  { name: "ZWO ASI cameras (all models)", kind: "Camera", driver: "ZWO CCD", match: /\bzwo\b|\basi ?\d{3,4}/ },
  { name: "QHYCCD cameras (all models)", kind: "Camera", driver: "QHY CCD", match: /\bqhy/ },
  { name: "Player One cameras (all models)", kind: "Camera", driver: "PlayerOne CCD", match: /\bplayer ?one\b|\b(poseidon|ares|neptune|xena|ceres|zeus|apollo)\b/ },
  { name: "Atik cameras (all models)", kind: "Camera", driver: "Atik CCD", match: /\batik\b/ },
  { name: "Starlight Xpress cameras (all models)", kind: "Camera", driver: "SX CCD", match: /starlight ?x ?press|\b(lodestar|trius|ultrastar|superstar|costar)\b/ },
  { name: "FLI cameras (all models)", kind: "Camera", driver: "FLI CCD", match: /\bfli\b|finger ?lakes|\b(microline|proline|kepler)\b/ },
  { name: "Moravian cameras (all models)", kind: "Camera", driver: "MI CCD (USB)", match: /\bmoravian\b|\bg[0-4] \d{3,5}\b|\bc[1-5]x? \d{4,6}\b/ },
  { name: "SBIG cameras (all models)", kind: "Camera", driver: "SBIG CCD", match: /\bsbig\b|\bst[fxti]? ?\d{3,5}\b/ },
  { name: "QSI cameras (all models)", kind: "Camera", driver: "QSI CCD", match: /\bqsi\b/ },
  { name: "Apogee cameras (all models)", kind: "Camera", driver: "Apogee CCD", match: /\bapogee\b|\b(alta|aspen) ?[ufg]?\d/ },
  { name: "SVBONY cameras", kind: "Camera", driver: "SVBONY CCD or SVbonycam", match: /\bsv ?(105|205|305|405|505|605|705|905)/ },
  // Brands built on the ToupTek SDK
  { name: "ToupTek cameras (all models)", kind: "Camera", driver: "Toupcam", match: /\btoup ?(tek|cam)\b/ },
  { name: "Altair cameras (all models)", kind: "Camera", driver: "Altair", match: /\baltair\b/ },
  { name: "OGMA cameras (all models)", kind: "Camera", driver: "Ogmacam", match: /\bogma/ },
  { name: "TS Optics cameras (all models)", kind: "Camera", driver: "Tscam", match: /\btscam\b|\bteleskop\b/ },
  { name: "Orion StarShoot G cameras", kind: "Camera", driver: "StarShootG", match: /starshoot ?g|\bssg ?\d/ },
  { name: "Risingcam cameras (all models)", kind: "Camera", driver: "Nncam", match: /\brising ?cam\b|\bnncam\b/ },
  { name: "MallinCam cameras (all models)", kind: "Camera", driver: "Mallincam", match: /\bmallin ?cam\b/ },
  { name: "Omegon veTEC and guideCAM cameras", kind: "Camera", driver: "OmegonPro", match: /\b(vetec|guidecam|omegon ?procam)\b/ },
  { name: "Meade LPI-G cameras", kind: "Camera", driver: "Meadecam", match: /\blpi ?g\b/ },
  // Pentax has its own driver (PkTriggerCord and the Ricoh SDK), not gphoto
  { name: "Pentax K series DSLRs", kind: "DSLR / mirrorless camera", driver: "Pentax DSLR Native", match: /\bpentax ?k ?(\d|p\b|s ?\d|r\b|x\b)/ },
  // Cameras through Linux drivers
  { name: "Raspberry Pi cameras", kind: "Camera", driver: "LibCamera", match: /\braspberry\b|\bpi ?(hq|camera|cam|global)\b|\bimx ?\d{3}\b/ },
  { name: "USB webcams (UVC)", kind: "Camera", driver: "V4L2 CCD", match: /\bwebcam|\buvc\b|\blogitech\b/ },

  // Mounts that the driver lists name by protocol, not by model
  { name: "Sky-Watcher equatorial mounts (EQ3 to EQ8, HEQ5, AZ-EQ5/6, Star Adventurer GTi)", kind: "Mount", driver: "EQMod Mount", match: /\b(n?eq ?[3568]|heq ?5|eq ?6 ?r|eq ?8 ?r?|az ?eq ?[56]|eqm ?35|cq ?350|star ?adventurer ?gti)\b/ },
  { name: "Orion Atlas and Sirius mounts", kind: "Mount", driver: "EQMod Mount", match: /\b(atlas|sirius) ?(pro|eq)\b|\borion ?(atlas|sirius|hdx ?110)\b/ },
  { name: "Celestron mounts (NexStar, AVX, CGEM, CGX, CPC, Evolution)", kind: "Mount", driver: "Celestron AUX or Celestron NexStar HC", match: /\b(nexstar|avx|cgem|cgx|cge ?pro|cpc|evolution)\b/ },
  { name: "10Micron mounts (GM1000 to GM4000)", kind: "Mount", driver: "LX200 10micron", match: /\b10 ?micron\b|\bgm ?(1000|2000|3000|4000)/ },
  { name: "Astro-Physics mounts (Mach1, Mach2, GTO)", kind: "Mount", driver: "AstroPhysics V2", match: /\bastro ?physics\b|\bmach ?[12]\b|\bgto\b/ },
  { name: "Losmandy mounts (G11, GM8 with Gemini)", kind: "Mount", driver: "Losmandy Gemini", match: /\blosmandy\b|\bgm ?8\b/ },
  { name: "Takahashi mounts with Temma", kind: "Mount", driver: "Temma Takahashi", match: /\btakahashi\b|\btemma\b|\bem ?(11|200|400|500)\b/ },
  { name: "OnStep and OnStepX controllers", kind: "Mount", driver: "LX200 OnStep", match: /\bonstep ?x?\b/ },
];

// Other names for the same camera. libgphoto2 lists some of these, but not all.
// Each line is one camera. When libgphoto2 knows any name on a line, all of them are added,
// and the first name on the line is the one shown.
// Names are compared without spaces, dashes or case, and without the brand.
export const CAMERA_ALIASES: string[][] = [
  // Canon: international, US (Rebel) and Japan (Kiss) names
  ["EOS 300D", "EOS Digital Rebel", "EOS Kiss Digital"],
  ["EOS 350D", "EOS Rebel XT", "EOS Kiss Digital N"],
  ["EOS 400D", "EOS Rebel XTi", "EOS Kiss Digital X"],
  ["EOS 450D", "EOS Rebel XSi", "EOS Kiss X2"],
  ["EOS 1000D", "EOS Rebel XS", "EOS Kiss F"],
  ["EOS 500D", "EOS Rebel T1i", "EOS Kiss X3"],
  ["EOS 550D", "EOS Rebel T2i", "EOS Kiss X4"],
  ["EOS 600D", "EOS Rebel T3i", "EOS Kiss X5"],
  ["EOS 1100D", "EOS Rebel T3", "EOS Kiss X50"],
  ["EOS 650D", "EOS Rebel T4i", "EOS Kiss X6i"],
  ["EOS 700D", "EOS Rebel T5i", "EOS Kiss X7i"],
  ["EOS 100D", "EOS Rebel SL1", "EOS Kiss X7"],
  ["EOS 1200D", "EOS Rebel T5", "EOS Kiss X70"],
  ["EOS 750D", "EOS Rebel T6i", "EOS Kiss X8i"],
  ["EOS 760D", "EOS Rebel T6s", "EOS 8000D"],
  ["EOS 1300D", "EOS Rebel T6", "EOS Kiss X80"],
  ["EOS 800D", "EOS Rebel T7i", "EOS Kiss X9i"],
  ["EOS 77D", "EOS 9000D"],
  ["EOS 200D", "EOS Rebel SL2", "EOS Kiss X9"],
  ["EOS 2000D", "EOS Rebel T7", "EOS Kiss X90", "EOS 1500D"],
  ["EOS 4000D", "EOS Rebel T100", "EOS 3000D"],
  ["EOS 250D", "EOS Rebel SL3", "EOS Kiss X10", "EOS 200D II"],
  ["EOS 850D", "EOS Rebel T8i", "EOS Kiss X10i"],
  // Astro versions share the USB id of the normal model
  ["EOS 60D", "EOS 60Da"],
  ["EOS 20D", "EOS 20Da"],
  ["EOS R", "EOS Ra"],
  ["D810", "D810A"],
  // Names libgphoto2 writes in short form (the first name is the one shown)
  ["Z6 II", "Z6_2"],
  ["Z7 II", "Z7_2"],
  ["EOS R6 Mark II", "EOS R6m2"],
  // Sony: Alpha names and ILCE model codes
  ["Alpha-A7 III", "ILCE-7M3"],
  ["Alpha-A7R III", "ILCE-7RM3"],
  ["Alpha-A7S II", "ILCE-7SM2"],
  ["Alpha-A7 IV", "ILCE-7M4"],
  ["Alpha-A7S III", "DSC-A7S III", "ILCE-7SM3"],
  ["Alpha-A7R IV", "DSC-A7r IV", "ILCE-7RM4"],
  ["Alpha-A7R V", "ILCE-7RM5"],
  ["Alpha-A7 V", "ILCE-7M5"],
  ["Alpha-A7C", "ILCE-7C"],
  ["Alpha-A7C II", "ILCE-7CM2"],
  ["Alpha 1", "ILCE-1"],
  ["Alpha-A6400", "ILCE-6400"],
];

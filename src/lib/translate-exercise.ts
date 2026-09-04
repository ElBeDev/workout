/**
 * Best-effort Spanish names for ExerciseDB's English exercise names.
 * Rule-based: equipment and positional modifiers are pulled out first
 * and re-attached as suffixes, the remaining core phrase is translated
 * (movement phrases longest-first, then body parts, then connectors).
 * The English name stays visible in the UI as a secondary line, so
 * imperfect output is acceptable.
 *
 *   "dumbbell one arm wrist curl" → "curl de muñeca a una mano con mancuernas"
 */

type Rule = [RegExp, string];

const EQUIPMENT: Rule[] = [
  [/\bez[- ]?bar(bell)?\b/g, "con barra Z"],
  [/\bolympic barbell\b/g, "con barra"],
  [/\btrap bar\b/g, "con barra hexagonal"],
  [/\bt-bar\b/g, "con barra T"],
  [/\bbarbell\b/g, "con barra"],
  [/\bdumbbells?\b/g, "con mancuernas"],
  [/\bkettlebells?\b/g, "con kettlebell"],
  [/\bcable\b/g, "en polea"],
  [/\bsmith( machine)?\b/g, "en smith"],
  [/\blever(age)?( machine)?\b/g, "en máquina"],
  [/\bmachine\b/g, "en máquina"],
  [/\bsled\b/g, "en trineo"],
  [/\bsuspension\b/g, "en TRX"],
  [/\bmedicine ball\b/g, "con balón medicinal"],
  [/\b(stability|swiss|exercise) ball\b/g, "en fitball"],
  [/\bbosu\b/g, "en bosu"],
  [/\b(resistance )?band\b/g, "con banda"],
  [/\bweighted\b/g, "con peso"],
  [/\bassisted\b/g, "asistido"],
  [/\bbody ?weight\b/g, ""],
  [/\bwheel\b/g, "con rueda"],
  [/\broller\b/g, "con rodillo"],
  [/\bplate\b/g, "con disco"],
  [/\brope\b/g, "con cuerda"],
  [/\btowel\b/g, "con toalla"],
  [/\bbench\b(?! press)/g, "en banco"],
  [/\bchair\b/g, "en silla"],
  [/\bwall\b/g, "en pared"],
  [/\bfloor\b/g, "en el suelo"],
  [/\bbox\b/g, "en cajón"],
  [/\bstep\b(?!-?up)/g, "en escalón"],
  [/\bpower ?rack\b/g, "en rack"],
];

// Pulled out and appended after the core phrase, in this order.
const POSITIONAL: Rule[] = [
  [/\bincline\b/g, "inclinado"],
  [/\bdecline\b/g, "declinado"],
  [/\bseated\b/g, "sentado"],
  [/\bstanding\b/g, "de pie"],
  [/\blying\b/g, "acostado"],
  [/\bkneeling\b/g, "de rodillas"],
  [/\bhanging\b/g, "colgado"],
  [/\bbent[- ]over\b/g, "inclinado"],
  [/\b(one|single)[- ]arm\b/g, "a una mano"],
  [/\b(one|single)[- ]?legg?(ed)?\b/g, "a una pierna"],
  [/\balternat(e|ing)\b/g, "alterno"],
  [/\bclose[- ]grip\b/g, "agarre cerrado"],
  [/\bwide[- ]grip\b/g, "agarre abierto"],
  [/\breverse[- ]grip\b/g, "agarre invertido"],
  [/\bneutral[- ]grip\b/g, "agarre neutro"],
  [/\bpronate[- ]grip\b/g, "agarre prono"],
  [/\bsupinate[- ]grip\b/g, "agarre supino"],
  [/\boverhead\b/g, "por encima de la cabeza"],
  [/\bbehind (the )?(neck|head)\b/g, "tras nuca"],
  [/\bstraight[- ]arm\b/g, "brazo recto"],
  [/\bstraight[- ]leg\b/g, "pierna recta"],
  [/\bexplosive\b/g, "explosivo"],
  [/\bisometric\b/g, "isométrico"],
  [/\bpartial\b/g, "parcial"],
  [/\bfull\b/g, "completo"],
  [/\bhalf\b/g, "medio"],
  [/\belevated\b/g, "elevado"],
  [/\bcross(ed)?\b/g, "cruzado"],
  [/\bwide\b/g, "abierto"],
  [/\bnarrow\b/g, "cerrado"],
  [/\bslow\b/g, "lento"],
  [/\bfast\b/g, "rápido"],
  [/\bstatic\b/g, "estático"],
  [/\bdynamic\b/g, "dinámico"],
  [/\bwalking\b/g, "caminando"],
  [/\bjumping\b/g, "con salto"],
  [/\btwisting\b/g, "con giro"],
  [/\bsupported\b/g, "apoyado"],
  [/\bsupine\b/g, "supino"],
  [/\bprone\b/g, "prono"],
  [/\bpalms? (up|in)\b/g, "palmas arriba"],
  [/\bpalms? down\b/g, "palmas abajo"],
  [/\bsquatting\b/g, "en sentadilla"],
  [/\bfemale\b/g, "mujer"],
  [/\bmale\b/g, "hombre"],
  [/\bbeginner\b/g, "principiante"],
  [/\badvanced\b/g, "avanzado"],
  [/\bmini\b/g, "mini"],
];

const MOVEMENTS: Rule[] = [
  [/\bbench press\b/g, "press de banca"],
  [/\bchest press\b/g, "press de pecho"],
  [/\b(shoulder|military|overhead) press\b/g, "press de hombro"],
  [/\barnold press\b/g, "press arnold"],
  [/\bpush press\b/g, "push press"],
  [/\bface press\b/g, "press a la cara"],
  [/\bfloor press\b/g, "press en el suelo"],
  [/\bleg press\b/g, "prensa de pierna"],
  [/\bcalf press\b/g, "prensa de pantorrilla"],
  [/\bpress\b/g, "press"],
  [/\bhammer curl\b/g, "curl martillo"],
  [/\bpreacher curl\b/g, "curl en banco scott"],
  [/\bconcentration curl\b/g, "curl concentrado"],
  [/\bdrag curl\b/g, "curl arrastrado"],
  [/\bwrist curl\b/g, "curl de muñeca"],
  [/\bleg curl\b/g, "curl femoral"],
  [/\bhamstring curl\b/g, "curl femoral"],
  [/\bbiceps? curl\b/g, "curl de bíceps"],
  [/\bcurl\b/g, "curl"],
  [/\bupright row\b/g, "remo al mentón"],
  [/\bbent[- ]over row\b/g, "remo inclinado"],
  [/\bvertical row\b/g, "remo vertical"],
  [/\brow\b/g, "remo"],
  [/\blateral raise\b/g, "elevación lateral"],
  [/\bfront raise\b/g, "elevación frontal"],
  [/\bcalf raise\b/g, "elevación de talones"],
  [/\bleg raise\b/g, "elevación de piernas"],
  [/\bknee raise\b/g, "elevación de rodillas"],
  [/\bhip raise\b/g, "elevación de cadera"],
  [/\braise\b/g, "elevación"],
  [/\brear delt fly\b/g, "apertura posterior"],
  [/\breverse fly\b/g, "apertura inversa"],
  [/\bchest fly\b/g, "apertura de pecho"],
  [/\bfl(y|ye|ies)\b/g, "apertura"],
  [/\bpec deck\b/g, "contractora"],
  [/\btriceps? extension\b/g, "extensión de tríceps"],
  [/\bleg extension\b/g, "extensión de pierna"],
  [/\bback extension\b/g, "extensión lumbar"],
  [/\bhyperextension\b/g, "hiperextensión"],
  [/\bextension\b/g, "extensión"],
  [/\bpushdown\b/g, "extensión de tríceps"],
  [/\bkickback\b/g, "patada de tríceps"],
  [/\bpull[- ]?ups?\b/g, "dominada"],
  [/\bchin[- ]?ups?\b/g, "dominada supina"],
  [/\bpush[- ]?ups?\b/g, "lagartija"],
  [/\bpull[- ]in\b/g, "pull-in"],
  [/\bdips?\b/g, "fondos"],
  [/\bgoblet squat\b/g, "sentadilla goblet"],
  [/\bfront squat\b/g, "sentadilla frontal"],
  [/\bsplit squat\b/g, "sentadilla búlgara"],
  [/\bsumo squat\b/g, "sentadilla sumo"],
  [/\bjump squat\b/g, "sentadilla con salto"],
  [/\bhack squat\b/g, "sentadilla hack"],
  [/\bsquat\b/g, "sentadilla"],
  [/\blunges?\b/g, "zancada"],
  [/\bromanian deadlift\b/g, "peso muerto rumano"],
  [/\bsumo deadlift\b/g, "peso muerto sumo"],
  [/\bstiff leg deadlift\b/g, "peso muerto piernas rígidas"],
  [/\bdeadlift\b/g, "peso muerto"],
  [/\bhip thrust\b/g, "hip thrust"],
  [/\bglute bridge\b/g, "puente de glúteo"],
  [/\bbridge\b/g, "puente"],
  [/\breverse crunch\b/g, "crunch inverso"],
  [/\bside crunch\b/g, "crunch lateral"],
  [/\bcrunch(es)?\b/g, "crunch"],
  [/\bjack knife\b/g, "navaja"],
  [/\bsit[- ]?ups?\b/g, "abdominal"],
  [/\bplank\b/g, "plancha"],
  [/\brussian twist\b/g, "giro ruso"],
  [/\btwists?\b/g, "giro"],
  [/\bshrugs?\b/g, "encogimiento de hombros"],
  [/\b(lat )?pull ?down\b/g, "jalón al pecho"],
  [/\bpullover\b/g, "pullover"],
  [/\bface pull\b/g, "face pull"],
  [/\bstep[- ]?ups?\b/g, "subida al cajón"],
  [/\bgood morning\b/g, "buenos días"],
  [/\bclean\b/g, "cargada"],
  [/\bsnatch\b/g, "arranque"],
  [/\bjerk\b/g, "envión"],
  [/\bthruster\b/g, "thruster"],
  [/\bswing\b/g, "balanceo"],
  [/\bfarmer'?s walk\b/g, "paseo del granjero"],
  [/\bcarry\b/g, "transporte"],
  [/\bstretch\b/g, "estiramiento"],
  [/\bjumping jacks?\b/g, "jumping jacks"],
  [/\bmountain climbers?\b/g, "escalador"],
  [/\bburpees?\b/g, "burpee"],
  [/\bhigh knees\b/g, "rodillas altas"],
  [/\bbicycle\b/g, "bicicleta"],
  [/\bside bend\b/g, "flexión lateral"],
  [/\bsuperman\b/g, "superman"],
  [/\bbird dog\b/g, "bird dog"],
  [/\bdead bug\b/g, "dead bug"],
  [/\bhollow\b/g, "hollow"],
  [/\bhang\b/g, "colgado"],
  [/\bhold\b/g, "isométrico"],
  [/\bmarch\b/g, "marcha"],
  [/\bsprint\b/g, "sprint"],
  [/\brun(ning)?\b/g, "carrera"],
  [/\bwalk(ing)?\b/g, "caminata"],
  [/\bjog(ging)?\b/g, "trote"],
  [/\bbike\b/g, "bicicleta"],
  [/\belliptical\b/g, "elíptica"],
  [/\brotation\b/g, "rotación"],
  [/\bsupination\b/g, "supinación"],
  [/\bpronation\b/g, "pronación"],
  [/\bcircles?\b/g, "círculos"],
  [/\bflexion\b/g, "flexión"],
  [/\babduction\b/g, "abducción"],
  [/\badduction\b/g, "aducción"],
  [/\bkicks?\b/g, "patada"],
  [/\bjumps?\b/g, "salto"],
  [/\bhops?\b/g, "salto"],
  [/\bcrossover\b/g, "cruce"],
  [/\bboxing\b/g, "boxeo"],
  [/\bhook\b/g, "gancho"],
  [/\bpull\b/g, "tirón"],
  [/\bpush\b/g, "empuje"],
];

const INLINE: Rule[] = [
  [/\bfront\b/g, "frontal"],
  [/\brear\b/g, "posterior"],
  [/\b(lateral|side)\b/g, "lateral"],
  [/\breverse\b/g, "inverso"],
  [/\bvertical\b/g, "vertical"],
  [/\bhorizontal\b/g, "horizontal"],
  [/\bhigh\b/g, "alto"],
  [/\blow\b/g, "bajo"],
  [/\bupper\b/g, "superior"],
  [/\blower\b/g, "inferior"],
  [/\bheavy\b/g, "pesado"],
  [/\bgrip\b/g, "agarre"],
  [/\bversion\b/g, "versión"],
  [/\bvariation\b/g, "variación"],
  [/\bagainst\b/g, "contra"],
  [/\bover\b/g, "sobre"],
  [/\b(with|w\/)\b/g, "con"],
  [/\bon\b/g, "en"],
  [/\band\b/g, "y"],
  [/\bto\b/g, "a"],
  [/\bof\b/g, "de"],
];

const BODY: Rule[] = [
  [/\bshoulders?\b/g, "hombro"],
  [/\bchest\b/g, "pecho"],
  [/\bback\b/g, "espalda"],
  [/\blegs?\b/g, "pierna"],
  [/\barms?\b/g, "brazo"],
  [/\bglutes?\b/g, "glúteo"],
  [/\bhamstrings?\b/g, "isquios"],
  [/\bquads?\b/g, "cuádriceps"],
  [/\b(calf|calves)\b/g, "pantorrilla"],
  [/\babs\b|\babdominals?\b/g, "abdominales"],
  [/\btriceps?\b/g, "tríceps"],
  [/\bbiceps?\b/g, "bíceps"],
  [/\blats?\b/g, "dorsal"],
  [/\btraps?\b/g, "trapecio"],
  [/\bdelts?\b/g, "deltoides"],
  [/\bforearms?\b/g, "antebrazo"],
  [/\bneck\b/g, "cuello"],
  [/\bwrists?\b/g, "muñeca"],
  [/\bankles?\b/g, "tobillo"],
  [/\bhips?\b/g, "cadera"],
  [/\bknees?\b/g, "rodilla"],
  [/\bspine\b/g, "columna"],
  [/\boblique\b/g, "oblicuo"],
  [/\bpelvic\b/g, "pélvico"],
  [/\btorso\b/g, "torso"],
  [/\bbody\b/g, "cuerpo"],
  [/\bcore\b/g, "core"],
];

function extract(text: string, rules: Rule[], out: string[]) {
  let t = text;
  for (const [re, es] of rules) {
    if (re.test(t)) {
      t = t.replace(re, " ");
      if (es) out.push(es);
    }
    re.lastIndex = 0;
  }
  return t;
}

function apply(text: string, rules: Rule[]) {
  let t = text;
  for (const [re, es] of rules) t = t.replace(re, es);
  return t;
}

function tidy(text: string) {
  return text
    .replace(/\(\s*(en|con|y|a|de)?\s*\)/g, " ")
    .replace(/\s+/g, " ")
    // Dangling connectors left behind when equipment/modifiers were pulled out:
    // "apertura en a una mano" → "apertura a una mano", "lumbar en en fitball" → "lumbar en fitball".
    .replace(/\b(en|con|a|de|y)\s+(?=(en|con|a|de|y)\b)/g, "")
    .replace(/\s+(en|con|a|de|y)\s*$/g, "")
    .replace(/\s+([,.)])/g, "$1")
    .replace(/^[\s\-–,.]+|[\s\-–,.]+$/g, "")
    .trim();
}

export function translateExerciseName(name: string): string {
  let text = name.toLowerCase().replace(/\s+/g, " ").trim();

  const equipment: string[] = [];
  const modifiers: string[] = [];
  text = extract(text, EQUIPMENT, equipment);
  text = extract(text, POSITIONAL, modifiers);

  text = apply(text, MOVEMENTS);
  text = apply(text, INLINE);
  text = apply(text, BODY);

  const core = tidy(text);
  const parts = [core, ...new Set(modifiers), ...new Set(equipment)].filter(Boolean);
  return tidy(parts.join(" ")) || name;
}

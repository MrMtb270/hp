import { PrismaClient, Subtest } from "@prisma/client";
import bcrypt from "bcryptjs";
import { estimateSubscore } from "../src/lib/adaptive";
import { VERBAL_SUBTESTS, QUANT_SUBTESTS } from "../src/lib/utils";

const prisma = new PrismaClient();

type QSeed = {
  subtest: Subtest;
  concept: string;
  difficulty: number;
  stem: string;
  options: string[];
  correctIndex: number;
  explanationShort: string;
  explanationSteps: string[];
  hint1?: string;
  hint2?: string;
  hint3?: string;
};

// KVA - kvantitativa jämförelser: jämför två kvantiteter mot varandra.
const COMPARISON_OPTIONS = [
  "Kvantitet I är större",
  "Kvantitet II är större",
  "Kvantiteterna är lika",
  "Informationen räcker inte för att avgöra",
];

// NOG - kvantitativa resonemang: avgör om påståendena räcker för att lösa problemet.
const NOG_OPTIONS = [
  "(1) är tillräckligt ensamt, men inte (2)",
  "(2) är tillräckligt ensamt, men inte (1)",
  "(1) och (2) tillsammans är tillräckliga, men ingen ensam räcker",
  "Vardera påståendet är tillräckligt ensamt",
  "Även (1) och (2) tillsammans är otillräckliga",
];

// Alla frågor nedan är kalibrerade mot en och samma svårighetsnivå - den som gäller på
// det riktiga högskoleprovet - istället för att blanda in en lättare introduktionsnivå.

const questions: QSeed[] = [
  // ================= ORD - Ordförståelse (5 svarsalternativ) =================
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1300,
    stem: "SVEKFULL",
    options: ["Ärlig och trogen", "Falsk och bedräglig", "Rädd och försiktig", "Stolt och självsäker", "Tyst och tillbakadragen"],
    correctIndex: 1,
    explanationShort: "Svekfull betyder falsk och bedräglig - man begår svek mot någon.",
    explanationSteps: ["Ordet är släkt med 'svek' - att medvetet bedra någons förtroende.", "Svekfull beskriver alltså den som är falsk och bedräglig."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1300,
    stem: "SKARPSINNIG",
    options: ["Ytlig och slarvig", "Långsam i tanken", "Skarpt iakttagande och klok", "Envis och sträng", "Blyg och tystlåten"],
    correctIndex: 2,
    explanationShort: "Skarpsinnig betyder skarpt iakttagande, klok och analytisk.",
    explanationSteps: ["Ordet beskriver förmågan att snabbt genomskåda och förstå ett problem.", "Synonymt med skarpt iakttagande och klok."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1300,
    stem: "MÅNGTYDIG",
    options: ["Entydig", "Kan tolkas på flera sätt", "Kortfattad", "Osann", "Föråldrad"],
    correctIndex: 1,
    explanationShort: "Mångtydig betyder att något kan tolkas på flera olika sätt.",
    explanationSteps: ["Motsatsen till entydig.", "Mångtydig = öppen för flera tolkningar."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1350,
    stem: "FÖRDÄRVLIG",
    options: ["Fördelaktig", "Obetydlig", "Skadlig, med förödande följder", "Tillfällig", "Förvånande"],
    correctIndex: 2,
    explanationShort: "Fördärvlig betyder skadlig och med förödande, ruinerande följder.",
    explanationSteps: ["Ordet är släkt med 'fördärv' - undergång eller ruin.", "Fördärvlig = något som leder till fördärv, alltså skadligt."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1400,
    stem: "OFÖRTÖVAT",
    options: ["Efter lång betänketid", "Med stor försiktighet", "Utan dröjsmål", "Mot sin vilja", "Under protest"],
    correctIndex: 2,
    explanationShort: "Oförtövat betyder omedelbart, utan dröjsmål.",
    explanationSteps: ["Ordet används ofta i formell text: 'agera oförtövat' = agera genast.", "Synonymt med utan dröjsmål."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1300,
    stem: "TILLTAGSEN",
    options: ["Blygsam och försynt", "Djärv på gränsen till oförskämd", "Trött och håglös", "Noggrann och petig", "Road och nyfiken"],
    correctIndex: 1,
    explanationShort: "Tilltagsen betyder djärv på ett sätt som gränsar till oförskämt.",
    explanationSteps: ["Ordet har en negativ underton av att gå för långt i sin djärvhet.", "Synonymt med djärv på gränsen till oförskämd."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1300,
    stem: "EFTERSTRÄVANSVÄRD",
    options: ["Onödig", "Overklig", "Värd att sträva efter", "Föråldrad", "Tvivelaktig"],
    correctIndex: 2,
    explanationShort: "Eftersträvansvärd betyder värd att sträva efter, önskvärd.",
    explanationSteps: ["Sammansättning av 'eftersträva' (sträva efter) och 'värd'.", "Direkt betydelse: värd att sträva efter."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1350,
    stem: "GENOMGRIPANDE",
    options: ["Ytlig och begränsad", "Djupgående och omfattande", "Tillfällig", "Osynlig", "Långsam"],
    correctIndex: 1,
    explanationShort: "Genomgripande betyder djupgående och omfattande, som påverkar allt.",
    explanationSteps: ["'Genomgripande förändringar' påverkar hela systemet i grunden.", "Synonymt med djupgående och omfattande."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1400,
    stem: "UNDFALLANDE",
    options: ["Bestämd och orubblig", "Alltför eftergiven, saknar ryggrad", "Aggressiv", "Nyfiken", "Road"],
    correctIndex: 1,
    explanationShort: "Undfallande betyder alltför eftergiven, ger efter utan att stå på sig.",
    explanationSteps: ["Ordet har en negativ klang av svaghet inför andras vilja.", "Synonymt med alltför eftergiven, saknar ryggrad."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1300,
    stem: "KATEGORISK",
    options: ["Tveksam", "Vag", "Bestämd, utan undantag eller tvekan", "Undantagen", "Ovillig"],
    correctIndex: 2,
    explanationShort: "Kategorisk betyder bestämd, utan utrymme för undantag eller tvekan.",
    explanationSteps: ["'Ett kategoriskt nej' är ett fullständigt bestämt nej.", "Synonymt med bestämd, utan undantag eller tvekan."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1500,
    stem: "OBOTFÄRDIG",
    options: ["Botfärdig och ångerfull", "Osäker på sin sak", "Som vägrar ångra sig", "Road av situationen", "Extremt sjuk"],
    correctIndex: 2,
    explanationShort: "Obotfärdig betyder att vägra ångra sig, envist stå fast vid sitt.",
    explanationSteps: ["Förleden 'o-' vänder 'botfärdig' (ångerfull) till motsatsen.", "Obotfärdig = som inte visar ånger."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1450,
    stem: "RECIPROCITET",
    options: ["Enkelriktning", "Ömsesidighet", "Osäkerhet", "Motvilja", "Överlägsenhet"],
    correctIndex: 1,
    explanationShort: "Reciprocitet betyder ömsesidighet - att något gäller åt båda hållen.",
    explanationSteps: ["Ordet är släkt med 'reciprok', som används om ömsesidiga relationer eller matematiska inverser.", "Reciprocitet = ömsesidighet."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1400,
    stem: "FÖRDUNKLA",
    options: ["Förtydliga", "Göra oklar eller dunkel", "Belysa", "Förenkla", "Betona"],
    correctIndex: 1,
    explanationShort: "Att fördunkla något är att göra det oklart eller svårförståeligt.",
    explanationSteps: ["Förleden 'för-' förstärker här grundordet 'dunkel' (oklar, mörk).", "Fördunkla = göra dunklare, alltså mer oklart."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1550,
    stem: "EKVIVOK",
    options: ["Entydig", "Tvetydig", "Tydlig", "Bestämd", "Ovedersäglig"],
    correctIndex: 1,
    explanationShort: "Ekvivok betyder tvetydig - som kan tolkas på mer än ett sätt.",
    explanationSteps: ["Ordet kommer från latinets 'aequivocus', som betyder 'som låter lika men betyder olika saker'.", "Ekvivok = tvetydig, mångtydig."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1600,
    stem: "APODIKTISK",
    options: ["Tvivelaktig", "Orubbligt säker och kategorisk", "Försiktig", "Ödmjuk", "Undflyende"],
    correctIndex: 1,
    explanationShort: "Apodiktisk betyder orubbligt säker, som inte tillåter någon invändning.",
    explanationSteps: ["Ordet används om påståenden som framförs som absolut sanna, utan utrymme för tvivel.", "Apodiktisk = kategoriskt säker, orubblig."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1500,
    stem: "FÖRSTOCKAD",
    options: ["Öppen för nya idéer", "Envist oemottaglig för förnuftsskäl", "Nyfiken", "Foglig", "Road"],
    correctIndex: 1,
    explanationShort: "Förstockad betyder envist oemottaglig för förnuft eller nya argument.",
    explanationSteps: ["Ordet beskriver någon som vägrar ändra uppfattning trots goda skäl.", "Förstockad = envis och stängd för förnuftsargument."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1350,
    stem: "LATENT",
    options: ["Öppen och synlig", "Dold men existerande, kan bli aktiv", "Försvunnen", "Stark", "Tillfällig"],
    correctIndex: 1,
    explanationShort: "Latent betyder dold eller vilande, men med potential att bli synlig eller aktiv.",
    explanationSteps: ["'Latent konflikt' till exempel betyder en konflikt som finns där men inte syns ännu.", "Latent = dold men existerande."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1400,
    stem: "OBSTINAT",
    options: ["Foglig och medgörlig", "Envist motsträvig", "Road och nyfiken", "Osäker på sin sak", "Plötsligt förändrad"],
    correctIndex: 1,
    explanationShort: "Obstinat betyder envist motsträvig, vägrar ge efter.",
    explanationSteps: ["Ordet beskriver ett envist motstånd mot andras vilja eller förslag.", "Obstinat = envist motsträvig."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1450,
    stem: "INDOLENT",
    options: ["Energisk och ivrig", "Loj och håglös", "Skicklig och effektiv", "Nervös och rastlös", "Ärlig och rättfram"],
    correctIndex: 1,
    explanationShort: "Indolent betyder loj, håglös och likgiltig inför ansträngning.",
    explanationSteps: ["Ordet beskriver en påtaglig brist på energi eller intresse.", "Indolent = loj och håglös."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1300,
    stem: "PERIFER",
    options: ["Central och avgörande", "Av underordnad betydelse, i utkanten", "Tillfällig", "Hemlig", "Omtvistad"],
    correctIndex: 1,
    explanationShort: "Perifer betyder att befinna sig i utkanten, av underordnad betydelse.",
    explanationSteps: ["Motsatsen till central.", "En perifer detalj är mindre viktig, i utkanten av det centrala."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1350,
    stem: "RESTRIKTIV",
    options: ["Frikostig och generös", "Återhållsam, sätter tydliga gränser", "Obestämd", "Impulsiv", "Öppen för alla förslag"],
    correctIndex: 1,
    explanationShort: "Restriktiv betyder återhållsam och begränsande, sätter tydliga gränser.",
    explanationSteps: ["'Restriktiv policy' är en policy som sätter snäva gränser.", "Restriktiv = återhållsam, begränsande."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1400,
    stem: "SUBTIL",
    options: ["Uppenbar och grov", "Fint förnimbar, svår att direkt uppfatta", "Högljudd", "Långsam", "Tillfällig"],
    correctIndex: 1,
    explanationShort: "Subtil betyder fint förnimbar - något som kräver uppmärksamhet för att uppfattas.",
    explanationSteps: ["En subtil skillnad är en skillnad som är svår att direkt lägga märke till.", "Subtil = fint förnimbar, ej uppenbar."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1350,
    stem: "INKONSEKVENT",
    options: ["Följdriktig och stringent", "Motsägelsefull, följer inte samma linje", "Kortfattad", "Övertygande", "Anonym"],
    correctIndex: 1,
    explanationShort: "Inkonsekvent betyder motsägelsefull, håller sig inte till samma linje.",
    explanationSteps: ["Förleden 'in-' vänder 'konsekvent' (följdriktig) till motsatsen.", "Inkonsekvent = motsägelsefull."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1500,
    stem: "PRESUMTIV",
    options: ["Bekräftad och säker", "Tilltänkt, väntad men inte säkerställd", "Föråldrad", "Ovälkommen", "Slumpmässigt vald"],
    correctIndex: 1,
    explanationShort: "Presumtiv betyder tilltänkt eller väntad, men ännu inte säkerställd.",
    explanationSteps: ["'Presumtiv köpare' är en person som förväntas köpa, men affären är ännu inte klar.", "Presumtiv = tilltänkt, ej bekräftad."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1350,
    stem: "RESIGNERAD",
    options: ["Fylld av kampglöd", "Har gett upp och accepterat läget", "Förvånad", "Road", "Misstänksam"],
    correctIndex: 1,
    explanationShort: "Resignerad betyder att ha gett upp motståndet och accepterat ett läge man ogillar.",
    explanationSteps: ["En resignerad person har slutat kämpa emot och underkastat sig situationen.", "Resignerad = har gett upp och accepterat."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1600,
    stem: "ABSTRUS",
    options: ["Lättillgänglig", "Svårbegriplig, dunkel", "Kortfattad", "Välkänd", "Överdriven"],
    correctIndex: 1,
    explanationShort: "Abstrus betyder svårbegriplig och dunkel, ofta om resonemang eller text.",
    explanationSteps: ["Ordet används om sådant som är onödigt komplicerat och svårt att förstå.", "Abstrus = svårbegriplig, dunkel."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1450,
    stem: "FÖRMENT",
    options: ["Bekräftad genom bevis", "Påstådd men inte bevisad", "Ursprunglig", "Önskvärd", "Obestridlig"],
    correctIndex: 1,
    explanationShort: "Förment betyder påstådd eller föregiven, utan att vara bevisad.",
    explanationSteps: ["'Den förmenta lösningen' är en lösning som påstås fungera, utan att det är styrkt.", "Förment = påstådd men inte bevisad."],
  },

  // ================= LÄS - Svensk läsförståelse =================
  {
    subtest: "LAS", concept: "huvudbudskap", difficulty: 1300,
    stem:
      "Digitaliseringen av historiska arkiv har på kort tid gjort miljontals dokument sökbara med några knapptryckningar, något som borde vara en dröm för alla historiker. Men den nya tillgängligheten har fört med sig ett oväntat problem: forskare tenderar att i allt högre grad bygga sina slutsatser enbart på det material som råkar vara digitaliserat, medan enorma mängder outforskat material - protokoll, brev och räkenskaper som ännu ligger i fysiska arkiv - i praktiken blir osynliga. Resultatet riskerar att bli en förvriden historieskrivning, inte för att de digitala källorna är felaktiga, utan för att urvalet av vad som digitaliserats sällan är slumpmässigt. Myndigheter och institutioner med resurser att digitalisera sina samlingar överrepresenteras, medan mindre arkiv - ofta de som förvarar material om marginaliserade grupper - halkar efter. Sökbarheten ger på så sätt en illusion av fullständighet som få forskare, upptagna av den nya bekvämligheten, stannar upp för att ifrågasätta.\n\nVad är textens huvudbudskap?",
    options: [
      "Digitalisering av arkiv är alltid till fördel för forskningen",
      "Digitaliseringens ojämna urval riskerar att snedvrida historieforskningen",
      "Fysiska arkiv bör avvecklas till förmån för digitala",
      "Historiker har slutat använda digitala källor",
    ],
    correctIndex: 1,
    explanationShort: "Texten varnar för att ojämn digitalisering ger en skev bild av historien, trots att källorna i sig är korrekta.",
    explanationSteps: ["Signalordet 'Men' introducerar textens egentliga poäng.", "'Resultatet riskerar att bli en förvriden historieskrivning' sammanfattar huvudbudskapet direkt."],
  },
  {
    subtest: "LAS", concept: "slutledning", difficulty: 1350,
    stem:
      "Digitaliseringen av historiska arkiv... Myndigheter och institutioner med resurser att digitalisera sina samlingar överrepresenteras, medan mindre arkiv - ofta de som förvarar material om marginaliserade grupper - halkar efter.\n\nVilken typ av arkiv riskerar enligt texten att bli underrepresenterade i forskningen?",
    options: [
      "Arkiv hos välfinansierade myndigheter",
      "De mest omfattande nationalarkiven",
      "Mindre arkiv med material om marginaliserade grupper",
      "Digitala källor i allmänhet",
    ],
    correctIndex: 2,
    explanationShort: "Texten anger explicit att mindre arkiv med material om marginaliserade grupper riskerar att halka efter.",
    explanationSteps: ["Frasen 'ofta de som förvarar material om marginaliserade grupper' pekar direkt ut svaret.", "Kontrasten till 'myndigheter och institutioner med resurser' förstärker vilken grupp som missgynnas."],
  },
  {
    subtest: "LAS", concept: "författarens-syfte", difficulty: 1300,
    stem:
      "Digitaliseringen av historiska arkiv har på kort tid gjort miljontals dokument sökbara... Resultatet riskerar att bli en förvriden historieskrivning... Sökbarheten ger på så sätt en illusion av fullständighet som få forskare, upptagna av den nya bekvämligheten, stannar upp för att ifrågasätta.\n\nVad vill författaren främst uppnå med texten?",
    options: [
      "Uppmana till att stoppa all digitalisering",
      "Väcka medvetenhet om en dold snedvridning i forskningsunderlaget",
      "Kritisera enskilda historiker för slarv",
      "Beskriva den tekniska processen för digitalisering",
    ],
    correctIndex: 1,
    explanationShort: "Författaren varnar för en snedvridning som forskare sällan uppmärksammar - syftet är att lyfta fram detta.",
    explanationSteps: ["Texten är inte kritisk mot digitalisering i sig, utan mot ett ouppmärksammat urvalsproblem.", "Att peka på något 'få stannar upp för att ifrågasätta' visar en avsikt att väcka medvetenhet."],
  },
  {
    subtest: "LAS", concept: "författarens-syfte", difficulty: 1300,
    stem:
      "Det är lätt att avfärda nostalgi som harmlöst svärmeri för det som varit, men psykologisk forskning tyder på att nostalgiska minnen fyller en tydlig funktion: de stärker känslan av mening och social tillhörighet, särskilt i perioder av ensamhet eller stress. Att längta tillbaka är alltså inte simpel verklighetsflykt, utan snarare en psykologisk resurs som hjälper oss återhämta oss - en omvärdering som borde få nostalgin att framstå som något friskare än sitt rykte.\n\nVad är författarens syfte med texten?",
    options: [
      "Att varna för riskerna med nostalgi",
      "Att omvärdera nostalgi som en psykologiskt värdefull funktion snarare än flykt från verkligheten",
      "Att bevisa att minnen alltid är opålitliga",
      "Att uppmana läsaren att undvika att tänka på det förflutna",
    ],
    correctIndex: 1,
    explanationShort: "Författaren argumenterar mot att avfärda nostalgi och lyfter i stället fram dess psykologiska funktion.",
    explanationSteps: ["Signalordet 'men' introducerar författarens egentliga ståndpunkt.", "Sista meningens 'omvärdering' visar syftet: att ge nostalgi en mer positiv innebörd."],
  },
  {
    subtest: "LAS", concept: "slutledning", difficulty: 1450,
    stem:
      "Text: \"Även de mest sofistikerade makroekonomiska modellerna bygger på antaganden om rationella aktörer som sällan håller fullt ut i verkligheten. Trots detta fortsätter beslutsfattare att luta sig tungt mot modellernas prognoser vid utformningen av räntebeslut, vilket kritiker menar skapar en falsk känsla av precision i en i grunden osäker vetenskap.\"\n\nVilket antagande ifrågasätter författaren indirekt?",
    options: [
      "Att räntebeslut alltid är korrekta",
      "Att modellernas prognoser är mer exakta än den underliggande osäkerheten motiverar",
      "Att aktörer på marknaden är irrationella",
      "Att makroekonomi inte är en vetenskap",
    ],
    correctIndex: 1,
    explanationShort: "Författaren pekar på en 'falsk känsla av precision' trots grundläggande osäkerhet i modellerna.",
    explanationSteps: ["Nyckelfrasen är 'falsk känsla av precision i en i grunden osäker vetenskap'.", "Det innebär att modellerna framstår som mer exakta än de egentligen är - vilket är precis vad författaren ifrågasätter."],
  },
  {
    subtest: "LAS", concept: "slutledning", difficulty: 1500,
    stem:
      "Text: \"Studien fann att deltagare som fick placebo rapporterade nästan lika stor smärtlindring som de som fick den aktiva substansen, men endast när de på förhand informerats om att medicinen 'sannolikt skulle fungera'. När deltagarna istället informerades neutralt uteblev placeboeffekten nästan helt.\"\n\nVad tyder resultaten på?",
    options: [
      "Placebo fungerar alltid oavsett information",
      "Förväntan, inte bara substansen, driver en stor del av smärtlindringen",
      "Den aktiva substansen saknar effekt",
      "Neutral information ökar smärtlindringen",
    ],
    correctIndex: 1,
    explanationShort: "Effekten uppstod bara vid positiv förväntan - det visar att förväntan spelar en avgörande roll.",
    explanationSteps: ["Jämför de två villkoren: positiv information gav effekt, neutral information gav ingen effekt.", "Skillnaden mellan villkoren var enbart informationen/förväntan - alltså är det förväntan som driver effekten."],
  },
  {
    subtest: "LAS", concept: "författarens-syfte", difficulty: 1400,
    stem:
      "Text: \"Det har blivit på modet att kalla varje ny teknisk pryl 'revolutionerande' - ett ord som en gång reserverades för uppfinningar som faktiskt omkullkastade hur vi lever. Om allt är en revolution, är ingenting det längre.\"\n\nVad är författarens huvudsakliga poäng?",
    options: [
      "Ny teknik är sällan användbar",
      "Överanvändningen av ordet 'revolutionerande' urholkar dess betydelse",
      "Alla tekniska uppfinningar är revolutionerande",
      "Ordet 'revolutionerande' bör förbjudas",
    ],
    correctIndex: 1,
    explanationShort: "Sista meningen sammanfattar poängen: om ordet används om allt förlorar det sin mening.",
    explanationSteps: ["Författaren kontrasterar ordets ursprungliga, snäva betydelse med dagens slentrianmässiga användning.", "'Om allt är en revolution, är ingenting det längre' är kärnan i kritiken."],
  },
  {
    subtest: "LAS", concept: "detaljförståelse", difficulty: 1350,
    stem:
      "Text: \"Enligt avtalet utgår ersättning endast om skadan inträffat inom garantitiden OCH kan härledas till ett fabrikationsfel - inte om skadan orsakats av felaktig användning, oavsett när den inträffade.\"\n\nI vilket fall utgår INTE ersättning enligt avtalet?",
    options: [
      "Skada orsakad av fabrikationsfel inom garantitiden",
      "Skada orsakad av felaktig användning inom garantitiden",
      "Skada som upptäcks första veckan",
      "Skada som anmäls skriftligt",
    ],
    correctIndex: 1,
    explanationShort: "Texten anger explicit att felaktig användning inte ger ersättning, oavsett tidpunkt.",
    explanationSteps: ["Villkoret kräver BÅDA sakerna: garantitid OCH fabrikationsfel.", "Felaktig användning är uttryckligen undantaget, även om skadan sker inom garantitiden."],
  },
  {
    subtest: "LAS", concept: "huvudbudskap", difficulty: 1400,
    stem:
      "Text: \"Många hävdar att fyradagarsvecka skulle sänka produktiviteten drastiskt. Försök i flera länder visar dock att produktionen per timme ofta ökar tillräckligt för att kompensera den kortare arbetstiden - även om resultaten varierar kraftigt mellan branscher och således inte kan generaliseras rakt av.\"\n\nVad är textens huvudbudskap?",
    options: [
      "Fyradagarsvecka fungerar i alla branscher",
      "Fyradagarsvecka sänker alltid produktiviteten",
      "Effekterna av fyradagarsvecka är lovande men branschberoende, inte entydiga",
      "Produktivitet per timme är irrelevant",
    ],
    correctIndex: 2,
    explanationShort: "Texten nyanserar det positiva resultatet med att det varierar kraftigt mellan branscher.",
    explanationSteps: ["Texten motsäger först den negativa uppfattningen, men nyanserar sedan med 'varierar kraftigt' och 'kan inte generaliseras'.", "Huvudbudskapet är alltså en nyanserad, branschberoende bild - inte ett entydigt ja eller nej."],
  },
  {
    subtest: "LAS", concept: "huvudbudskap", difficulty: 1450,
    stem:
      "Den så kallade replikationskrisen inom psykologin har fått förnyad uppmärksamhet sedan storskaliga försök att upprepa klassiska experiment visat att en betydande andel av resultaten inte går att återskapa. Vanligtvis tolkas detta som ett tecken på slarvig metodik eller rentav forskningsfusk, men en mindre uppmärksammad förklaring pekar på ett strukturellt problem i hur forskning belönas: tidskrifter publicerar i praktiken nästan uteslutande studier med statistiskt signifikanta resultat, vilket gör att forskare - medvetet eller omedvetet - testar flera hypoteser och rapporterar bara de som råkar visa sig signifikanta. Resultatet är en litteratur fylld av falska positiva fynd, inte nödvändigtvis för att enskilda forskare fuskat, utan för att selektionstrycket i publiceringssystemet i sig gynnar sådana resultat. Att åtgärda krisen kräver därför inte i första hand strängare etikprövning av enskilda forskare, utan en förändring av hela systemet för hur vetenskapliga resultat belönas och publiceras.\n\nVad är textens huvudbudskap?",
    options: [
      "Forskare fuskar allt oftare med sina resultat",
      "Replikationskrisen beror främst på ett strukturellt problem i publiceringssystemet, inte på enskilt fusk",
      "Statistisk signifikans är irrelevant för god forskning",
      "Psykologisk forskning bör läggas ner helt",
    ],
    correctIndex: 1,
    explanationShort: "Texten pekar ut publiceringssystemets selektionstryck - inte enskilt fusk - som den huvudsakliga orsaken.",
    explanationSteps: ["Signalordet 'men' introducerar den mindre uppmärksammade, egentliga förklaringen.", "Sista meningen bekräftar: lösningen är systemförändring, inte hårdare granskning av individer."],
  },
  {
    subtest: "LAS", concept: "slutledning", difficulty: 1500,
    stem:
      "Den så kallade replikationskrisen inom psykologin... tidskrifter publicerar i praktiken nästan uteslutande studier med statistiskt signifikanta resultat... Att åtgärda krisen kräver därför inte i första hand strängare etikprövning av enskilda forskare, utan en förändring av hela systemet för hur vetenskapliga resultat belönas och publiceras.\n\nVilken åtgärd skulle författaren sannolikt förorda för att komma till rätta med problemet?",
    options: [
      "Hårdare straff för enskilda forskare som fuskar",
      "Förändringar i hur tidskrifter väljer vilka resultat som publiceras",
      "Att helt sluta använda statistisk signifikans",
      "Att endast finansiera forskning som bekräftar tidigare resultat",
    ],
    correctIndex: 1,
    explanationShort: "Texten pekar ut publiceringssystemet, inte enskilda forskare, som det som behöver förändras.",
    explanationSteps: ["Sista meningen anger direkt att lösningen ligger i 'hela systemet för hur... resultat belönas och publiceras'.", "Det pekar mot förändrade publiceringskriterier snarare än straff mot individer."],
  },
  {
    subtest: "LAS", concept: "detaljförståelse", difficulty: 1350,
    stem:
      "Den så kallade replikationskrisen inom psykologin... vilket gör att forskare - medvetet eller omedvetet - testar flera hypoteser och rapporterar bara de som råkar visa sig signifikanta.\n\nEnligt texten, varför rapporterar forskare främst signifikanta resultat?",
    options: [
      "För att icke-signifikanta resultat alltid är felaktiga",
      "För att tidskrifter i praktiken nästan uteslutande publicerar sådana resultat",
      "För att forskare saknar förståelse för statistik",
      "För att signifikanta resultat är lättare att samla in",
    ],
    correctIndex: 1,
    explanationShort: "Texten anger explicit att tidskrifter nästan uteslutande publicerar signifikanta resultat, vilket styr vad som rapporteras.",
    explanationSteps: ["Orsakskedjan i texten går från publiceringspraxis till forskares beteende.", "'Tidskrifter publicerar... nästan uteslutande... signifikanta resultat' är den angivna orsaken."],
  },
  {
    subtest: "LAS", concept: "huvudbudskap", difficulty: 1400,
    stem:
      "Ett av de mest motbjudande fynden inom trafikforskningen, sett ur bilistens perspektiv, är fenomenet inducerad efterfrågan: nya körfält och breddade motorvägar leder sällan till varaktigt minskad trängsel, eftersom den tillfälligt förbättrade framkomligheten lockar fler bilister att välja just den sträckan, tills trängseln återställs till ungefär samma nivå som innan utbyggnaden. Fenomenet är väldokumenterat i decennier av data från städer världen över, men politiker fortsätter ändå att motivera vägutbyggnader med löften om minskad trängsel - antingen för att den kortsiktiga lättnaden är politiskt värdefull även om den bevisligen är tillfällig, eller för att den kontraintuitiva logiken helt enkelt är svår att kommunicera till väljare som upplever köer som ett direkt resultat av för få körfält. Ironiskt nog gäller samma mekanism omvänt: när körfält istället tas bort eller stängs av bilister, minskar den totala biltrafiken ofta mer än väntat, eftersom en del resenärer helt enkelt väljer bort bilresan.\n\nVad är textens huvudbudskap?",
    options: [
      "Fler körfält minskar alltid trängseln permanent",
      "Vägutbyggnader ger sällan varaktigt minskad trängsel, eftersom ökad kapacitet lockar fler bilister",
      "Politiker förstår inte trafikforskning",
      "Att ta bort körfält ökar alltid trängseln",
    ],
    correctIndex: 1,
    explanationShort: "Texten beskriver hur inducerad efterfrågan gör att fler körfält sällan minskar trängseln varaktigt.",
    explanationSteps: ["Definitionen av 'inducerad efterfrågan' i första meningen ger huvudbudskapet direkt.", "Resten av texten utvecklar och belägger denna poäng."],
  },
  {
    subtest: "LAS", concept: "slutledning", difficulty: 1500,
    stem:
      "Ett av de mest motbjudande fynden inom trafikforskningen... Ironiskt nog gäller samma mekanism omvänt: när körfält istället tas bort eller stängs av bilister, minskar den totala biltrafiken ofta mer än väntat, eftersom en del resenärer helt enkelt väljer bort bilresan.\n\nVad antyder textens sista mening om effekten av att stänga av körfält?",
    options: [
      "Att den ökar trängseln kraftigt",
      "Att en del bilister då väljer att inte köra alls, vilket minskar den totala trafiken",
      "Att fenomenet inducerad efterfrågan inte gäller i det fallet",
      "Att kollektivtrafiken automatiskt byggs ut",
    ],
    correctIndex: 1,
    explanationShort: "Texten anger explicit att en del resenärer väljer bort bilresan när körfält stängs av.",
    explanationSteps: ["Sista meningen beskriver den omvända mekanismen konkret.", "'En del resenärer helt enkelt väljer bort bilresan' ger svaret direkt."],
  },
  {
    subtest: "LAS", concept: "författarens-syfte", difficulty: 1450,
    stem:
      "Ett av de mest motbjudande fynden inom trafikforskningen... men politiker fortsätter ändå att motivera vägutbyggnader med löften om minskad trängsel - antingen för att den kortsiktiga lättnaden är politiskt värdefull även om den bevisligen är tillfällig, eller för att den kontraintuitiva logiken helt enkelt är svår att kommunicera till väljare.\n\nVad är författarens sannolika syfte med att nämna att politiker ändå utlovar minskad trängsel?",
    options: [
      "Att hylla politikers förmåga att lösa trafikproblem",
      "Att peka på en diskrepans mellan väldokumenterad forskning och politisk retorik",
      "Att bevisa att politiker aldrig läser forskning",
      "Att föreslå att all vägbyggnation ska stoppas omedelbart",
    ],
    correctIndex: 1,
    explanationShort: "Författaren kontrasterar den väldokumenterade forskningen med politikers fortsatta löften, och antyder en diskrepans.",
    explanationSteps: ["Ordet 'ändå' signalerar en motsättning mellan forskningsläget och politikers agerande.", "Syftet är att belysa denna diskrepans, inte att döma ut enskilda politiker."],
  },

  // ================= MEK - Meningskomplettering =================
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1300,
    stem: "Mätningarna avvek kraftigt från modellens förutsägelse, vilket gjorde hypotesen ___ och tvingade forskarna att ___ den.",
    options: ["osannolik / omvärdera", "sannolik / bekräfta", "osannolik / bekräfta", "sannolik / omvärdera"],
    correctIndex: 0,
    explanationShort: "Stora avvikelser från förutsägelsen gör hypotesen osannolik och tvingar fram en omvärdering.",
    explanationSteps: ["Om verkligheten avviker kraftigt från modellen blir hypotesen mindre trolig, inte mer.", "En osannolik hypotes måste omvärderas, inte bekräftas - det är den enda konsekventa kedjan."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1300,
    stem: "Ju fler undantag som lades till lagförslaget, desto ___ blev det ursprungliga syftet, tills kritiker menade att lagen blivit ___ tandlös.",
    options: ["tydligare / helt", "otydligare / praktiskt taget", "tydligare / praktiskt taget", "otydligare / knappast"],
    correctIndex: 1,
    explanationShort: "Fler undantag urholkar rimligen syftet och gör lagen så gott som tandlös.",
    explanationSteps: ["'Ju fler undantag, desto Y' kräver en logisk, negativ koppling till syftet.", "Fler undantag → otydligare syfte → kritiker menar att lagen blivit praktiskt taget (så gott som) tandlös."],
  },
  {
    subtest: "MEK", concept: "ordval-nyans", difficulty: 1350,
    stem: "Vittnets berättelse var i sig ___, men eftersom den saknade stöd i den tekniska bevisningen valde juryn att ___ den mindre vikt.",
    options: ["trovärdig / tillmäta", "orimlig / tillmäta", "trovärdig / frånta", "orimlig / frånta"],
    correctIndex: 0,
    explanationShort: "'Trovärdig i sig men utan stöd' skapar en kontrast som gör att juryn ändå gav (tillmätte) den mindre vikt.",
    explanationSteps: ["'X i sig, men eftersom Y' bygger på en motsättning mellan intryck och faktiskt bevisvärde.", "En trovärdig berättelse utan tekniskt stöd kan ändå tillmätas mindre vikt - 'frånta vikt' är inte idiomatiskt på samma sätt."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1300,
    stem: "Trots upprepade varningar valde ledningen att ___ riskerna, en hållning som i efterhand visade sig vara ___.",
    options: ["överdriva / klok", "bagatellisera / ödesdiger", "bagatellisera / förutseende", "uppmärksamma / ödesdiger"],
    correctIndex: 1,
    explanationShort: "'Trots varningar' i kombination med ett negativt utfall kräver att ledningen förminskade riskerna.",
    explanationSteps: ["Om ledningen ignorerade varningarna trots att de fanns, förminskade (bagatelliserade) de sannolikt riskerna.", "Att detta 'i efterhand visade sig vara' negativt bekräftas av ödesdiger, inte klok eller förutseende."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1450,
    stem: "Det första förslaget visade sig vara ___ redan efter en snabb granskning, men först efter månader av utredning kunde man fastslå att hela projektet varit ___ från början och borde ha ___ långt tidigare.",
    options: [
      "bristfälligt / dömt att misslyckas / avbrutits",
      "genomarbetat / framgångsrikt / fortsatt",
      "bristfälligt / framgångsrikt / avbrutits",
      "genomarbetat / dömt att misslyckas / fortsatt",
    ],
    correctIndex: 0,
    explanationShort: "Meningen kräver konsekvent negativ ton genom hela satsen: bristfälligt, dömt att misslyckas, borde ha avbrutits.",
    explanationSteps: ["'Redan efter en snabb granskning' visar att bristerna var uppenbara direkt.", "Slutsatsen efter månaders utredning ('dömt att misslyckas... borde ha avbrutits') måste vara logiskt konsekvent med den tidiga bedömningen."],
  },
  {
    subtest: "MEK", concept: "ordval-nyans", difficulty: 1300,
    stem: "Rapportens slutsatser byggde på ett ___ dataunderlag, vilket fick flera forskare att ___ resultaten offentligt.",
    options: ["robust / hylla", "bräckligt / ifrågasätta", "robust / ifrågasätta", "omfattande / bekräfta"],
    correctIndex: 1,
    explanationShort: "Ett bräckligt (svagt) dataunderlag förklarar rimligen varför forskare offentligt ifrågasatte resultaten.",
    explanationSteps: ["Orsakssambandet kräver att ett svagt underlag leder till kritik, inte beröm.", "'Bräckligt / ifrågasätta' är den enda konsekventa kombinationen."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1500,
    stem: "Kommissionens slutsats var långt ifrån ___ - den byggde snarare på ___ tolkningar av ett splittrat och ___ underlag.",
    options: [
      "entydig / motstridiga / bristfälligt",
      "tydlig / samstämmiga / robust",
      "osäker / enhälliga / tydligt",
      "entydig / samstämmiga / bristfälligt",
    ],
    correctIndex: 0,
    explanationShort: "'Långt ifrån entydig' kräver att slutsatsen var oklar, byggd på motstridiga tolkningar av ett bristfälligt underlag.",
    explanationSteps: ["'Långt ifrån X' innebär att motsatsen till X gäller genom hela meningen.", "Enda alternativet där alla tre luckor är sinsemellan konsekventa (oklar slutsats, motstridiga tolkningar, bristfälligt underlag) är A."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1450,
    stem: "Ju mer ___ debatten blev, desto ___ blev det att skilja sakargument från ren retorik, tills moderatorn till slut valde att ___ diskussionen helt.",
    options: [
      "upphettad / svårare / avbryta",
      "saklig / lättare / fortsätta",
      "upphettad / lättare / fortsätta",
      "saklig / svårare / avbryta",
    ],
    correctIndex: 0,
    explanationShort: "En alltmer upphettad debatt gör det rimligen svårare att särskilja sakargument, vilket motiverar att moderatorn till slut avbryter.",
    explanationSteps: ["'Ju mer X, desto Y' kräver en logisk, konsekvent koppling genom hela meningen.", "Endast 'upphettad / svårare / avbryta' håller ihop hela vägen till den avslutande konsekvensen."],
  },
  {
    subtest: "MEK", concept: "ordval-nyans", difficulty: 1550,
    stem: "Bolagets kvartalsrapport var ___ i sin ton men ___ i sitt innehåll - en kombination som fick flera analytiker att misstänka att ledningen medvetet försökte ___ de svaga siffrorna.",
    options: [
      "optimistisk / dyster / dölja",
      "dyster / optimistisk / lyfta fram",
      "optimistisk / dyster / lyfta fram",
      "saklig / saklig / dölja",
    ],
    correctIndex: 0,
    explanationShort: "Kontrasten mellan optimistisk ton och dystert innehåll väcker misstanke om att man försökte dölja de svaga siffrorna.",
    explanationSteps: ["'X i ton men Y i innehåll' kräver en tydlig kontrast mellan de två.", "Att dölja (inte lyfta fram) svaga siffror är den rimliga slutsatsen av en missvisande, alltför optimistisk ton."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1400,
    stem: "Trots att beviset i sig var ___, ansåg domstolen att det, tillsammans med den ___ vittnesutsagan, var ___ för en fällande dom.",
    options: [
      "svagt / trovärdiga / tillräckligt",
      "starkt / opålitliga / otillräckligt",
      "svagt / opålitliga / tillräckligt",
      "starkt / trovärdiga / otillräckligt",
    ],
    correctIndex: 0,
    explanationShort: "'Trots att svagt' kräver en kontrast där kombinationen ändå blir tillräcklig, vilket kräver en trovärdig vittnesutsaga.",
    explanationSteps: ["'Trots att X, ansåg man ändå Y' bygger på motsättning.", "Ett i sig svagt bevis kan bli tillräckligt tillsammans med en trovärdig (inte opålitlig) vittnesutsaga."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1500,
    stem: "Företagets ___ expansion under lågkonjunkturen visade sig i efterhand vara ___ snarare än det vågspel många kritiker ___ den för.",
    options: [
      "aggressiva / klok / utpekade",
      "försiktiga / klok / prisade",
      "aggressiva / förhastad / utpekade",
      "försiktiga / förhastad / prisade",
    ],
    correctIndex: 0,
    explanationShort: "'Snarare än det vågspel kritiker utpekade den för' kräver att expansionen (kallad ett vågspel, alltså aggressiv) visade sig klok.",
    explanationSteps: ["Ordet 'vågspel' signalerar att expansionen uppfattades som riskfylld, alltså aggressiv.", "'Snarare än' kräver att utfallet i efterhand var det motsatta av kritikernas negativa förväntan: klok, inte förhastad."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1350,
    stem: "Det var inte bristen på ___ som fällde projektet, utan den ___ kommunikationen mellan avdelningarna, vilket ledde till att samma arbete ___ flera gånger om.",
    options: [
      "resurser / undermåliga / gjordes",
      "resurser / utmärkta / uteblev",
      "idéer / undermåliga / uteblev",
      "idéer / utmärkta / gjordes",
    ],
    correctIndex: 0,
    explanationShort: "'Inte bristen på X, utan Y' pekar ut den verkliga orsaken: undermålig kommunikation som ledde till dubbelarbete.",
    explanationSteps: ["'Inte X, utan Y' identifierar den faktiska orsaken som Y.", "Undermålig kommunikation som orsak till att arbete gjordes om flera gånger är den enda logiskt konsekventa kombinationen."],
  },
  {
    subtest: "MEK", concept: "ordval-nyans", difficulty: 1450,
    stem: "Hypotesen var ___ elegant, men saknade helt ___ stöd - en kombination som gjorde att den, trots sin intellektuella charm, aldrig blev ___ av forskarsamhället.",
    options: [
      "visserligen / empiriskt / accepterad",
      "knappast / empiriskt / förkastad",
      "visserligen / teoretiskt / förkastad",
      "knappast / teoretiskt / accepterad",
    ],
    correctIndex: 0,
    explanationShort: "'Visserligen X, men saknade Y' bygger på kontrast: elegant i teorin men utan empiriskt stöd, vilket förklarar varför den aldrig accepterades.",
    explanationSteps: ["'Visserligen X, men Y' signalerar en motsättning mellan intryck och verkligt vetenskapligt värde.", "Avsaknad av empiriskt stöd förklarar logiskt varför hypotesen aldrig blev accepterad."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1500,
    stem: "De ___ signalerna från centralbanken tolkades av marknaden som ett tecken på att räntehöjningen skulle ___, vilket fick obligationsräntorna att ___ redan innan beskedet kom.",
    options: [
      "tvetydiga / utebli / sjunka",
      "tydliga / genomföras / stiga",
      "tydliga / utebli / stiga",
      "tvetydiga / genomföras / sjunka",
    ],
    correctIndex: 1,
    explanationShort: "Tydliga signaler om en förestående räntehöjning förklarar varför obligationsräntorna redan reagerade genom att stiga i förväg.",
    explanationSteps: ["Endast tydliga (inte tvetydiga) signaler ger marknaden underlag att agera i förväg.", "Att räntehöjningen 'skulle genomföras' är den kombination som logiskt förklarar att räntorna steg redan innan beskedet."],
  },

  // ================= ELF - Engelsk läsförståelse =================
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 1350,
    stem: "The word that is closest in meaning to \"UBIQUITOUS\" is:",
    options: ["Rare", "Omnipresent", "Hidden", "Temporary"],
    correctIndex: 1,
    explanationShort: "\"Ubiquitous\" means present or existing everywhere at once.",
    explanationSteps: ["Ubiquitous describes something found everywhere, all the time.", "'Omnipresent' captures this meaning most closely."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 1300,
    stem: "The word that is closest in meaning to \"CONVOLUTED\" is:",
    options: ["Simple", "Needlessly complex", "Short", "Obvious"],
    correctIndex: 1,
    explanationShort: "\"Convoluted\" means extremely complex and difficult to follow.",
    explanationSteps: ["A convoluted explanation is one that is unnecessarily intricate.", "'Needlessly complex' is the closest match."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1550,
    stem:
      "\"The committee's report, while ostensibly neutral, repeatedly emphasized the economic costs of the proposed regulation while relegating its public health benefits to a single footnote - a structural choice that speaks louder than any explicit conclusion.\"\n\nWhat does the passage suggest about the report?",
    options: [
      "It is completely balanced and neutral",
      "Its structure reveals an implicit bias despite claims of neutrality",
      "It focuses primarily on public health benefits",
      "It explicitly argues against the regulation",
    ],
    correctIndex: 1,
    explanationShort: "The passage argues that the report's structure (emphasis vs. footnote) undermines its claim of neutrality.",
    explanationSteps: ["'While ostensibly neutral' signals that the claimed neutrality is in question.", "The imbalance between emphasized costs and footnoted benefits reveals an implicit bias, as stated directly: 'speaks louder than any explicit conclusion'."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 1300,
    stem: "The word that is closest in meaning to \"CANDID\" is:",
    options: ["Deceptive", "Honest and direct", "Cautious", "Formal"],
    correctIndex: 1,
    explanationShort: "\"Candid\" means truthful and straightforward, without holding back.",
    explanationSteps: ["A candid answer is one given openly and honestly.", "'Honest and direct' is the closest match."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1450,
    stem:
      "\"Economists have long debated whether the correlation between education levels and income reflects a causal effect of schooling itself, or simply that individuals predisposed to earn more - due to family background, innate ability, or motivation - also tend to pursue more education.\"\n\nWhat is the central question raised in the passage?",
    options: [
      "Whether education is valuable at all",
      "Whether education causes higher income or merely correlates with pre-existing traits that also predict income",
      "Whether family background matters more than motivation",
      "Whether income determines educational access",
    ],
    correctIndex: 1,
    explanationShort: "The passage frames a classic causation-versus-correlation debate about education and income.",
    explanationSteps: ["The key contrast is 'causal effect of schooling' versus factors that predict both education and income independently.", "This is precisely the causation-versus-correlation question stated in the passage."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 1450,
    stem: "The word that is closest in meaning to \"OBSTREPEROUS\" is:",
    options: ["Quiet and calm", "Noisy and difficult to control", "Extremely polite", "Very organized"],
    correctIndex: 1,
    explanationShort: "\"Obstreperous\" means noisy, unruly, and difficult to control.",
    explanationSteps: ["An obstreperous crowd is loud and resistant to control.", "'Noisy and difficult to control' captures this meaning."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 1400,
    stem: "The word that is closest in meaning to \"CIRCUMSPECT\" is:",
    options: ["Reckless", "Cautious and wary", "Talkative", "Generous"],
    correctIndex: 1,
    explanationShort: "\"Circumspect\" means careful to consider all circumstances before acting.",
    explanationSteps: ["A circumspect person weighs risks carefully before acting.", "'Cautious and wary' is the closest match."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 1350,
    stem: "The word that is closest in meaning to \"VINDICATE\" is:",
    options: ["Accuse", "Clear of blame or suspicion", "Punish", "Ignore"],
    correctIndex: 1,
    explanationShort: "\"Vindicate\" means to clear someone of blame or suspicion, often by proving them right.",
    explanationSteps: ["To be vindicated is to be shown to have been right or justified all along.", "'Clear of blame or suspicion' captures this meaning."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 1500,
    stem: "The word that is closest in meaning to \"INSULAR\" is:",
    options: ["Open-minded and worldly", "Narrow-minded and isolated", "Extremely wealthy", "Highly educated"],
    correctIndex: 1,
    explanationShort: "\"Insular\" means narrow-minded and cut off from outside influences, like an isolated island.",
    explanationSteps: ["Insular attitudes reflect a lack of exposure to outside perspectives.", "'Narrow-minded and isolated' is the closest match."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 1300,
    stem: "The word that is closest in meaning to \"PRECARIOUS\" is:",
    options: ["Stable and secure", "Dangerously uncertain", "Extremely expensive", "Well documented"],
    correctIndex: 1,
    explanationShort: "\"Precarious\" describes a situation that is dangerously unstable or uncertain.",
    explanationSteps: ["A precarious position is one that could easily collapse or go wrong.", "'Dangerously uncertain' captures this meaning."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1500,
    stem:
      "\"It is tempting to credit the sharp decline in a city's crime rate to the policing strategy implemented the same year, but doing so ignores the possibility that the strategy was adopted precisely because crime was already trending downward for unrelated reasons - a form of reverse causation that plagues much of applied criminology.\"\n\nWhat methodological problem does the passage describe?",
    options: [
      "Crime rates are impossible to measure accurately",
      "A policy may appear effective simply because it coincided with a pre-existing trend",
      "Policing strategies are never effective",
      "Criminologists refuse to study crime trends",
    ],
    correctIndex: 1,
    explanationShort: "The passage describes reverse causation: the trend may have preceded and caused the policy's adoption, not the other way around.",
    explanationSteps: ["The phrase 'reverse causation' names the exact problem.", "The example shows a policy appearing effective merely by coinciding with an already-existing trend."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1400,
    stem:
      "\"The novelist's prose, often praised for its restraint, achieves its emotional force not through what is stated but through what is conspicuously left unsaid.\"\n\nAccording to the passage, how does the novelist achieve emotional impact?",
    options: [
      "Through detailed, explicit description",
      "Through deliberate omission rather than explicit statement",
      "Through excessive use of dialogue",
      "Through footnotes and commentary",
    ],
    correctIndex: 1,
    explanationShort: "The passage states the impact comes from what is 'left unsaid', not from explicit statement.",
    explanationSteps: ["'Not through what is stated but through what is... left unsaid' directly identifies omission as the source of impact."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1550,
    stem:
      "\"To describe the merger as a failure is to accept the premise that its stated goals were ever the real ones; a more skeptical reading suggests the stated goals served chiefly to secure shareholder approval, while the underlying motive - eliminating a competitor - was achieved regardless of the merger's public performance.\"\n\nWhat does the passage suggest about the merger's true purpose?",
    options: [
      "It genuinely failed to achieve any of its goals",
      "Its real motive, eliminating a competitor, may have succeeded even if its stated goals did not",
      "Shareholders were never informed of the merger",
      "The merger had no stated goals at all",
    ],
    correctIndex: 1,
    explanationShort: "The passage argues the 'real' motive (eliminating a competitor) is distinct from, and may have succeeded independently of, the publicly stated goals.",
    explanationSteps: ["The passage separates 'stated goals' from the 'underlying motive'.", "It explicitly states the underlying motive 'was achieved regardless of the merger's public performance'."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1350,
    stem:
      "\"Critics who dismiss the exhibit as mere spectacle overlook that spectacle and substance are not mutually exclusive; a work can dazzle the eye while still rewarding sustained, careful attention.\"\n\nWhat is the author's main point?",
    options: [
      "Spectacle and substance cannot coexist in the same work",
      "A visually striking work can also have genuine depth",
      "The exhibit lacks any real substance",
      "Critics are always right about art",
    ],
    correctIndex: 1,
    explanationShort: "The passage explicitly argues spectacle and substance 'are not mutually exclusive' - a work can be both visually striking and substantive.",
    explanationSteps: ["The author directly rejects the premise that spectacle and substance exclude each other.", "'A work can dazzle the eye while still rewarding sustained... attention' confirms both can coexist."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1450,
    stem:
      "\"The apparent paradox - that societies grow more anxious about safety even as objective risks decline - dissolves once one accounts for the expanding scope of what counts as a risk worth worrying about.\"\n\nHow does the passage resolve the described paradox?",
    options: [
      "By denying that risks have actually declined",
      "By pointing out that the definition of 'risk worth worrying about' has broadened over time",
      "By arguing that anxiety is irrational and should be ignored",
      "By claiming that safety has not improved at all",
    ],
    correctIndex: 1,
    explanationShort: "The passage resolves the paradox by noting that the scope of what counts as risk has expanded, not that risks have failed to decline.",
    explanationSteps: ["The paradox is resolved, not denied - the passage accepts that objective risks have declined.", "The resolution lies in the 'expanding scope of what counts as a risk worth worrying about'."],
  },

  // ================= XYZ - Matematisk problemlösning =================
  {
    subtest: "XYZ", concept: "procent", difficulty: 1400,
    stem: "En vara kostar ursprungligen 800 kr. Priset höjs först med 25 % och sänks sedan med 20 %. Vad blir slutpriset?",
    options: ["720 kr", "760 kr", "800 kr", "840 kr"],
    correctIndex: 2,
    explanationShort: "800 × 1,25 × 0,80 = 800 kr - höjningen och sänkningen tar exakt ut varandra.",
    explanationSteps: ["Efter höjning: 800 × 1,25 = 1000 kr.", "Efter sänkning: 1000 × 0,80 = 800 kr.", "Slutpriset är samma som ursprungspriset."],
  },
  {
    subtest: "XYZ", concept: "proportionalitet", difficulty: 1350,
    stem: "Tre vänner delar en vinst i förhållandet 2:3:5. Den som fick minst andel fick 4 000 kr. Hur stor var den totala vinsten?",
    options: ["16 000 kr", "18 000 kr", "20 000 kr", "24 000 kr"],
    correctIndex: 2,
    explanationShort: "2 delar = 4000 kr → 1 del = 2000 kr → totalt 10 delar = 20 000 kr.",
    explanationSteps: ["Minsta andelen (2 delar) = 4000 kr, så 1 del = 2000 kr.", "Totalt antal delar: 2+3+5 = 10.", "Total vinst: 10 × 2000 = 20 000 kr."],
  },
  {
    subtest: "XYZ", concept: "geometri", difficulty: 1450,
    stem: "Ett rätblock har volymen 360 cm³. Längden är 10 cm och bredden är 6 cm. Hur stor är rätblockets totala ytarea?",
    options: ["276 cm²", "300 cm²", "312 cm²", "336 cm²"],
    correctIndex: 2,
    explanationShort: "Höjden är 6 cm, vilket ger en total ytarea på 312 cm².",
    explanationSteps: ["Höjd: 360 / (10×6) = 6 cm.", "Ytarea = 2(lb + lh + bh) = 2(60+60+36) = 2×156 = 312 cm²."],
  },
  {
    subtest: "XYZ", concept: "algebra", difficulty: 1500,
    stem: "I en klass är förhållandet mellan pojkar och flickor 3:4. Om 6 pojkar till börjar i klassen blir förhållandet 1:1. Hur många elever gick i klassen från början?",
    options: ["35", "38", "42", "45"],
    correctIndex: 2,
    explanationShort: "Ursprungligen 18 pojkar och 24 flickor, totalt 42 elever.",
    explanationSteps: ["Låt pojkar = 3k, flickor = 4k.", "(3k + 6) / 4k = 1 → 3k + 6 = 4k → k = 6.", "Pojkar = 18, flickor = 24, totalt 42 elever."],
  },
  {
    subtest: "XYZ", concept: "procent", difficulty: 1300,
    stem: "En sparare sätter in 10 000 kr med 5 % årlig ränta (enkel ränta, ej ränta-på-ränta). Efter hur många år har beloppet vuxit till 13 000 kr?",
    options: ["5 år", "6 år", "7 år", "8 år"],
    correctIndex: 1,
    explanationShort: "Räntan ger 500 kr per år, och 3000/500 = 6 år krävs.",
    explanationSteps: ["Årlig ränta: 10 000 × 0,05 = 500 kr.", "Tillväxt som krävs: 13 000 - 10 000 = 3000 kr.", "Antal år: 3000 / 500 = 6 år."],
  },
  {
    subtest: "XYZ", concept: "algebra", difficulty: 1450,
    stem: "En funktion ges av f(x) = 2x² - 3x + 1. Vad är f(-2)?",
    options: ["11", "13", "15", "17"],
    correctIndex: 2,
    explanationShort: "f(-2) = 2(-2)² - 3(-2) + 1 = 8 + 6 + 1 = 15.",
    explanationSteps: ["Sätt in x = -2: 2×(-2)² - 3×(-2) + 1.", "2×4 + 6 + 1 = 8 + 6 + 1 = 15."],
  },
  {
    subtest: "XYZ", concept: "geometri", difficulty: 1400,
    stem: "En rätvinklig triangel har kateterna 9 cm och 12 cm. Vad är triangelns omkrets?",
    options: ["30 cm", "33 cm", "36 cm", "39 cm"],
    correctIndex: 2,
    explanationShort: "Hypotenusan är 15 cm (Pythagoras sats), vilket ger omkretsen 36 cm.",
    explanationSteps: ["Hypotenusan: √(9²+12²) = √225 = 15 cm.", "Omkrets: 9 + 12 + 15 = 36 cm."],
  },
  {
    subtest: "XYZ", concept: "algebra", difficulty: 1500,
    stem: "Om 2^(x+1) = 32, vad är x?",
    options: ["3", "4", "5", "6"],
    correctIndex: 1,
    explanationShort: "32 = 2⁵, så x+1 = 5, vilket ger x = 4.",
    explanationSteps: ["Skriv 32 som en tvåpotens: 32 = 2⁵.", "Då måste x + 1 = 5, alltså x = 4."],
  },
  {
    subtest: "XYZ", concept: "geometri", difficulty: 1350,
    stem: "En cylinder har radien 3 cm och höjden 10 cm. Vad är cylinderns volym, avrundat till närmaste heltal (använd π ≈ 3,14)?",
    options: ["251 cm³", "267 cm³", "283 cm³", "301 cm³"],
    correctIndex: 2,
    explanationShort: "Volym = πr²h = 3,14 × 9 × 10 = 282,6 ≈ 283 cm³.",
    explanationSteps: ["Formeln för cylinderns volym: πr²h.", "3,14 × 3² × 10 = 3,14 × 9 × 10 = 282,6 ≈ 283 cm³."],
  },
  {
    subtest: "XYZ", concept: "algebra", difficulty: 1450,
    stem: "Om log₂(x) = 5, vad är x?",
    options: ["16", "24", "32", "64"],
    correctIndex: 2,
    explanationShort: "log₂(x) = 5 betyder att x = 2⁵ = 32.",
    explanationSteps: ["Logaritmen log₂(x) = 5 översätts till x = 2⁵.", "2⁵ = 32."],
  },
  {
    subtest: "XYZ", concept: "geometri", difficulty: 1500,
    stem: "En rätvinklig triangel har hypotenusan 13 cm och en katet 5 cm. Vad är triangelns area?",
    options: ["24 cm²", "28 cm²", "30 cm²", "32 cm²"],
    correctIndex: 2,
    explanationShort: "Den andra kateten är 12 cm (Pythagoras sats), vilket ger arean 30 cm².",
    explanationSteps: ["Andra kateten: √(13² - 5²) = √144 = 12 cm.", "Area = (5 × 12) / 2 = 30 cm²."],
  },
  {
    subtest: "XYZ", concept: "algebra", difficulty: 1400,
    stem: "x³ = -8. Vad är x?",
    options: ["-4", "-2", "2", "4"],
    correctIndex: 1,
    explanationShort: "(-2)³ = -8, så x = -2.",
    explanationSteps: ["Sök det tal vars kub är -8.", "(-2)³ = -2 × -2 × -2 = -8, så x = -2."],
  },
  {
    subtest: "XYZ", concept: "geometri", difficulty: 1550,
    stem: "En rät linje går genom punkterna (2, 5) och (6, 13). Vad är linjens ekvation?",
    options: ["y = 2x + 1", "y = 2x + 3", "y = x + 3", "y = 3x - 1"],
    correctIndex: 0,
    explanationShort: "Linjens lutning är 2, och med punkten (2,5) ger det ekvationen y = 2x + 1.",
    explanationSteps: ["Lutning: (13-5)/(6-2) = 8/4 = 2.", "Med punkten (2,5): y - 5 = 2(x - 2) → y = 2x + 1."],
  },
  {
    subtest: "XYZ", concept: "proportionalitet", difficulty: 1350,
    stem: "Ett tåg som är 200 meter långt kör i 72 km/h genom en tunnel som är 400 meter lång. Hur lång tid tar det för tåget att helt passera genom tunneln (från att fronten går in till att sista vagnen kommer ut)?",
    options: ["20 sekunder", "25 sekunder", "30 sekunder", "35 sekunder"],
    correctIndex: 2,
    explanationShort: "72 km/h motsvarar 20 m/s, och den totala sträckan är 600 m, vilket ger 30 sekunder.",
    explanationSteps: ["72 km/h = 20 m/s.", "Total sträcka = tunnelns längd + tågets längd = 400 + 200 = 600 m.", "Tid = 600 / 20 = 30 sekunder."],
  },
  {
    subtest: "XYZ", concept: "procent", difficulty: 1500,
    stem: "Hur många liter ren alkohol finns totalt om man blandar 5 liter av en lösning som är 40 % alkohol med 3 liter av en lösning som är 20 % alkohol?",
    options: ["2,0 liter", "2,3 liter", "2,6 liter", "2,9 liter"],
    correctIndex: 2,
    explanationShort: "Från första lösningen: 2,0 liter alkohol. Från andra: 0,6 liter. Totalt 2,6 liter.",
    explanationSteps: ["Första lösningen: 5 × 0,40 = 2,0 liter ren alkohol.", "Andra lösningen: 3 × 0,20 = 0,6 liter ren alkohol.", "Totalt: 2,0 + 0,6 = 2,6 liter."],
  },
  {
    subtest: "XYZ", concept: "algebra", difficulty: 1450,
    stem: "Vad är summan av alla heltal från 1 till 50?",
    options: ["1225", "1250", "1275", "1300"],
    correctIndex: 2,
    explanationShort: "Summan av 1 till n ges av n(n+1)/2, vilket för n=50 blir 1275.",
    explanationSteps: ["Formeln för summan av 1 till n: n(n+1)/2.", "Med n = 50: 50 × 51 / 2 = 1275."],
  },
  {
    subtest: "XYZ", concept: "geometri", difficulty: 1400,
    stem: "En triangel har vinklarna x, 2x och 3x grader. Vad är den största vinkeln?",
    options: ["60°", "75°", "90°", "105°"],
    correctIndex: 2,
    explanationShort: "Vinkelsumman ger x = 30°, så den största vinkeln (3x) är 90°.",
    explanationSteps: ["Vinkelsumman i en triangel är 180°: x + 2x + 3x = 6x = 180° → x = 30°.", "Den största vinkeln är 3x = 90°."],
  },
  {
    subtest: "XYZ", concept: "procent", difficulty: 1550,
    stem: "En vara säljs för 250 kr med en vinstmarginal på 25 % av inköpspriset. Vad var inköpspriset?",
    options: ["190 kr", "195 kr", "200 kr", "210 kr"],
    correctIndex: 2,
    explanationShort: "Försäljningspriset är inköpspriset × 1,25, vilket ger inköpspriset 200 kr.",
    explanationSteps: ["Försäljningspris = inköpspris × 1,25.", "Inköpspris = 250 / 1,25 = 200 kr."],
  },
  {
    subtest: "XYZ", concept: "algebra", difficulty: 1500,
    stem: "Vad är det minsta positiva heltalet som är delbart med både 12 och 18?",
    options: ["24", "30", "36", "72"],
    correctIndex: 2,
    explanationShort: "Minsta gemensamma multipeln av 12 och 18 är 36.",
    explanationSteps: ["12 = 2² × 3 och 18 = 2 × 3².", "Minsta gemensamma multipel: 2² × 3² = 36."],
  },

  // ================= KVA - Kvantitativa jämförelser =================
  {
    subtest: "KVA", concept: "geometri", difficulty: 1300,
    stem: "En cirkel har radie 5.\nKvantitet I: Cirkelns omkrets\nKvantitet II: Cirkelns area / 3",
    options: COMPARISON_OPTIONS,
    correctIndex: 0,
    explanationShort: "Omkretsen (10π) är alltid större än area/3 (25π/3), oavsett π:s exakta värde.",
    explanationSteps: ["Omkrets = 2πr = 10π.", "Area/3 = πr²/3 = 25π/3.", "10π jämfört med 25π/3 motsvarar 30π jämfört med 25π (multiplicera båda med 3) - och 30 > 25 gäller alltid, så Kvantitet I är större."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1500,
    stem: "x + y = 12, xy = 32\nKvantitet I: x² + y²\nKvantitet II: 80",
    options: COMPARISON_OPTIONS,
    correctIndex: 2,
    explanationShort: "x² + y² = (x+y)² - 2xy = 144 - 64 = 80. Kvantiteterna är lika.",
    explanationSteps: ["(x+y)² = x² + 2xy + y² = 144.", "x² + y² = 144 - 2xy = 144 - 64 = 80.", "80 = 80, kvantiteterna är lika."],
  },
  {
    subtest: "KVA", concept: "geometri", difficulty: 1400,
    stem: "En cirkel är inskriven i en kvadrat med sidan 8.\nKvantitet I: Cirkelns area\nKvantitet II: 50",
    options: COMPARISON_OPTIONS,
    correctIndex: 0,
    explanationShort: "Cirkelns radie är 4, arean blir π×16 ≈ 50,3, vilket är större än 50.",
    explanationSteps: ["En inskriven cirkel har diameter lika med kvadratens sida: diameter 8, radie 4.", "Area = π × 4² = 16π ≈ 50,3.", "50,3 > 50, så Kvantitet I är större."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1600,
    stem: "n är ett positivt heltal.\nKvantitet I: Resten när n² divideras med 4\nKvantitet II: Resten när n divideras med 2",
    options: COMPARISON_OPTIONS,
    correctIndex: 2,
    explanationShort: "Oavsett om n är jämnt eller udda blir resterna alltid lika (0=0 eller 1=1).",
    explanationSteps: ["Om n är jämnt: n² är delbart med 4 (rest 0), och n delbart med 2 (rest 0).", "Om n är udda: n² ger alltid rest 1 vid division med 4, och n ger rest 1 vid division med 2.", "I båda fallen är resterna lika - kvantiteterna är lika."],
  },
  {
    subtest: "KVA", concept: "geometri", difficulty: 1500,
    stem: "a, b och c är sidorna i en triangel där a = 7 och b = 24.\nKvantitet I: c\nKvantitet II: 25",
    options: COMPARISON_OPTIONS,
    correctIndex: 3,
    explanationShort: "c kan anta många värden mellan 17 och 31 - inget säger att triangeln är rätvinklig.",
    explanationSteps: ["Triangelolikheten ger 24-7 < c < 24+7, det vill säga 17 < c < 31.", "c skulle kunna vara till exempel 20 (mindre än 25) eller 26 (större än 25).", "Utan mer information går det inte att avgöra."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1350,
    stem: "Kvantitet I: Antalet primtal mellan 1 och 20\nKvantitet II: 8",
    options: COMPARISON_OPTIONS,
    correctIndex: 2,
    explanationShort: "Primtalen 2, 3, 5, 7, 11, 13, 17, 19 är exakt 8 stycken.",
    explanationSteps: ["Primtal mellan 1 och 20: 2, 3, 5, 7, 11, 13, 17, 19.", "Det är 8 primtal, vilket är lika med Kvantitet II."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1400,
    stem: "Kvantitet I: x, där x² - 6x + 9 = 0\nKvantitet II: 3",
    options: COMPARISON_OPTIONS,
    correctIndex: 2,
    explanationShort: "(x-3)² = 0 ger endast lösningen x = 3, så kvantiteterna är lika.",
    explanationSteps: ["x² - 6x + 9 kan faktoriseras som (x-3)².", "(x-3)² = 0 ger den enda lösningen x = 3.", "3 = 3, kvantiteterna är lika."],
  },
  {
    subtest: "KVA", concept: "geometri", difficulty: 1300,
    stem: "En rektangel har arean 48 cm² och heltalssidor.\nKvantitet I: Minsta möjliga omkrets\nKvantitet II: 28 cm",
    options: COMPARISON_OPTIONS,
    correctIndex: 2,
    explanationShort: "Sidorna 6×8 ger den minsta omkretsen bland heltalsfaktoriseringar av 48, exakt 28 cm.",
    explanationSteps: ["Heltalsfaktoriseringar av 48: 1×48, 2×24, 3×16, 4×12, 6×8.", "Omkretsen minimeras när sidorna ligger närmast varandra: 6×8 ger 2(6+8) = 28 cm.", "28 = 28, kvantiteterna är lika."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1450,
    stem: "p och q är olika primtal, båda större än 1.\nKvantitet I: p + q\nKvantitet II: p × q",
    options: COMPARISON_OPTIONS,
    correctIndex: 1,
    explanationShort: "Produkten av två olika primtal är alltid större än deras summa.",
    explanationSteps: ["pq - (p+q) = (p-1)(q-1) - 1.", "Eftersom p och q är olika primtal (minst 2 och 3) är (p-1)(q-1) ≥ 2, så uttrycket är alltid positivt.", "Produkten är alltså alltid större än summan: Kvantitet II är större."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1300,
    stem: "Kvantitet I: 7/9\nKvantitet II: 11/13",
    options: COMPARISON_OPTIONS,
    correctIndex: 1,
    explanationShort: "Genom korsmultiplikation ser man att 11/13 är större än 7/9.",
    explanationSteps: ["Jämför genom korsmultiplikation: 7×13 = 91 och 11×9 = 99.", "Eftersom 99 > 91 är 11/13 > 7/9.", "Kvantitet II är större."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1400,
    stem: "x > 1\nKvantitet I: x/(x-1)\nKvantitet II: (x+1)/x",
    options: COMPARISON_OPTIONS,
    correctIndex: 0,
    explanationShort: "Skillnaden mellan kvantiteterna är alltid positiv för x > 1, så Kvantitet I är alltid större.",
    explanationSteps: ["Kvantitet I - Kvantitet II = [x² - (x+1)(x-1)] / [x(x-1)] = [x² - (x²-1)] / [x(x-1)] = 1 / [x(x-1)].", "För x > 1 är x(x-1) alltid positivt, så uttrycket är alltid positivt.", "Kvantitet I är alltid större."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1450,
    stem: "a, b, c är positiva tal där a < b < c och a + b + c = 30.\nKvantitet I: c\nKvantitet II: 10",
    options: COMPARISON_OPTIONS,
    correctIndex: 0,
    explanationShort: "Eftersom c är strikt störst av de tre talen måste c vara större än medelvärdet 10.",
    explanationSteps: ["Eftersom a < c och b < c gäller a + b < 2c.", "Då blir 30 - c < 2c, vilket ger 30 < 3c, alltså c > 10.", "Kvantitet I är alltid större."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1350,
    stem: "Kvantitet I: 5⁷ / 5⁵\nKvantitet II: 5² × 4",
    options: COMPARISON_OPTIONS,
    correctIndex: 1,
    explanationShort: "5⁷/5⁵ = 25, medan 5²×4 = 100, så Kvantitet II är större.",
    explanationSteps: ["5⁷/5⁵ = 5² = 25.", "5² × 4 = 25 × 4 = 100.", "100 > 25, Kvantitet II är större."],
  },
  {
    subtest: "KVA", concept: "geometri", difficulty: 1500,
    stem: "Rektangel R1 har sidorna a och b. Rektangel R2 har sidorna 2a och b/2.\nKvantitet I: Arean av R1\nKvantitet II: Arean av R2",
    options: COMPARISON_OPTIONS,
    correctIndex: 2,
    explanationShort: "Båda rektanglarna har samma area, ab, så kvantiteterna är lika.",
    explanationSteps: ["Area R1 = a × b.", "Area R2 = 2a × b/2 = ab.", "Kvantiteterna är lika."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1400,
    stem: "x² + y² = 25, xy = 12\nKvantitet I: (x + y)²\nKvantitet II: 49",
    options: COMPARISON_OPTIONS,
    correctIndex: 2,
    explanationShort: "(x+y)² = x²+2xy+y² = 25+24 = 49, så kvantiteterna är lika.",
    explanationSteps: ["(x+y)² = x² + 2xy + y².", "= 25 + 2×12 = 25 + 24 = 49.", "Kvantiteterna är lika."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1550,
    stem: "n är ett heltal, n > 2.\nKvantitet I: n! (n fakultet)\nKvantitet II: 2ⁿ",
    options: COMPARISON_OPTIONS,
    correctIndex: 3,
    explanationShort: "För n=3 är 2ⁿ störst, men för n=4 och uppåt är n! störst - svaret beror på n.",
    explanationSteps: ["För n=3: 3!=6 och 2³=8, så Kvantitet II är större.", "För n=4: 4!=24 och 2⁴=16, så Kvantitet I är större.", "Eftersom svaret beror på n går det inte att avgöra."],
  },
  {
    subtest: "KVA", concept: "sannolikhet-statistik", difficulty: 1300,
    stem: "Kvantitet I: Medianvärdet av 4, 7, 9, 15, 22\nKvantitet II: Medelvärdet av samma tal",
    options: COMPARISON_OPTIONS,
    correctIndex: 1,
    explanationShort: "Medianen är 9, medelvärdet är 11,4, så Kvantitet II är större.",
    explanationSteps: ["Medianen (mittersta värdet i den sorterade listan) är 9.", "Medelvärdet är (4+7+9+15+22)/5 = 57/5 = 11,4.", "11,4 > 9, Kvantitet II är större."],
  },
  {
    subtest: "KVA", concept: "geometri", difficulty: 1450,
    stem: "En cirkel har omkretsen numeriskt lika stor som arean (utan enheter).\nKvantitet I: Cirkelns radie\nKvantitet II: 2",
    options: COMPARISON_OPTIONS,
    correctIndex: 2,
    explanationShort: "Villkoret 2πr = πr² ger radien exakt 2, så kvantiteterna är lika.",
    explanationSteps: ["2πr = πr² ger, efter division med πr, att 2 = r.", "Radien är alltså exakt 2.", "Kvantiteterna är lika."],
  },
  {
    subtest: "KVA", concept: "sannolikhet-statistik", difficulty: 1400,
    stem: "Kvantitet I: Antalet sätt att välja 2 personer ur en grupp på 5, utan hänsyn till ordning\nKvantitet II: 10",
    options: COMPARISON_OPTIONS,
    correctIndex: 2,
    explanationShort: "Antalet sätt att välja 2 av 5 utan hänsyn till ordning är exakt 10.",
    explanationSteps: ["Antalet kombinationer: 5! / (2! × 3!) = (5×4)/(2×1) = 10.", "Kvantiteterna är lika."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1500,
    stem: "x + 1/x = 3, där x > 0\nKvantitet I: x² + 1/x²\nKvantitet II: 7",
    options: COMPARISON_OPTIONS,
    correctIndex: 2,
    explanationShort: "(x+1/x)² = x²+2+1/x² = 9, vilket ger x²+1/x² = 7. Kvantiteterna är lika.",
    explanationSteps: ["(x + 1/x)² = x² + 2 + 1/x² = 9.", "Alltså x² + 1/x² = 9 - 2 = 7.", "Kvantiteterna är lika."],
  },

  // ================= NOG - Kvantitativa resonemang =================
  {
    subtest: "NOG", concept: "ekvationer", difficulty: 1300,
    stem: "Är x ett positivt tal?\n(1) x² = 25\n(2) x + 3 > 0",
    options: NOG_OPTIONS,
    correctIndex: 2,
    explanationShort: "Var för sig räcker varken (1) eller (2), men tillsammans utesluts x = -5 och endast x = 5 återstår.",
    explanationSteps: ["(1): x² = 25 ger x = 5 eller x = -5 - avgör inte tecken. Otillräckligt ensamt.", "(2): x + 3 > 0 ger x > -3, vilket tillåter både positiva tal och negativa tal som -1 eller -2. Otillräckligt ensamt.", "Tillsammans: x måste vara 5 eller -5 (från 1) OCH större än -3 (från 2). Endast x = 5 uppfyller båda, så x är positivt. Svar C."],
  },
  {
    subtest: "NOG", concept: "procent", difficulty: 1300,
    stem: "Är A större än B?\n(1) A är 120 % av B\n(2) B är ett positivt tal",
    options: NOG_OPTIONS,
    correctIndex: 2,
    explanationShort: "(1) ensamt avgör inte tecknet på B, och (2) ensamt säger inget om A - men tillsammans räcker de.",
    explanationSteps: ["(1): A = 1,2B. Om B är negativt, t.ex. B=-10, blir A=-12, vilket är MINDRE än B. Otillräckligt ensamt eftersom B:s tecken är okänt.", "(2): B > 0 säger inget alls om A. Otillräckligt ensamt.", "Tillsammans: A = 1,2B med B > 0 ger alltid A > B (eftersom 0,2B > 0). Svar C."],
  },
  {
    subtest: "NOG", concept: "ekvationer", difficulty: 1550,
    stem: "Är x ett positivt heltal?\n(1) x³ = x\n(2) x² = 1",
    options: NOG_OPTIONS,
    correctIndex: 4,
    explanationShort: "Båda villkoren tillsammans ger x = 1 eller x = -1 - fortfarande inte säkert positivt.",
    explanationSteps: ["(1): x³ = x ger x(x-1)(x+1) = 0, alltså x = 0, 1 eller -1. Otillräckligt ensamt.", "(2): x² = 1 ger x = 1 eller -1. Otillräckligt ensamt.", "Tillsammans: x = 1 eller -1 (skärningen) - fortfarande osäkert om x är positivt. Även tillsammans otillräckligt: svar E."],
  },
  {
    subtest: "NOG", concept: "algebra", difficulty: 1500,
    stem: "Är x² mindre än x?\n(1) 0 < x < 1\n(2) x är negativt",
    options: NOG_OPTIONS,
    correctIndex: 3,
    explanationShort: "Båda påståendena ger var för sig ett bestämt svar (ja respektive nej).",
    explanationSteps: ["(1): Om 0<x<1, till exempel x=0,5, är x²=0,25<0,5=x. Alltid sant här - tillräckligt.", "(2): Om x är negativt är x² alltid positivt och därmed större än x. Ett bestämt 'nej' - också tillräckligt.", "Vardera påståendet räcker för att ge ett entydigt svar: svar D."],
  },
  {
    subtest: "NOG", concept: "procent", difficulty: 1350,
    stem: "Ett företag hade en omsättning på 5 miljoner kr förra året. Vad blir omsättningen i år?\n(1) Omsättningen väntas öka med samma procentsats som förra året\n(2) Förra årets ökning var 8 %",
    options: NOG_OPTIONS,
    correctIndex: 2,
    explanationShort: "Man behöver både att samma procentsats gäller och vilken procentsats det var.",
    explanationSteps: ["(1) ensamt: ingen faktisk procentsats anges. Otillräckligt.", "(2) ensamt: ger fjolårets ökning, men inte om samma sats gäller i år. Otillräckligt.", "Tillsammans: 5 × 1,08 = 5,4 miljoner kr. Svar C."],
  },
  {
    subtest: "NOG", concept: "algebra", difficulty: 1400,
    stem: "Är a > b?\n(1) a² > b²\n(2) a > 0 och b > 0",
    options: NOG_OPTIONS,
    correctIndex: 2,
    explanationShort: "Man behöver veta att båda är positiva för att kunna dra roten ur olikheten korrekt.",
    explanationSteps: ["(1) ensamt: a²>b² räcker inte om tecknen skiljer sig (t.ex. a=-5, b=1). Otillräckligt.", "(2) ensamt: säger bara att båda är positiva, ingen jämförelse. Otillräckligt.", "Tillsammans: med a,b positiva ger a²>b² att a>b. Svar C."],
  },
  {
    subtest: "NOG", concept: "ekvationer", difficulty: 1450,
    stem: "x och y är heltal. Är xy jämnt?\n(1) x är jämnt\n(2) x + y är udda",
    options: NOG_OPTIONS,
    correctIndex: 3,
    explanationShort: "Båda påståendena räcker var för sig för att garantera att xy är jämnt.",
    explanationSteps: ["(1): Om x är jämnt är xy alltid jämnt, oavsett y. Tillräckligt ensamt.", "(2): Om x+y är udda måste ena talet vara jämnt och det andra udda, så xy = jämnt × udda = jämnt. Tillräckligt ensamt.", "Vardera räcker: svar D."],
  },
  {
    subtest: "NOG", concept: "logik", difficulty: 1400,
    stem: "Fyra vänner - Elin, Filip, Greta och Hugo - står i kö efter varandra. Vem står först?\n(1) Filip står precis efter Elin.\n(2) Hugo står sist, och Greta står precis före Hugo.",
    options: NOG_OPTIONS,
    correctIndex: 2,
    explanationShort: "Man behöver båda uppgifterna för att placera alla fyra personer i kön.",
    explanationSteps: ["(1) ensamt: Elin och Filip står intill varandra i den ordningen, men positionen i kön är okänd. Otillräckligt.", "(2) ensamt: Placerar bara Greta (3:a) och Hugo (4:a) - ordningen mellan Elin och Filip på plats 1-2 är okänd. Otillräckligt.", "Tillsammans: Greta=3, Hugo=4, och eftersom Filip står precis efter Elin måste Elin=1, Filip=2. Svar C."],
  },
  {
    subtest: "NOG", concept: "logik", difficulty: 1450,
    stem: "I en tävling deltar tre lag: Röd, Blå och Grön. Ett lag vann, ett kom tvåa och ett kom trea. Vilket lag vann?\n(1) Röd kom inte sist.\n(2) Blå kom sist.",
    options: NOG_OPTIONS,
    correctIndex: 4,
    explanationShort: "Även tillsammans avgör påståendena inte om Röd eller Grön kom först.",
    explanationSteps: ["(1) ensamt: Röd är 1:a eller 2:a - avgör inte vem som vann. Otillräckligt.", "(2) ensamt: Blå kom sist (3:a) - säger inget om ordningen mellan Röd och Grön. Otillräckligt.", "Tillsammans: Blå=3:a, och Röd/Grön delar platserna 1-2 - men det går fortfarande inte att avgöra vilket av dem som vann. Svar E."],
  },
  {
    subtest: "NOG", concept: "algebra", difficulty: 1400,
    stem: "Är xy > 0?\n(1) x + y = 0\n(2) x ≠ 0",
    options: NOG_OPTIONS,
    correctIndex: 0,
    explanationShort: "(1) ensamt räcker för att ge ett bestämt 'nej', oavsett värdet på x.",
    explanationSteps: ["(1): Om x+y=0 är y=-x, så xy = -x². Oavsett om x är 0 eller inte är -x² alltid ≤ 0, aldrig >0 - ett bestämt 'nej'. Tillräckligt ensamt.", "(2): x≠0 säger inget om y eller produkten xy. Otillräckligt ensamt.", "Svar A."],
  },
  {
    subtest: "NOG", concept: "ekvationer", difficulty: 1350,
    stem: "Ett lag har spelat 21 matcher. Hur många har de vunnit?\n(1) De har vunnit dubbelt så många matcher som de förlorat.\n(2) De har inte spelat oavgjort i någon match.",
    options: NOG_OPTIONS,
    correctIndex: 2,
    explanationShort: "Man behöver både förhållandet mellan vinster/förluster och att inga matcher slutat oavgjort.",
    explanationSteps: ["(1) ensamt: ger bara ett förhållande, men vet inte om oavgjorda matcher finns. Otillräckligt.", "(2) ensamt: inga oavgjorda matcher, men inget förhållande mellan vinster och förluster. Otillräckligt.", "Tillsammans: vinster + förluster = 21 och vinster = 2×förluster → 3×förluster = 21 → förluster = 7, vinster = 14. Svar C."],
  },
  {
    subtest: "NOG", concept: "ekvationer", difficulty: 1500,
    stem: "Är |x - 3| < 5?\n(1) x > 0\n(2) x < 10",
    options: NOG_OPTIONS,
    correctIndex: 4,
    explanationShort: "|x-3|<5 betyder -2<x<8, och även tillsammans tillåter påståendena både x-värden som uppfyller och inte uppfyller detta.",
    explanationSteps: ["|x-3|<5 betyder -2<x<8.", "(1) ensamt: x>0 tillåter både x=1 (uppfyller) och x=100 (uppfyller inte). Otillräckligt.", "(2) ensamt: x<10 tillåter både x=5 (uppfyller) och x=-100 (uppfyller inte). Otillräckligt.", "Tillsammans: 0<x<10 tillåter både x=1 (uppfyller, eftersom -2<1<8) och x=9 (uppfyller inte, eftersom 9>8). Även tillsammans otillräckligt: svar E."],
  },
  {
    subtest: "NOG", concept: "logik", difficulty: 1350,
    stem: "Tre lådor - A, B och C - innehåller olika antal äpplen. Låda B innehåller fler äpplen än låda C. Innehåller låda A flest äpplen?\n(1) Låda A innehåller fler äpplen än låda B.\n(2) Låda C innehåller 5 äpplen och låda B innehåller 8 äpplen.",
    options: NOG_OPTIONS,
    correctIndex: 0,
    explanationShort: "(1) ensamt räcker: tillsammans med det redan kända B>C ger det A>B>C.",
    explanationSteps: ["Vi vet redan från uppgiften att B > C.", "(1): Om A > B, och B > C, så är A > B > C - alltså har A flest äpplen. Tillräckligt ensamt.", "(2): Ger bara C=5 och B=8, men inget om A. Otillräckligt ensamt.", "Svar A."],
  },
  {
    subtest: "NOG", concept: "logik", difficulty: 1400,
    stem: "Vem är äldst av Mio och Nils?\n(1) Mio är 4 år äldre än Olga.\n(2) Nils är 3 år yngre än Olga.",
    options: NOG_OPTIONS,
    correctIndex: 2,
    explanationShort: "Var för sig ger påståendena bara relationen till Olga, men tillsammans framgår att Mio alltid är 7 år äldre än Nils.",
    explanationSteps: ["(1) ensamt: ger bara Mios ålder relativt Olga, inget om Nils. Otillräckligt.", "(2) ensamt: ger bara Nils ålder relativt Olga, inget om Mio. Otillräckligt.", "Tillsammans: Mio - Nils = (Olga+4) - (Olga-3) = 7, oavsett Olgas faktiska ålder. Mio är alltid äldst. Svar C."],
  },
  {
    subtest: "NOG", concept: "ekvationer", difficulty: 1300,
    stem: "Är n delbart med 6?\n(1) n är delbart med både 2 och med 3\n(2) n är delbart med 9",
    options: NOG_OPTIONS,
    correctIndex: 0,
    explanationShort: "(1) räcker ensamt eftersom delbarhet med både 2 och 3 alltid innebär delbarhet med 6.",
    explanationSteps: ["(1): Delbart med både 2 och 3 (som är coprima) innebär alltid delbart med 6. Tillräckligt ensamt.", "(2): n=9 är delbart med 9 men inte med 6 (9/6 är inte ett heltal). Otillräckligt ensamt.", "Svar A."],
  },
  {
    subtest: "NOG", concept: "algebra", difficulty: 1550,
    stem: "x, y och z är positiva heltal där x < y < z. Är x + y > z?\n(1) x = 5, y = 6\n(2) z < 12",
    options: NOG_OPTIONS,
    correctIndex: 4,
    explanationShort: "Även tillsammans lämnar påståendena z öppet för flera värden som ger olika svar.",
    explanationSteps: ["(1) ensamt: x+y=11, men z:s värde är okänt - kan vara både mindre och större än 11. Otillräckligt.", "(2) ensamt: ger bara en övre gräns för z, inget om x eller y. Otillräckligt.", "Tillsammans: z kan vara 7, 8, 9, 10 eller 11 (eftersom z>y=6 och z<12). För z=7 till 10 gäller x+y=11>z, men för z=11 gäller 11>11 vilket är falskt. Svaret varierar - även tillsammans otillräckligt: svar E."],
  },

  // ================= DTK - Diagram, tabeller och kartor =================
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1400,
    stem: "Tabellen visar ett företags kvartalsvisa vinst (miljoner kr):\nQ1: 12 | Q2: 15 | Q3: 9 | Q4: 18\n\nOm bolagsskatten är 22 % på årsvinsten, hur mycket betalar företaget i skatt för året?",
    options: ["10,88 miljoner kr", "11,88 miljoner kr", "12,88 miljoner kr", "13,88 miljoner kr"],
    correctIndex: 1,
    explanationShort: "Årsvinsten är 54 miljoner kr, och 22 % av det är 11,88 miljoner kr.",
    explanationSteps: ["Årsvinst: 12+15+9+18 = 54 miljoner kr.", "Skatt: 54 × 0,22 = 11,88 miljoner kr."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1550,
    stem:
      "Ett cirkeldiagram visar hur en kommuns budget på 400 miljoner kr fördelas: Skola 40 %, Vård 30 %, Infrastruktur 20 %, Övrigt 10 %. Nästa år ökar den totala budgeten med 10 % och skolans andel ökar till 45 % av den nya budgeten.\n\nHur mycket mer får skolan nästa år jämfört med i år, i kronor?",
    options: ["28 miljoner kr", "33 miljoner kr", "38 miljoner kr", "44 miljoner kr"],
    correctIndex: 2,
    explanationShort: "Skolan går från 160 till 198 miljoner kr, en ökning på 38 miljoner kr.",
    explanationSteps: ["I år: 40 % × 400 = 160 miljoner kr.", "Nästa år: budget = 400×1,10 = 440 miljoner kr, skola = 45 % × 440 = 198 miljoner kr.", "Ökning: 198 - 160 = 38 miljoner kr."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1450,
    stem:
      "Tabellen visar medeltemperatur och nederbörd för fyra städer:\nStad A: 12°C, 600 mm | Stad B: 15°C, 450 mm | Stad C: 9°C, 800 mm | Stad D: 18°C, 300 mm\n\nVilken stad har högst nederbörd per grad medeltemperatur?",
    options: ["Stad A", "Stad B", "Stad C", "Stad D"],
    correctIndex: 2,
    explanationShort: "Stad C har cirka 88,9 mm per grad, klart högst av de fyra.",
    explanationSteps: ["A: 600/12 = 50.", "B: 450/15 = 30.", "C: 800/9 ≈ 88,9.", "D: 300/18 ≈ 16,7.", "Stad C har högst kvot."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1400,
    stem:
      "Ett linjediagram visar ett företags kundantal: 2020: 1 200, 2021: 1 500, 2022: 1 800, 2023: 2 000.\n\nUnder vilket år var den procentuella ökningen störst?",
    options: ["2021", "2022", "2023", "Alla lika"],
    correctIndex: 0,
    explanationShort: "Ökningen 2020→2021 var 25 %, klart högst av de tre.",
    explanationSteps: ["2020→2021: (1500-1200)/1200 = 25 %.", "2021→2022: (1800-1500)/1500 = 20 %.", "2022→2023: (2000-1800)/1800 ≈ 11,1 %.", "Störst ökning: 2021."],
  },
  {
    subtest: "DTK", concept: "kartor-skala", difficulty: 1400,
    stem: "En karta har skalan 1:50 000. Ett rektangulärt naturreservat mäter 4 cm × 3 cm på kartan.\n\nHur stor är reservatets verkliga area i kvadratkilometer?",
    options: ["1,5 km²", "2 km²", "3 km²", "6 km²"],
    correctIndex: 2,
    explanationShort: "Reservatet är i verkligheten 2 km × 1,5 km, vilket ger en area på 3 km².",
    explanationSteps: ["Längd: 4 cm × 50 000 = 200 000 cm = 2 km.", "Bredd: 3 cm × 50 000 = 150 000 cm = 1,5 km.", "Area: 2 × 1,5 = 3 km²."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1300,
    stem:
      "Tabellen visar antal nyanmälda patienter och genomsnittlig väntetid (dagar) vid fyra vårdcentraler under ett kvartal:\nCentrum: 420 patienter, 12 dagar | Norr: 310 patienter, 18 dagar | Söder: 275 patienter, 9 dagar | Väster: 190 patienter, 21 dagar\n\nVilken vårdcentral hade flest 'väntedagar' totalt (antal patienter × genomsnittlig väntetid)?",
    options: ["Centrum", "Norr", "Söder", "Väster"],
    correctIndex: 1,
    explanationShort: "Norr hade flest totala väntedagar: 310 × 18 = 5 580.",
    explanationSteps: ["Centrum: 420×12 = 5 040.", "Norr: 310×18 = 5 580.", "Söder: 275×9 = 2 475.", "Väster: 190×21 = 3 990.", "Norr har flest totala väntedagar."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1350,
    stem:
      "Tabellen visar antal invånare i fyra kommuner år 2015 och 2023:\nKommun A: 2015: 24 000, 2023: 27 600 | Kommun B: 2015: 41 000, 2023: 43 050 | Kommun C: 2015: 15 500, 2023: 13 950 | Kommun D: 2015: 60 000, 2023: 66 000\n\nVilken kommun hade störst procentuell förändring i befolkning mellan 2015 och 2023 (oavsett riktning)?",
    options: ["Kommun A", "Kommun B", "Kommun C", "Kommun D"],
    correctIndex: 0,
    explanationShort: "Kommun A hade störst procentuell förändring: +15 %.",
    explanationSteps: ["A: (27 600-24 000)/24 000 = 15 %.", "B: (43 050-41 000)/41 000 = 5 %.", "C: (13 950-15 500)/15 500 = -10 %.", "D: (66 000-60 000)/60 000 = 10 %.", "Kommun A har störst förändring i absoluta tal (15 %)."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1350,
    stem:
      "Tabellen visar antal sålda biljetter och total intäkt för tre biografer en helg:\nBio Stjärnan: 1 200 biljetter, 168 000 kr | Bio Kometen: 950 biljetter, 142 500 kr | Bio Solen: 1 500 biljetter, 187 500 kr\n\nVilken biograf hade högst genomsnittligt biljettpris?",
    options: ["Bio Stjärnan", "Bio Kometen", "Bio Solen", "Alla lika"],
    correctIndex: 1,
    explanationShort: "Bio Kometen hade högst snittpris: 142 500 / 950 = 150 kr.",
    explanationSteps: ["Stjärnan: 168 000/1 200 = 140 kr.", "Kometen: 142 500/950 = 150 kr.", "Solen: 187 500/1 500 = 125 kr.", "Kometen hade högst snittpris."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1400,
    stem:
      "Tabellen visar ett företags personalkostnader och omsättning (miljoner kr) för tre år:\n2021: personalkostnad 18, omsättning 90 | 2022: personalkostnad 21, omsättning 105 | 2023: personalkostnad 26, omsättning 118\n\nUnder vilket år var personalkostnaden som andel av omsättningen högst?",
    options: ["2021", "2022", "2023", "Alla lika"],
    correctIndex: 2,
    explanationShort: "2023 hade högst andel: cirka 22 %, mot 20 % de föregående åren.",
    explanationSteps: ["2021: 18/90 = 20 %.", "2022: 21/105 = 20 %.", "2023: 26/118 ≈ 22 %.", "2023 hade högst andel."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1500,
    stem:
      "Tabellen visar antal deltagare och genomsnittligt resultat (poäng) i en tävling för fyra lag:\nLag A: 12 deltagare, 45 poäng | Lag B: 8 deltagare, 52 poäng | Lag C: 15 deltagare, 38 poäng | Lag D: 10 deltagare, 48 poäng\n\nVad var det sammanlagda genomsnittliga resultatet för alla deltagare (viktat medelvärde)?",
    options: ["42,1 poäng", "43,4 poäng", "44,6 poäng", "45,8 poäng"],
    correctIndex: 2,
    explanationShort: "Det viktade medelvärdet över alla 45 deltagare blir cirka 44,6 poäng.",
    explanationSteps: ["Totalpoäng: 12×45 + 8×52 + 15×38 + 10×48 = 540+416+570+480 = 2006.", "Totalt antal deltagare: 12+8+15+10 = 45.", "Viktat medelvärde: 2006/45 ≈ 44,6 poäng."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1450,
    stem:
      "Ett stapeldiagram visar en butikskedjas försäljning (miljoner kr) per region: Norr 24, Syd 36, Öst 18, Väst 30. Nästa år väntas Norr och Öst växa med 25 % vardera, medan Syd och Väst väntas minska med 10 % vardera.\n\nVad blir den totala försäljningen nästa år?",
    options: ["105,9 miljoner kr", "108,9 miljoner kr", "111,9 miljoner kr", "114,9 miljoner kr"],
    correctIndex: 2,
    explanationShort: "Summan av alla fyra regioner nästa år blir 111,9 miljoner kr.",
    explanationSteps: ["Norr: 24×1,25=30. Öst: 18×1,25=22,5.", "Syd: 36×0,90=32,4. Väst: 30×0,90=27.", "Summa: 30+22,5+32,4+27 = 111,9 miljoner kr."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1350,
    stem:
      "Tabellen visar antal timmar sol per månad för två städer:\nStad X: Maj 220, Jun 260, Jul 280, Aug 250 | Stad Y: Maj 180, Jun 210, Jul 300, Aug 240\n\nUnder vilken månad var skillnaden mellan städerna störst (i timmar)?",
    options: ["Maj", "Juni", "Juli", "Augusti"],
    correctIndex: 1,
    explanationShort: "Störst skillnad var i juni: 50 timmar.",
    explanationSteps: ["Maj: 220-180=40 h.", "Juni: 260-210=50 h.", "Juli: |280-300|=20 h.", "Augusti: 250-240=10 h.", "Störst skillnad var i juni."],
  },
  {
    subtest: "DTK", concept: "kartor-skala", difficulty: 1400,
    stem: "En karta har skalan 1:200 000. En vandringsled är 8,5 cm lång på kartan.\n\nHur lång tid tar det att vandra hela leden om man går med en hastighet av 4 km/h?",
    options: ["3 timmar 45 minuter", "4 timmar 15 minuter", "4 timmar 45 minuter", "5 timmar 15 minuter"],
    correctIndex: 1,
    explanationShort: "Ledens verkliga längd är 17 km, vilket tar 4 timmar 15 minuter i 4 km/h.",
    explanationSteps: ["Verklig längd: 8,5 × 200 000 = 1 700 000 cm = 17 km.", "Tid: 17 km / 4 km/h = 4,25 timmar = 4 timmar 15 minuter."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1500,
    stem:
      "Tabellen visar ett lands import och export (miljarder kr) under fyra kvartal:\nQ1: import 45, export 38 | Q2: import 52, export 49 | Q3: import 48, export 55 | Q4: import 41, export 47\n\nUnder hela året, var handelsbalansen (export minus import) positiv eller negativ, och med hur mycket?",
    options: ["Negativ, -3 miljarder kr", "Negativ, -7 miljarder kr", "Positiv, +3 miljarder kr", "Positiv, +7 miljarder kr"],
    correctIndex: 2,
    explanationShort: "Total export (189) översteg total import (186) med 3 miljarder kr - en positiv handelsbalans.",
    explanationSteps: ["Total import: 45+52+48+41 = 186.", "Total export: 38+49+55+47 = 189.", "Handelsbalans: 189-186 = +3 miljarder kr, alltså positiv."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1450,
    stem:
      "Ett cirkeldiagram visar en universitetsutbildnings studenter fördelat på program: Ekonomi 30 %, Teknik 25 %, Juridik 20 %, Medicin 15 %, Övrigt 10 %. Totalt antal studenter är 4 800. Andelen kvinnor inom Medicin är 65 %.\n\nHur många kvinnliga studenter finns inom Medicin?",
    options: ["432", "468", "504", "540"],
    correctIndex: 1,
    explanationShort: "Antalet studenter inom Medicin är 720, varav 65 % (468) är kvinnor.",
    explanationSteps: ["Antal studenter inom Medicin: 15 % × 4 800 = 720.", "Kvinnor inom Medicin: 65 % × 720 = 468."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1400,
    stem:
      "Tabellen visar medelinkomst (tkr/år) för fem yrkesgrupper och andel av arbetskraften de utgör:\nGrupp A: 320 tkr, 15 % | Grupp B: 410 tkr, 25 % | Grupp C: 280 tkr, 30 % | Grupp D: 510 tkr, 10 % | Grupp E: 350 tkr, 20 %\n\nVad är den viktade genomsnittliga medelinkomsten för hela arbetskraften?",
    options: ["341,5 tkr", "348,5 tkr", "355,5 tkr", "362,5 tkr"],
    correctIndex: 2,
    explanationShort: "Det viktade genomsnittet över alla fem grupper blir 355,5 tkr.",
    explanationSteps: ["Viktat genomsnitt: 320×0,15 + 410×0,25 + 280×0,30 + 510×0,10 + 350×0,20.", "= 48 + 102,5 + 84 + 51 + 70 = 355,5 tkr."],
  },
];

const testDefinition = questions.map((q, i) => ({ ...q, order: i }));

async function main() {
  console.log("Rensar gammal demo-data...");
  await prisma.notification.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.xPEvent.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.testAnswer.deleteMany();
  await prisma.testAttempt.deleteMany();
  await prisma.testQuestion.deleteMany();
  await prisma.test.deleteMany();
  await prisma.studyPlanItem.deleteMany();
  await prisma.studyPlan.deleteMany();
  await prisma.conceptMastery.deleteMany();
  await prisma.questionAttempt.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.question.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.user.deleteMany();

  console.log(`Skapar ${questions.length} frågor...`);
  const created = [];
  for (const q of questions) {
    const row = await prisma.question.create({
      data: {
        subtest: q.subtest,
        concept: q.concept,
        difficulty: q.difficulty,
        stem: q.stem,
        options: JSON.stringify(q.options),
        correctIndex: q.correctIndex,
        explanationShort: q.explanationShort,
        explanationSteps: JSON.stringify(q.explanationSteps),
        hint1: q.hint1,
        hint2: q.hint2,
        hint3: q.hint3,
        isDemo: true,
      },
    });
    created.push(row);
  }

  console.log("Skapar achievements...");
  const achievementDefs = [
    { code: "first_session", name: "Första passet", description: "Slutför din första träningssession", icon: "🎯", criteria: "{}" },
    { code: "first_test", name: "Första provet", description: "Genomför ditt första fulla prov", icon: "🏆", criteria: "{}" },
    { code: "questions_100", name: "100 frågor", description: "Besvara 100 frågor totalt", icon: "💯", criteria: "{}" },
    { code: "questions_1000", name: "1000 frågor", description: "Besvara 1000 frågor totalt", icon: "🔥", criteria: "{}" },
    { code: "streak_7", name: "En vecka i rad", description: "7 dagars streak", icon: "🔥", criteria: "{}" },
    { code: "streak_30", name: "Månadsstark", description: "30 dagars streak", icon: "⚡", criteria: "{}" },
    { code: "first_pr", name: "Nytt personbästa", description: "Sätt ditt första personliga rekord", icon: "📈", criteria: "{}" },
    { code: "perfect_section", name: "Perfekt delprov", description: "100% rätt på ett helt delprov", icon: "🎯", criteria: "{}" },
    { code: "improve_020", name: "Rejäl förbättring", description: "Förbättra din prognos med 0,20", icon: "🚀", criteria: "{}" },
    { code: "night_owl", name: "Nattuggla", description: "Träna efter kl 22", icon: "🦉", criteria: "{}" },
    { code: "early_bird", name: "Morgonpigg", description: "Träna innan kl 07", icon: "🌅", criteria: "{}" },
    { code: "all_rounder", name: "Allroundare", description: "Träna alla åtta delprov minst en gång", icon: "🧩", criteria: "{}" },
  ];
  for (const a of achievementDefs) {
    await prisma.achievement.create({ data: a });
  }

  console.log("Skapar demo-prov...");
  const demoTest = await prisma.test.create({
    data: { name: "Fullständigt övningsprov 1", isFull: true, isDemo: true },
  });
  for (let i = 0; i < testDefinition.length; i++) {
    await prisma.testQuestion.create({
      data: {
        testId: demoTest.id,
        questionId: created[i].id,
        order: i,
        subtest: testDefinition[i].subtest,
      },
    });
  }

  console.log("Skapar demoanvändare...");
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const examDate = new Date();
  examDate.setDate(examDate.getDate() + 63);

  const demoUser = await prisma.user.create({
    data: {
      email: "demo@provet.se",
      name: "Demo",
      passwordHash,
      profile: {
        create: {
          goalScore: 1.6,
          examDate,
          previousAttempts: "ONCE",
          previousScore: 1.2,
          selfAssessment: JSON.stringify({ ORD: 3, LAS: 3, MEK: 2, ELF: 4, XYZ: 3, KVA: 2, NOG: 2, DTK: 3 }),
          onboardingDone: true,
          currentEstimate: 0.8, // räknas om nedan utifrån den genererade övningshistoriken
          level: 3,
          xp: 780,
          streakCount: 12,
          streakLastActive: new Date(),
          streakFreezes: 1,
          studyStyle: "Snabb problemlösare",
          bestStudyHour: 19,
          totalStudySeconds: 0, // räknas upp nedan i takt med den genererade övningshistoriken
        },
      },
    },
    include: { profile: true },
  });

  // Bygg upp historik: attempts spridda över de senaste 14 dagarna för realistisk dashboard
  console.log("Skapar övningshistorik...");
  const masteryMap = new Map<string, { correct: number; attempts: number; rating: number }>();
  const now = Date.now();
  let totalStudySecondsGenerated = 0;
  for (let day = 13; day >= 0; day--) {
    const dayQuestions = created
      .filter(() => Math.random() < 0.35)
      .slice(0, 6);
    if (dayQuestions.length === 0) continue;
    const session = await prisma.studySession.create({
      data: {
        userId: demoUser.id,
        type: "QUICK",
        startedAt: new Date(now - day * 86400000),
        completedAt: new Date(now - day * 86400000 + 10 * 60000),
        plannedMinutes: 10,
        questionsTotal: dayQuestions.length,
      },
    });
    totalStudySecondsGenerated += 10 * 60;
    let correctCount = 0;
    // Träffsäkerheten trendar uppåt mot idag - ger en genuin (om än simulerad) förbättringskurva i demot.
    const dayAccuracy = 0.55 + ((13 - day) / 13) * 0.27;
    for (const q of dayQuestions) {
      const key = `${q.subtest}:${q.concept}`;
      const prior = masteryMap.get(key) ?? { correct: 0, attempts: 0, rating: 1000 };
      const isCorrect = Math.random() < dayAccuracy;
      if (isCorrect) correctCount++;
      prior.attempts += 1;
      if (isCorrect) prior.correct += 1;
      prior.rating += isCorrect ? 20 : -12;
      masteryMap.set(key, prior);

      const optionCount = JSON.parse(q.options).length;
      await prisma.questionAttempt.create({
        data: {
          userId: demoUser.id,
          questionId: q.id,
          sessionId: session.id,
          selectedIndex: isCorrect ? q.correctIndex : (q.correctIndex + 1) % optionCount,
          correct: isCorrect,
          timeSpentSec: 20 + Math.round(Math.random() * 60),
          errorReason: isCorrect ? null : (["CARELESS", "CONCEPT", "MISREAD", "TIME"] as const)[Math.floor(Math.random() * 4)],
          createdAt: new Date(now - day * 86400000 + Math.random() * 8 * 60000),
        },
      });
      await prisma.question.update({
        where: { id: q.id },
        data: { timesAnswered: { increment: 1 }, timesCorrect: { increment: isCorrect ? 1 : 0 } },
      });
    }
    await prisma.studySession.update({
      where: { id: session.id },
      data: { questionsCorrect: correctCount, xpEarned: correctCount * 10 + (dayQuestions.length - correctCount) * 2 },
    });
  }

  console.log("Räknar ut startprognos från övningshistoriken...");
  const bySubtestSeed = new Map<string, number[]>();
  for (const [key, val] of masteryMap.entries()) {
    const subtest = key.split(":")[0];
    const arr = bySubtestSeed.get(subtest) ?? [];
    arr.push(estimateSubscore(val.rating));
    bySubtestSeed.set(subtest, arr);
  }
  const avgFor = (subtests: string[]) => {
    const scores = subtests.map((s) => {
      const arr = bySubtestSeed.get(s);
      return arr && arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0.4;
    });
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };
  const seededEstimate = Math.round((avgFor(VERBAL_SUBTESTS) + avgFor(QUANT_SUBTESTS)) * 100) / 100;
  await prisma.profile.update({
    where: { userId: demoUser.id },
    data: { currentEstimate: seededEstimate, totalStudySeconds: totalStudySecondsGenerated },
  });

  console.log("Skapar concept mastery...");
  for (const [key, val] of masteryMap.entries()) {
    const [subtest, concept] = key.split(":");
    await prisma.conceptMastery.create({
      data: {
        userId: demoUser.id,
        subtest: subtest as Subtest,
        concept,
        rating: val.rating,
        attempts: val.attempts,
        correct: val.correct,
        lastSeenAt: new Date(),
        nextReviewAt: new Date(now + 86400000),
      },
    });
  }

  console.log("Låser upp achievements...");
  const firstSession = await prisma.achievement.findUnique({ where: { code: "first_session" } });
  const streak7 = await prisma.achievement.findUnique({ where: { code: "streak_7" } });
  if (firstSession) {
    await prisma.userAchievement.create({ data: { userId: demoUser.id, achievementId: firstSession.id } });
  }
  if (streak7) {
    await prisma.userAchievement.create({ data: { userId: demoUser.id, achievementId: streak7.id } });
  }

  console.log("Skapar admin-konto...");
  const adminHash = await bcrypt.hash("admin1234", 10);
  await prisma.user.create({
    data: {
      email: "admin@provet.se",
      name: "Admin",
      passwordHash: adminHash,
      isAdmin: true,
      profile: { create: { onboardingDone: true } },
    },
  });

  console.log("Klart!");
  console.log(`  Frågor: ${created.length}`);
  console.log("  Demo-inloggning: demo@provet.se / demo1234");
  console.log("  Admin-inloggning: admin@provet.se / admin1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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
  visualType?: "table" | "bar" | "line" | "pie" | "map";
  visualData?: unknown;
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

  // ================= LÄS - Svensk läsförståelse (fullständiga texter, som på riktiga provet) =================
  {
    subtest: "LAS", concept: "huvudbudskap", difficulty: 1300,
    stem:
      "Digitaliseringen av historiska arkiv har på kort tid gjort miljontals dokument sökbara med några knapptryckningar, något som borde vara en dröm för alla historiker. Där en forskargeneration tidigare kunde tillbringa månader i dammiga källararkiv för att hitta ett enda relevant brev, räcker det i dag ofta med en sökning i en digital databas för att få fram hundratals träffar på några sekunder. Men den nya tillgängligheten har fört med sig ett oväntat problem: forskare tenderar att i allt högre grad bygga sina slutsatser enbart på det material som råkar vara digitaliserat, medan enorma mängder outforskat material - protokoll, brev och räkenskaper som ännu ligger i fysiska arkiv - i praktiken blir osynliga för den som söker digitalt.\n\nResultatet riskerar att bli en förvriden historieskrivning, inte för att de digitala källorna i sig är felaktiga, utan för att urvalet av vad som digitaliserats sällan är slumpmässigt. Myndigheter och institutioner med resurser att digitalisera sina samlingar överrepresenteras i det sökbara materialet, medan mindre arkiv - ofta de som förvarar material om marginaliserade grupper, lokala föreningar eller regionala särdrag - halkar efter i digitaliseringstakten. Sökbarheten ger på så sätt en illusion av fullständighet som få forskare, upptagna av den nya bekvämligheten, stannar upp för att ifrågasätta.\n\nDet vore emellertid fel att måla upp digitaliseringen som enbart problematisk. Många historiker påpekar att den också demokratiserat forskningen: den som tidigare saknade resurser att resa till ett avlägset nationalarkiv kan i dag utföra motsvarande efterforskning hemifrån, vilket öppnat fältet för fler röster och perspektiv än den traditionella, resursstarka forskarelititen. Frågan är alltså inte om digitalisering ska ske, utan hur den bör prioriteras och kompletteras.\n\nEn del arkivinstitutioner har därför börjat arbeta medvetet med att digitalisera bortglömda samlingar före de mest efterfrågade, just för att motverka snedvridningen. Andra förespråkar att forskare bör åläggas att redovisa vilken andel av sitt källmaterial som är digitalt respektive fysiskt insamlat, ett slags metodologisk transparens som skulle göra snedvridningen synlig även när den inte går att helt undvika. Oavsett vilken lösning som väljs tycks de flesta vara överens om en sak: så länge sökbarheten upplevs som liktydig med fullständighet, riskerar historieskrivningen att formas lika mycket av vad som råkat scannas in som av vad som faktiskt hände.\n\nVad är textens huvudbudskap?",
    options: [
      "Digitalisering av arkiv är alltid till fördel för forskningen och bör prioriteras framför allt annat",
      "Digitaliseringens ojämna urval riskerar att snedvrida historieforskningen, även om digitalisering också har demokratiserande effekter",
      "Fysiska arkiv bör avvecklas helt till förmån för digitala samlingar",
      "Historiker har i praktiken slutat använda digitala källor på grund av kvalitetsproblem",
    ],
    correctIndex: 1,
    explanationShort: "Texten varnar för att ojämn digitalisering ger en skev bild av historien, men nyanserar med att digitalisering också demokratiserat forskningen.",
    explanationSteps: ["Signalordet 'Men' i första stycket introducerar textens huvudinvändning.", "Tredje stycket nyanserar bilden ('det vore fel att måla upp digitaliseringen som enbart problematisk'), vilket visar att huvudbudskapet är en avvägd, inte en ensidigt negativ, hållning."],
  },
  {
    subtest: "LAS", concept: "detaljförståelse", difficulty: 1300,
    stem:
      "Digitaliseringen av historiska arkiv har på kort tid gjort miljontals dokument sökbara... Myndigheter och institutioner med resurser att digitalisera sina samlingar överrepresenteras i det sökbara materialet, medan mindre arkiv - ofta de som förvarar material om marginaliserade grupper, lokala föreningar eller regionala särdrag - halkar efter i digitaliseringstakten.\n\nVilken typ av arkiv riskerar enligt texten att bli underrepresenterade i det sökbara materialet?",
    options: [
      "Arkiv hos välfinansierade myndigheter",
      "De mest omfattande nationalarkiven",
      "Mindre arkiv med material om marginaliserade grupper och lokala föreningar",
      "Digitala källor i allmänhet",
    ],
    correctIndex: 2,
    explanationShort: "Texten anger explicit att mindre arkiv med material om marginaliserade grupper och lokala föreningar riskerar att halka efter.",
    explanationSteps: ["Frasen 'ofta de som förvarar material om marginaliserade grupper, lokala föreningar eller regionala särdrag' pekar direkt ut svaret.", "Kontrasten till 'myndigheter och institutioner med resurser' förstärker vilken grupp som missgynnas."],
  },
  {
    subtest: "LAS", concept: "slutledning", difficulty: 1400,
    stem:
      "Digitaliseringen av historiska arkiv har på kort tid gjort miljontals dokument sökbara... Många historiker påpekar att den också demokratiserat forskningen: den som tidigare saknade resurser att resa till ett avlägset nationalarkiv kan i dag utföra motsvarande efterforskning hemifrån, vilket öppnat fältet för fler röster och perspektiv än den traditionella, resursstarka forskarelititen.\n\nVad talar texten för angående digitaliseringens effekt på vem som i praktiken kan bedriva historisk forskning?",
    options: [
      "Den har gjort forskning svårare för de flesta grupper",
      "Den har öppnat fältet för fler än den traditionella, resursstarka forskareliten",
      "Den har inte förändrat vilka som forskar",
      "Endast anställda vid nationalarkiv kan numera forska",
    ],
    correctIndex: 1,
    explanationShort: "Texten anger explicit att digitaliseringen öppnat fältet för fler röster än den resursstarka forskareliten.",
    explanationSteps: ["Meningen om att 'öppnat fältet för fler röster och perspektiv än den traditionella, resursstarka forskarelititen' ger svaret direkt.", "Detta är textens exempel på digitaliseringens demokratiserande, positiva sida."],
  },
  {
    subtest: "LAS", concept: "författarens-syfte", difficulty: 1350,
    stem:
      "Digitaliseringen av historiska arkiv har på kort tid gjort miljontals dokument sökbara... Oavsett vilken lösning som väljs tycks de flesta vara överens om en sak: så länge sökbarheten upplevs som liktydig med fullständighet, riskerar historieskrivningen att formas lika mycket av vad som råkat scannas in som av vad som faktiskt hände.\n\nVad vill författaren främst uppnå med texten som helhet?",
    options: [
      "Uppmana till att stoppa all digitalisering av arkiv",
      "Väcka medvetenhet om en dold snedvridning i forskningsunderlaget, samtidigt som digitaliseringens fördelar erkänns",
      "Kritisera enskilda historiker för slarv och forskningsfusk",
      "Beskriva den tekniska processen för hur arkiv digitaliseras",
    ],
    correctIndex: 1,
    explanationShort: "Författaren varnar för en snedvridning som forskare sällan uppmärksammar, men balanserar detta mot digitaliseringens demokratiserande fördelar.",
    explanationSteps: ["Texten är inte ensidigt kritisk mot digitalisering, utan lyfter både problem och fördelar.", "Sista meningens varning om att historieskrivningen formas av 'vad som råkat scannas in' sammanfattar den medvetandehöjande avsikten."],
  },

  {
    subtest: "LAS", concept: "huvudbudskap", difficulty: 1350,
    stem:
      "Ett av de mest motbjudande fynden inom trafikforskningen, sett ur bilistens perspektiv, är fenomenet inducerad efterfrågan: nya körfält och breddade motorvägar leder sällan till varaktigt minskad trängsel, eftersom den tillfälligt förbättrade framkomligheten lockar fler bilister att välja just den sträckan, tills trängseln återställs till ungefär samma nivå som innan utbyggnaden. Mekanismen är inte mystisk i sig - den följer samma logik som gäller för de flesta resurser vars pris (i det här fallet tidskostnaden för att köra) sjunker: efterfrågan ökar för att fylla det nya utrymmet. Vissa bilister som tidigare valde en omväg börjar köra den nya, snabbare sträckan. Andra som tidigare åkte kollektivt eller cyklade väljer nu bilen i stället. Ytterligare andra flyttar sina resor till högtrafiktid, eftersom vägen nu klarar det utan att köerna blir outhärdliga.\n\nFenomenet är väldokumenterat i decennier av data från städer världen över - från Kalifornien till Seoul - men politiker fortsätter ändå att motivera vägutbyggnader med löften om minskad trängsel. Förklaringen är sannolikt dubbel: dels är den kortsiktiga lättnaden, innan den nya efterfrågan hunnit fylla upp kapaciteten, politiskt värdefull även om den bevisligen är tillfällig, dels är den kontraintuitiva logiken helt enkelt svår att kommunicera till väljare som upplever köer som ett direkt resultat av för få körfält, snarare än ett resultat av hur mänskligt beteende anpassar sig till ny kapacitet.\n\nIroniskt nog gäller samma mekanism omvänt: när körfält i stället tas bort eller stängs av för biltrafik, minskar den totala biltrafiken ofta mer än väntat, eftersom en del resenärer helt enkelt väljer bort bilresan snarare än att envist köa på en smalare väg. Detta fenomen, ibland kallat 'evaporerad trafik', har observerats i flera europeiska städer som stängt av centrala genomfartsleder, utan att det befarade trafikkaoset har uppstått i den utsträckning kritikerna förutspått. Slutsatsen många trafikforskare drar är att kapacitet i praktiken formar efterfrågan snarare än enbart tvärtom - en insikt som utmanar den gängse föreställningen om att fler körfält är den självklara lösningen på trängsel.\n\nVad är textens huvudbudskap?",
    options: [
      "Fler körfält minskar alltid trängseln permanent, medan avstängda körfält alltid ökar den",
      "Vägutbyggnader ger sällan varaktigt minskad trängsel eftersom ökad kapacitet lockar fler bilister, och motsvarande gäller omvänt när kapacitet tas bort",
      "Politiker saknar helt kunskap om trafikforskning",
      "Kollektivtrafik är alltid att föredra framför biltrafik",
    ],
    correctIndex: 1,
    explanationShort: "Texten beskriver hur inducerad efterfrågan gör att fler körfält sällan minskar trängseln varaktigt - och att samma mekanism gäller omvänt.",
    explanationSteps: ["Definitionen av 'inducerad efterfrågan' i första meningen ger grunden för huvudbudskapet.", "Sista stycket visar att samma logik gäller åt båda hållen ('evaporerad trafik'), vilket bekräftar att huvudbudskapet handlar om kapacitetens generella effekt på efterfrågan."],
  },
  {
    subtest: "LAS", concept: "detaljförståelse", difficulty: 1300,
    stem:
      "Ett av de mest motbjudande fynden inom trafikforskningen... Ironiskt nog gäller samma mekanism omvänt: när körfält i stället tas bort eller stängs av för biltrafik, minskar den totala biltrafiken ofta mer än väntat, eftersom en del resenärer helt enkelt väljer bort bilresan snarare än att envist köa på en smalare väg. Detta fenomen, ibland kallat 'evaporerad trafik', har observerats i flera europeiska städer som stängt av centrala genomfartsleder.\n\nVad kallas fenomenet att trafiken minskar mer än väntat när körfält stängs av, enligt texten?",
    options: ["Inducerad efterfrågan", "Evaporerad trafik", "Trafikkaos", "Kapacitetschock"],
    correctIndex: 1,
    explanationShort: "Texten anger explicit att detta fenomen kallas 'evaporerad trafik'.",
    explanationSteps: ["Termen står ordagrant i texten, direkt efter beskrivningen av fenomenet."],
  },
  {
    subtest: "LAS", concept: "slutledning", difficulty: 1450,
    stem:
      "Ett av de mest motbjudande fynden inom trafikforskningen... Förklaringen är sannolikt dubbel: dels är den kortsiktiga lättnaden, innan den nya efterfrågan hunnit fylla upp kapaciteten, politiskt värdefull även om den bevisligen är tillfällig, dels är den kontraintuitiva logiken helt enkelt svår att kommunicera till väljare som upplever köer som ett direkt resultat av för få körfält.\n\nVarför fortsätter politiker enligt texten att motivera vägutbyggnader med minskad trängsel, trots att forskningen talar emot det?",
    options: [
      "För att forskningen om inducerad efterfrågan är motsägelsefull och osäker",
      "För att den kortsiktiga lättnaden är politiskt värdefull och den bakomliggande logiken är svår att kommunicera till väljarna",
      "För att vägutbyggnader alltid är billigare än andra åtgärder",
      "För att politiker medvetet vill öka trängseln",
    ],
    correctIndex: 1,
    explanationShort: "Texten ger explicit två skäl: den kortsiktiga politiska vinsten och svårigheten att kommunicera den kontraintuitiva logiken.",
    explanationSteps: ["Frasen 'förklaringen är sannolikt dubbel' introducerar de två skälen direkt.", "Båda skälen anges ordagrant i den efterföljande meningen."],
  },
  {
    subtest: "LAS", concept: "författarens-syfte", difficulty: 1400,
    stem:
      "Ett av de mest motbjudande fynden inom trafikforskningen... Slutsatsen många trafikforskare drar är att kapacitet i praktiken formar efterfrågan snarare än enbart tvärtom - en insikt som utmanar den gängse föreställningen om att fler körfält är den självklara lösningen på trängsel.\n\nVad är författarens sannolika syfte med att avsluta texten på detta sätt?",
    options: [
      "Att hylla politikers förmåga att lösa trafikproblem",
      "Att understryka att forskningen utmanar en utbredd, förenklad föreställning om trängsel",
      "Att bevisa att forskare aldrig har fel",
      "Att föreslå att all vägbyggnation ska stoppas omedelbart",
    ],
    correctIndex: 1,
    explanationShort: "Slutmeningen framhåller att forskningsinsikten utmanar den gängse (allmänt spridda) föreställningen om vägutbyggnad.",
    explanationSteps: ["Ordet 'utmanar den gängse föreställningen' visar att syftet är att ifrågasätta en vanlig missuppfattning, inte att döma ut enskilda aktörer."],
  },

  {
    subtest: "LAS", concept: "huvudbudskap", difficulty: 1350,
    stem:
      "När stormarknader på 1990-talet började experimentera med att kraftigt utöka sitt sortiment - allt från tjugo till hundratals sorters sylt - utgick man från ett intuitivt antagande: fler valmöjligheter borde göra fler kunder nöjda, eftersom sannolikheten att hitta exakt det man vill ha ökar. Ett numera klassiskt fältexperiment motbevisade dock den intuitionen på ett sätt som fick stor uppmärksamhet inom både psykologi och marknadsföring. När forskare ställde upp två provbord i en livsmedelsbutik - ett med sex sorters sylt, ett med tjugofyra - lockade det större bordet visserligen fler nyfikna kunder att stanna till. Men när det kom till det faktiska köpet visade det sig att det mindre urvalet resulterade i nästan tio gånger fler köp.\n\nFörklaringen som vuxit fram ur senare forskning handlar om vad som brukar kallas beslutsutmattning: ju fler alternativ som ska jämföras, desto mer kognitiv energi krävs för att fatta ett beslut, och desto större blir risken att kunden helt enkelt skjuter upp eller avstår från att välja alls. Till detta kommer en känslomässig komponent - med fler alternativ ökar också risken att i efterhand ångra sitt val, eftersom det alltid finns fler outforskade möjligheter som kunde ha varit bättre. Denna kombination av kognitiv överbelastning och förväntad ånger tycks väga tyngre än fördelen av att fler smaker faktiskt finns tillgängliga.\n\nFenomenet, som ofta kallas valparadoxen, har sedan dess replikerats i flera andra sammanhang - pensionssparande, dejtingappar, restaurangmenyer - om än med varierande styrka. Senare forskning har nyanserat den ursprungliga slutsatsen: effekten tycks vara som starkast när alternativen är svåra att jämföra objektivt (som smaker) och svagare när de går att rangordna längs en tydlig skala (som pris eller kvalitetsbetyg). Trots dessa nyanser har valparadoxen fått påtagliga praktiska konsekvenser: flera stora återförsäljare har medvetet minskat sitt sortiment inom vissa produktkategorier, inte av kostnadsskäl utan i den uttalade förhoppningen att ett mindre men mer kurerat utbud faktiskt ska öka försäljningen snarare än att begränsa den.\n\nVad är textens huvudbudskap?",
    options: [
      "Fler valmöjligheter ökar alltid försäljningen, oavsett produktkategori",
      "Ett för stort utbud kan minska snarare än öka försäljningen, på grund av beslutsutmattning - men effekten varierar beroende på hur lätta alternativen är att jämföra",
      "Kunder vill aldrig ha fler alternativ att välja mellan",
      "Sylt säljer alltid bättre än andra produktkategorier",
    ],
    correctIndex: 1,
    explanationShort: "Texten visar att ett större utbud kan minska försäljningen genom beslutsutmattning, men nyanserar med att effekten beror på hur jämförbara alternativen är.",
    explanationSteps: ["Experimentet i första stycket etablerar huvudfyndet: färre alternativ gav fler köp.", "Tredje stycket nyanserar: effekten är som starkast när alternativ är svåra att jämföra objektivt - denna nyansering är en del av huvudbudskapet."],
  },
  {
    subtest: "LAS", concept: "detaljförståelse", difficulty: 1300,
    stem:
      "När forskare ställde upp två provbord i en livsmedelsbutik - ett med sex sorters sylt, ett med tjugofyra - lockade det större bordet visserligen fler nyfikna kunder att stanna till. Men när det kom till det faktiska köpet visade det sig att det mindre urvalet resulterade i nästan tio gånger fler köp.\n\nHur många gånger fler köp resulterade det mindre sylturvalet i, enligt experimentet?",
    options: ["Ungefär två gånger fler", "Ungefär fem gånger fler", "Nästan tio gånger fler", "Tjugofyra gånger fler"],
    correctIndex: 2,
    explanationShort: "Texten anger explicit 'nästan tio gånger fler köp'.",
    explanationSteps: ["Detaljen står ordagrant i texten: 'resulterade i nästan tio gånger fler köp'."],
  },
  {
    subtest: "LAS", concept: "slutledning", difficulty: 1400,
    stem:
      "Senare forskning har nyanserat den ursprungliga slutsatsen om valparadoxen: effekten tycks vara som starkast när alternativen är svåra att jämföra objektivt (som smaker) och svagare när de går att rangordna längs en tydlig skala (som pris eller kvalitetsbetyg).\n\nI vilket av följande fall skulle valparadoxen enligt texten sannolikt vara som svagast?",
    options: [
      "Vid val mellan olika smaker av glass",
      "Vid val mellan olika konstverk utifrån personlig smak",
      "Vid val mellan produkter som enkelt kan rangordnas efter pris",
      "Vid val mellan olika parfymer",
    ],
    correctIndex: 2,
    explanationShort: "Texten anger att effekten är svagare när alternativen går att rangordna längs en tydlig skala, som pris.",
    explanationSteps: ["Endast alternativet med produkter som rangordnas efter pris matchar textens beskrivning av lätt jämförbara alternativ.", "Smaker, konstverk och parfymer är exempel på subjektiva, svårjämförda alternativ - motsatsen till det som efterfrågas."],
  },
  {
    subtest: "LAS", concept: "författarens-syfte", difficulty: 1350,
    stem:
      "Trots dessa nyanser har valparadoxen fått påtagliga praktiska konsekvenser: flera stora återförsäljare har medvetet minskat sitt sortiment inom vissa produktkategorier, inte av kostnadsskäl utan i den uttalade förhoppningen att ett mindre men mer kurerat utbud faktiskt ska öka försäljningen snarare än att begränsa den.\n\nVad är författarens sannolika syfte med att nämna att återförsäljare medvetet minskat sitt sortiment?",
    options: [
      "Att visa att forskningsresultatet fått konkreta, kommersiella konsekvenser i praktiken",
      "Att kritisera återförsäljare för att fatta dåliga affärsbeslut",
      "Att bevisa att alla produkter bör ha färre varianter",
      "Att förklara hur sylt tillverkas industriellt",
    ],
    correctIndex: 0,
    explanationShort: "Exemplet med återförsäljare visar att valparadoxen inte bara är ett teoretiskt fynd utan har påverkat verkliga affärsbeslut.",
    explanationSteps: ["Frasen 'fått påtagliga praktiska konsekvenser' signalerar att författaren vill visa forskningens verkliga genomslag.", "Exemplet konkretiserar och stärker textens huvudbudskap snarare än att införa ny kritik."],
  },

  {
    subtest: "LAS", concept: "huvudbudskap", difficulty: 1400,
    stem:
      "Antibiotikaresistens beskrivs ofta i medier som ett slags vapenkapplöpning där bakterier ligger steget före läkemedelsutvecklingen, en bild som är delvis missvisande. Resistens är nämligen sällan gratis för bakterien: de genetiska förändringar som gör en bakterie okänslig för ett antibiotikum medför ofta en biologisk kostnad, till exempel långsammare tillväxt eller sämre förmåga att konkurrera om näring jämfört med icke-resistenta stammar. I frånvaro av antibiotika har därför resistenta bakterier ofta en nackdel, vilket förklarar varför resistensnivåerna i vissa fall faktiskt kan sjunka om ett antibiotikum används mer sparsamt under en period.\n\nDenna insikt har öppnat för en strategi som kallas antibiotikarotation: genom att växla systematiskt mellan olika preparat inom en vårdinstitution kan man utnyttja att resistens mot preparat A ofta innebär en kostnad som gör bakterien sämre rustad när preparat B i stället används. Om rotationen är tillräckligt genomtänkt kan bakteriepopulationen aldrig hinna anpassa sig fullt ut till något av preparaten, eftersom trycket ständigt växlar riktning. Flera sjukhus som infört sådana rotationsscheman har rapporterat lägre resistensnivåer än jämförbara avdelningar som konsekvent använt ett och samma förstahandspreparat.\n\nStrategin är dock inte problemfri. Vissa resistensmekanismer visar sig ge korsresistens - det vill säga skydd mot flera olika preparat samtidigt - vilket gör att en enkel rotation mellan två medel kan misslyckas totalt om bakterien redan bär på en gen som skyddar mot båda. Andra kritiker påpekar att den biologiska kostnaden för resistens ofta är mindre än man först trodde, särskilt när bakterien samtidigt utvecklar kompensatoriska mutationer som återställer tillväxthastigheten utan att offra resistensen. I sådana fall försvinner hela poängen med rotation, eftersom bakterien i praktiken får resistensen 'gratis' på sikt.\n\nSammantaget illustrerar antibiotikarotationens blandade resultat en bredare poäng inom evolutionsbiologin: naturligt urval optimerar inte alltid mot ett enda, stabilt slutmål, utan agerar kontinuerligt utifrån vilka avvägningar som för tillfället är mest kostsamma. Att utnyttja denna dynamik kliniskt kräver därför betydligt mer detaljerad kunskap om varje enskild resistensmekanisms specifika kostnader än vad som fanns tillgänglig när strategin först föreslogs.\n\nVad är textens huvudbudskap?",
    options: [
      "Antibiotikaresistens är permanent och kan aldrig minska under några omständigheter",
      "Resistens medför ofta en biologisk kostnad som kan utnyttjas kliniskt genom rotation, men strategin har viktiga begränsningar",
      "Antibiotikarotation är en helt misslyckad strategi utan undantag",
      "Bakterier utvecklas alltid snabbare än läkemedelsindustrin kan hantera",
    ],
    correctIndex: 1,
    explanationShort: "Texten beskriver rotationsstrategins logik och potential, men nyanserar noggrant med dess begränsningar (korsresistens, kompensatoriska mutationer).",
    explanationSteps: ["Andra stycket förklarar strategins logik och positiva resultat.", "Tredje stycket ('strategin är dock inte problemfri') nyanserar bilden - huvudbudskapet är balanserat, inte ensidigt positivt eller negativt."],
  },
  {
    subtest: "LAS", concept: "detaljförståelse", difficulty: 1350,
    stem:
      "Vissa resistensmekanismer visar sig ge korsresistens - det vill säga skydd mot flera olika preparat samtidigt - vilket gör att en enkel rotation mellan två medel kan misslyckas totalt om bakterien redan bär på en gen som skyddar mot båda.\n\nVad kallas det när en resistensmekanism ger skydd mot flera antibiotikapreparat samtidigt?",
    options: ["Antibiotikarotation", "Kompensatorisk mutation", "Korsresistens", "Naturligt urval"],
    correctIndex: 2,
    explanationShort: "Texten anger explicit termen 'korsresistens' för detta fenomen.",
    explanationSteps: ["Termen definieras direkt i texten: 'korsresistens - det vill säga skydd mot flera olika preparat samtidigt'."],
  },
  {
    subtest: "LAS", concept: "slutledning", difficulty: 1450,
    stem:
      "Andra kritiker påpekar att den biologiska kostnaden för resistens ofta är mindre än man först trodde, särskilt när bakterien samtidigt utvecklar kompensatoriska mutationer som återställer tillväxthastigheten utan att offra resistensen. I sådana fall försvinner hela poängen med rotation, eftersom bakterien i praktiken får resistensen 'gratis' på sikt.\n\nVad kan enligt texten hända om en bakterie utvecklar en kompensatorisk mutation?",
    options: [
      "Den blir känsligare för antibiotika än tidigare",
      "Den kan behålla sin resistens utan att längre betala den biologiska kostnaden för den",
      "Rotationsstrategin blir mer effektiv än tidigare",
      "Bakterien förlorar automatiskt sin förmåga att föröka sig",
    ],
    correctIndex: 1,
    explanationShort: "Texten anger att en kompensatorisk mutation återställer tillväxthastigheten utan att bakterien förlorar resistensen.",
    explanationSteps: ["Frasen 'återställer tillväxthastigheten utan att offra resistensen' beskriver exakt detta.", "Konsekvensen ('bakterien får resistensen gratis') visar varför rotationsstrategin då förlorar sin poäng."],
  },
  {
    subtest: "LAS", concept: "detaljförståelse", difficulty: 1300,
    stem:
      "Flera sjukhus som infört sådana rotationsscheman har rapporterat lägre resistensnivåer än jämförbara avdelningar som konsekvent använt ett och samma förstahandspreparat.\n\nVad rapporterade flera sjukhus som infört rotationsscheman, jämfört med avdelningar som konsekvent använde ett och samma preparat?",
    options: ["Högre resistensnivåer", "Lägre resistensnivåer", "Ingen skillnad alls i resistensnivåer", "Fler biverkningar hos patienterna"],
    correctIndex: 1,
    explanationShort: "Texten anger explicit att dessa sjukhus rapporterat lägre resistensnivåer.",
    explanationSteps: ["Detaljen står ordagrant i texten: 'rapporterat lägre resistensnivåer än jämförbara avdelningar'."],
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

  // ================= ELF - Engelsk läsförståelse (fullständiga texter, som på riktiga provet) =================
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1350,
    stem:
      "Organizations rarely abandon failing projects at the moment the evidence turns against them. Instead, a curious pattern recurs across industries: the more resources already invested in an initiative, the more resistant decision-makers become to canceling it, even when every available metric suggests the project has no realistic path to success. Economists call this the sunk cost fallacy - the tendency to let past, unrecoverable expenditures influence decisions about the future, when rationally only future costs and benefits should matter.\n\nWhat makes the fallacy particularly persistent in organizational settings, rather than purely individual ones, is the added layer of reputational risk. An executive who championed a project publicly faces not just the abstract discomfort of admitting a miscalculation, but a concrete professional cost: colleagues may question their judgment, and future proposals may be met with heightened skepticism. Continuing the failing project, by contrast, defers that reckoning indefinitely - the eventual failure, if it comes, can always be attributed to external circumstances rather than the original decision.\n\nSome organizations have attempted structural remedies. A small number of firms have adopted a policy of rotating decision authority: the manager who approves a project's continuation at each review stage is deliberately someone other than the one who originally championed it, precisely to remove the personal stake that fuels escalation of commitment. Early evidence suggests this modestly reduces the average time-to-cancellation for failing projects, though it does not eliminate the pattern entirely, since institutional loyalty to a colleague's project can persist even among reviewers with no personal stake in its outcome. The fallacy, it seems, is woven into organizational culture as much as into individual psychology.\n\nWhat is the main idea of the passage?",
    options: [
      "Organizations always cancel failing projects promptly once evidence turns against them",
      "Past investment irrationally influences decisions to continue failing projects, partly due to reputational concerns",
      "The sunk cost fallacy only affects individuals, never organizations",
      "Rotating decision authority always eliminates the sunk cost fallacy completely",
    ],
    correctIndex: 1,
    explanationShort: "The passage explains how past investment and reputational risk together drive organizations to irrationally continue failing projects.",
    explanationSteps: ["The first paragraph defines the sunk cost fallacy and its organizational persistence.", "The second paragraph adds the reputational-risk mechanism, which is central to the passage's explanation."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1400,
    stem:
      "Organizations rarely abandon failing projects at the moment the evidence turns against them... Continuing the failing project, by contrast, defers that reckoning indefinitely - the eventual failure, if it comes, can always be attributed to external circumstances rather than the original decision.\n\nAccording to the passage, why might continuing a failing project be preferable for an executive, even against the evidence?",
    options: [
      "It saves the company money in the short term",
      "It defers professional reckoning and allows eventual failure to be blamed on external circumstances",
      "It guarantees eventual success of the project",
      "It is required by company law",
    ],
    correctIndex: 1,
    explanationShort: "The passage explicitly states that continuing defers the reckoning and allows blame to shift to external circumstances.",
    explanationSteps: ["The quoted sentence directly states both the deferral and the attribution to external circumstances."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1450,
    stem:
      "Some organizations have attempted structural remedies... Early evidence suggests this modestly reduces the average time-to-cancellation for failing projects, though it does not eliminate the pattern entirely, since institutional loyalty to a colleague's project can persist even among reviewers with no personal stake in its outcome.\n\nWhat does the passage say about the effectiveness of rotating decision authority?",
    options: [
      "It completely eliminates the sunk cost fallacy in all cases",
      "It has no measurable effect whatsoever",
      "It modestly reduces time-to-cancellation but does not eliminate the pattern",
      "It increases the time-to-cancellation for failing projects",
    ],
    correctIndex: 2,
    explanationShort: "The passage explicitly states the remedy 'modestly reduces' but 'does not eliminate the pattern entirely'.",
    explanationSteps: ["Both qualifications ('modestly reduces' and 'does not eliminate entirely') are stated directly in the passage."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1350,
    stem:
      "Few findings in medical research are as unsettling to surgeons as the results of sham-surgery trials. In several rigorously designed studies, patients undergoing a real surgical procedure - for conditions ranging from knee osteoarthritis to certain forms of chronic back pain - reported improvements in pain and function that were statistically indistinguishable from patients who underwent an elaborate sham procedure: general anesthesia, incisions, and a plausible amount of time in the operating room, but none of the actual surgical intervention.\n\nThe implications are uncomfortable precisely because surgery has long been assumed immune to the placebo effect, an assumption resting on the idea that a mechanical intervention - unlike a sugar pill - produces its benefits through physical rather than psychological mechanisms. Sham-surgery trials complicate this assumption considerably, suggesting that at least part of the benefit attributed to certain procedures may stem from patients' expectations, the ritual of treatment, or the natural fluctuation of chronic conditions over time, rather than from the mechanical correction the surgery is designed to achieve.\n\nNone of this implies that surgery is generally ineffective; for many conditions, sham-controlled trials have confirmed a genuine benefit beyond placebo. Rather, the findings have prompted a push within the surgical community for more rigorous sham-controlled trials before new procedures become standard practice, particularly for conditions where the mechanism of benefit is not fully understood. Critics of this push note the ethical complexity of exposing patients to the risks of anesthesia and incision without any prospect of therapeutic benefit, a tension that has slowed the adoption of sham-controlled methodology even as its scientific value becomes harder to dispute.\n\nWhat do sham-surgery trials suggest, according to the passage?",
    options: [
      "Surgery never provides any real benefit beyond placebo",
      "Part of the benefit attributed to some surgeries may come from expectation or natural symptom fluctuation rather than the mechanical intervention itself",
      "All surgical procedures are essentially placebo treatments",
      "Anesthesia is the direct cause of chronic pain",
    ],
    correctIndex: 1,
    explanationShort: "The passage states sham-surgery trials suggest part of the benefit may stem from expectation or natural fluctuation, not the mechanical correction.",
    explanationSteps: ["The second paragraph directly lists 'patients' expectations, the ritual of treatment, or the natural fluctuation of chronic conditions' as possible explanations."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1450,
    stem:
      "Few findings in medical research are as unsettling to surgeons as the results of sham-surgery trials... Critics of this push note the ethical complexity of exposing patients to the risks of anesthesia and incision without any prospect of therapeutic benefit, a tension that has slowed the adoption of sham-controlled methodology even as its scientific value becomes harder to dispute.\n\nWhat ethical tension does the passage describe regarding sham-controlled trials?",
    options: [
      "Patients are never informed about the nature of the trial",
      "Exposing patients to surgical risks without therapeutic prospect, versus the scientific value of rigorous testing",
      "Surgeons refuse to perform any sham surgery under any circumstances",
      "Sham trials are illegal in most countries",
    ],
    correctIndex: 1,
    explanationShort: "The passage explicitly names the tension between exposing patients to risk without benefit and the trials' scientific value.",
    explanationSteps: ["The final sentence states this tension directly, including both sides of the ethical trade-off."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1300,
    stem:
      "Few findings in medical research are as unsettling to surgeons as the results of sham-surgery trials... None of this implies that surgery is generally ineffective; for many conditions, sham-controlled trials have confirmed a genuine benefit beyond placebo.\n\nAccording to the passage, has surgery in general been shown to be ineffective?",
    options: [
      "Yes, for all conditions surgery has no real effect",
      "No - many conditions show a genuine benefit beyond placebo in sham-controlled trials",
      "The passage does not address the effectiveness of surgery at all",
      "Only sham surgery has been shown to be effective",
    ],
    correctIndex: 1,
    explanationShort: "The passage explicitly denies that surgery is generally ineffective, citing confirmed genuine benefit in many conditions.",
    explanationSteps: ["The sentence 'None of this implies that surgery is generally ineffective' directly rules out the other options."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1350,
    stem:
      "Recommendation algorithms are frequently criticized for creating filter bubbles, narrowing what users encounter to a reflection of their existing preferences. A less discussed but arguably more consequential effect is their tendency to amplify already-popular content at the expense of niche but high-quality alternatives, a dynamic sometimes called algorithmic conformity. Because most recommendation systems rely heavily on aggregate behavioral signals - what similar users have already clicked, watched, or purchased - content that has already accumulated engagement receives disproportionate future exposure, regardless of whether it is genuinely the best match for a given individual.\n\nThis creates a feedback loop: popular items become more popular simply by virtue of being popular, while equally good or better alternatives that happen to lack an early engagement advantage remain permanently obscured. Researchers studying music and book recommendation platforms have found that small, essentially random differences in early engagement - which item happened to be clicked first by a handful of influential users - can determine which of several comparable products becomes a runaway success and which disappears into obscurity, a phenomenon with unsettling implications for cultural diversity.\n\nSome platforms have experimented with deliberately injecting randomness into recommendations, occasionally surfacing lower-engagement content to break the feedback loop and allow genuine quality signals more room to compete with mere popularity. Early results are mixed: users report modestly higher satisfaction with the diversity of what they discover, but overall engagement metrics - the top priority for platforms dependent on advertising revenue - tend to decline slightly, creating a persistent commercial disincentive against adopting such fixes at scale.\n\nWhat is 'algorithmic conformity' as described in the passage?",
    options: [
      "The tendency of algorithms to filter out all popular content entirely",
      "The tendency of algorithms to amplify already-popular content at the expense of niche alternatives",
      "A method guaranteed to produce cultural diversity",
      "A type of malicious computer virus",
    ],
    correctIndex: 1,
    explanationShort: "The passage explicitly defines algorithmic conformity as amplifying already-popular content over niche alternatives.",
    explanationSteps: ["The definition appears directly in the first paragraph: 'their tendency to amplify already-popular content at the expense of niche but high-quality alternatives'."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1400,
    stem:
      "Recommendation algorithms are frequently criticized for creating filter bubbles... Early results are mixed: users report modestly higher satisfaction with the diversity of what they discover, but overall engagement metrics - the top priority for platforms dependent on advertising revenue - tend to decline slightly, creating a persistent commercial disincentive against adopting such fixes at scale.\n\nAccording to the passage, why do platforms hesitate to inject randomness into recommendations at scale?",
    options: [
      "It is technically impossible to implement",
      "It slightly decreases overall engagement metrics, which are commercially important to advertising-dependent platforms",
      "Users always dislike any randomness in recommendations",
      "It is illegal in most jurisdictions",
    ],
    correctIndex: 1,
    explanationShort: "The passage states engagement metrics 'tend to decline slightly', creating a commercial disincentive for ad-dependent platforms.",
    explanationSteps: ["The final sentence directly links declining engagement metrics to platforms' advertising-revenue priorities."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1450,
    stem:
      "Recommendation algorithms are frequently criticized for creating filter bubbles... Researchers studying music and book recommendation platforms have found that small, essentially random differences in early engagement - which item happened to be clicked first by a handful of influential users - can determine which of several comparable products becomes a runaway success and which disappears into obscurity.\n\nWhat have researchers found about early engagement differences among comparable products?",
    options: [
      "They have no effect on long-term popularity whatsoever",
      "They can determine which of several comparable products becomes a runaway success",
      "They only matter for books, never for music",
      "They always favor the objectively highest-quality product",
    ],
    correctIndex: 1,
    explanationShort: "The passage states these small, essentially random early differences 'can determine which... becomes a runaway success'.",
    explanationSteps: ["The sentence directly states this causal relationship between early engagement and eventual popularity."],
  },
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

  // ================= DTK - Diagram, tabeller och kartor (riktiga tabeller, diagram och kartor) =================
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1400,
    stem: "Tabellen visar ett företags vinst per kvartal. Om bolagsskatten är 22 % på årsvinsten, hur mycket betalar företaget i skatt för året?",
    visualType: "table",
    visualData: {
      title: "Kvartalsvis vinst (miljoner kr)",
      columns: ["Kvartal", "Vinst (mkr)"],
      rows: [["Q1", 12], ["Q2", 15], ["Q3", 9], ["Q4", 18]],
    },
    options: ["10,88 miljoner kr", "11,88 miljoner kr", "12,88 miljoner kr", "13,88 miljoner kr"],
    correctIndex: 1,
    explanationShort: "Årsvinsten är 54 miljoner kr, och 22 % av det är 11,88 miljoner kr.",
    explanationSteps: ["Årsvinst: 12+15+9+18 = 54 miljoner kr.", "Skatt: 54 × 0,22 = 11,88 miljoner kr."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1550,
    stem:
      "Diagrammet visar hur en kommuns budget på 400 miljoner kr fördelas i år. Nästa år ökar den totala budgeten med 10 % och skolans andel ökar till 45 % av den nya budgeten.\n\nHur mycket mer får skolan nästa år jämfört med i år, i kronor?",
    visualType: "pie",
    visualData: {
      title: "Kommunens budgetfördelning i år",
      data: [
        { name: "Skola", value: 40 },
        { name: "Vård", value: 30 },
        { name: "Infrastruktur", value: 20 },
        { name: "Övrigt", value: 10 },
      ],
    },
    options: ["28 miljoner kr", "33 miljoner kr", "38 miljoner kr", "44 miljoner kr"],
    correctIndex: 2,
    explanationShort: "Skolan går från 160 till 198 miljoner kr, en ökning på 38 miljoner kr.",
    explanationSteps: ["I år: 40 % × 400 = 160 miljoner kr.", "Nästa år: budget = 400×1,10 = 440 miljoner kr, skola = 45 % × 440 = 198 miljoner kr.", "Ökning: 198 - 160 = 38 miljoner kr."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1450,
    stem: "Tabellen visar medeltemperatur och nederbörd för fyra städer.\n\nVilken stad har högst nederbörd per grad medeltemperatur?",
    visualType: "table",
    visualData: {
      title: "Klimatdata för fyra städer",
      columns: ["Stad", "Medeltemperatur (°C)", "Nederbörd (mm)"],
      rows: [
        ["Stad A", 12, 600],
        ["Stad B", 15, 450],
        ["Stad C", 9, 800],
        ["Stad D", 18, 300],
      ],
    },
    options: ["Stad A", "Stad B", "Stad C", "Stad D"],
    correctIndex: 2,
    explanationShort: "Stad C har cirka 88,9 mm per grad, klart högst av de fyra.",
    explanationSteps: ["A: 600/12 = 50.", "B: 450/15 = 30.", "C: 800/9 ≈ 88,9.", "D: 300/18 ≈ 16,7.", "Stad C har högst kvot."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1400,
    stem: "Diagrammet visar ett företags kundantal 2020-2023.\n\nUnder vilket år var den procentuella ökningen störst?",
    visualType: "line",
    visualData: {
      title: "Kundantal 2020-2023",
      yLabel: "Antal kunder",
      data: [
        { name: "2020", kunder: 1200 },
        { name: "2021", kunder: 1500 },
        { name: "2022", kunder: 1800 },
        { name: "2023", kunder: 2000 },
      ],
      series: [{ key: "kunder", label: "Kunder" }],
    },
    options: ["2021", "2022", "2023", "Alla lika"],
    correctIndex: 0,
    explanationShort: "Ökningen 2020→2021 var 25 %, klart högst av de tre.",
    explanationSteps: ["2020→2021: (1500-1200)/1200 = 25 %.", "2021→2022: (1800-1500)/1500 = 20 %.", "2022→2023: (2000-1800)/1800 ≈ 11,1 %.", "Störst ökning: 2021."],
  },
  {
    subtest: "DTK", concept: "kartor-skala", difficulty: 1350,
    stem: "Kartan visar två städer och avståndet mellan dem. Skalan är 1:50 000.\n\nVad är det verkliga avståndet mellan Björkvik och Sandnäs?",
    visualType: "map",
    visualData: {
      title: "Karta, skala 1:50 000",
      points: [
        { id: "a", label: "Björkvik", x: 90, y: 150 },
        { id: "b", label: "Sandnäs", x: 310, y: 150 },
      ],
      edges: [{ from: "a", to: "b", label: "8 cm" }],
      scaleLabel: "Skala 1:50 000",
    },
    options: ["2 km", "4 km", "40 km", "400 km"],
    correctIndex: 1,
    explanationShort: "8 cm × 50 000 = 400 000 cm = 4 km.",
    explanationSteps: ["Verkligt avstånd = kartavstånd × skalfaktor.", "8 cm × 50 000 = 400 000 cm.", "400 000 cm = 4 000 m = 4 km."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1300,
    stem: "Diagrammet visar marknadsandelar för fyra företag. Marknaden växer med 10 % nästa år, men andelarna förblir desamma. Om marknaden idag är värd 1 000 000 kr, hur mycket kommer Företag B:s andel vara värd nästa år?",
    visualType: "pie",
    visualData: {
      title: "Marknadsandelar i år",
      data: [
        { name: "Företag A", value: 35 },
        { name: "Företag B", value: 30 },
        { name: "Företag C", value: 20 },
        { name: "Företag D", value: 15 },
      ],
    },
    options: ["300 000 kr", "310 000 kr", "330 000 kr", "350 000 kr"],
    correctIndex: 2,
    explanationShort: "Ny marknad = 1 100 000 kr, 30 % av det = 330 000 kr.",
    explanationSteps: ["Ny total marknad: 1 000 000 × 1,10 = 1 100 000 kr.", "Företag B:s andel: 30 % × 1 100 000 = 330 000 kr."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1300,
    stem: "Tabellen visar antal anställda per avdelning på ett företag.\n\nHur stor andel av alla anställda jobbar inom Sälj?",
    visualType: "table",
    visualData: {
      title: "Anställda per avdelning",
      columns: ["Avdelning", "Antal anställda"],
      rows: [["IT", 24], ["Sälj", 36], ["Support", 18], ["Ekonomi", 12]],
    },
    options: ["30 %", "36 %", "40 %", "45 %"],
    correctIndex: 2,
    explanationShort: "Totalt 90 anställda, 36 inom Sälj = 40 %.",
    explanationSteps: ["Totalt: 24+36+18+12 = 90.", "Andel Sälj: 36/90 = 0,40 = 40 %."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1300,
    stem: "Diagrammet visar en hushållsbudget. Månadsinkomsten är 32 000 kr.\n\nHur mycket läggs på sparande?",
    visualType: "pie",
    visualData: {
      title: "Hushållsbudget, andel av inkomst",
      data: [
        { name: "Boende", value: 35 },
        { name: "Mat", value: 20 },
        { name: "Transport", value: 15 },
        { name: "Nöje", value: 10 },
        { name: "Sparande", value: 20 },
      ],
    },
    options: ["5 400 kr", "6 000 kr", "6 400 kr", "7 000 kr"],
    correctIndex: 2,
    explanationShort: "20 % av 32 000 kr = 6 400 kr.",
    explanationSteps: ["Sparande = 20 % av 32 000.", "0,20 × 32 000 = 6 400 kr."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1350,
    stem: "Diagrammet visar en akties stängningskurs (kr) under en vecka.\n\nVad var den största enskilda dagsförändringen (i kronor, mellan två på varandra följande dagar)?",
    visualType: "line",
    visualData: {
      title: "Aktiens stängningskurs under en vecka",
      yLabel: "Kurs (kr)",
      data: [
        { name: "Mån", kurs: 120 },
        { name: "Tis", kurs: 126 },
        { name: "Ons", kurs: 118 },
        { name: "Tors", kurs: 130 },
        { name: "Fre", kurs: 136 },
      ],
      series: [{ key: "kurs", label: "Kurs" }],
    },
    options: ["6 kr", "8 kr", "10 kr", "12 kr"],
    correctIndex: 3,
    explanationShort: "Störst förändring var mellan onsdag och torsdag: 130 - 118 = 12 kr.",
    explanationSteps: ["Mån→Tis: +6. Tis→Ons: -8. Ons→Tors: +12. Tors→Fre: +6.", "Störst förändring (absolut) är 12 kr."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1300,
    stem: "Diagrammet visar regnmängd (mm) per månad.\n\nVad var den genomsnittliga regnmängden dessa fyra månader?",
    visualType: "bar",
    visualData: {
      title: "Regnmängd per månad",
      yLabel: "mm",
      data: [
        { name: "Jan", regn: 40 },
        { name: "Feb", regn: 35 },
        { name: "Mar", regn: 50 },
        { name: "Apr", regn: 45 },
      ],
      series: [{ key: "regn", label: "Regnmängd" }],
    },
    options: ["40 mm", "42,5 mm", "45 mm", "47,5 mm"],
    correctIndex: 1,
    explanationShort: "(40+35+50+45)/4 = 170/4 = 42,5 mm.",
    explanationSteps: ["Summa: 40 + 35 + 50 + 45 = 170.", "Genomsnitt: 170 / 4 = 42,5 mm."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1300,
    stem: "Tabellen visar exportvärde (miljoner kr) för tre år.\n\nHur stor var den procentuella ökningen från 2022 till 2023?",
    visualType: "table",
    visualData: {
      title: "Exportvärde per år",
      columns: ["År", "Exportvärde (mkr)"],
      rows: [["2021", "800"], ["2022", "920"], ["2023", "1 012"]],
    },
    options: ["8 %", "9 %", "10 %", "12 %"],
    correctIndex: 2,
    explanationShort: "(1012-920)/920 = 92/920 = 0,10 = 10 %.",
    explanationSteps: ["Ökning: 1012 - 920 = 92 miljoner kr.", "Procentuell ökning: 92 / 920 = 0,10 = 10 %."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1300,
    stem: "Tabellen visar antal nyanmälda patienter och genomsnittlig väntetid (dagar) vid fyra vårdcentraler under ett kvartal.\n\nVilken vårdcentral hade flest 'väntedagar' totalt (antal patienter × genomsnittlig väntetid)?",
    visualType: "table",
    visualData: {
      title: "Patienter och väntetid per vårdcentral",
      columns: ["Vårdcentral", "Patienter", "Väntetid (dagar)"],
      rows: [
        ["Centrum", 420, 12],
        ["Norr", 310, 18],
        ["Söder", 275, 9],
        ["Väster", 190, 21],
      ],
    },
    options: ["Centrum", "Norr", "Söder", "Väster"],
    correctIndex: 1,
    explanationShort: "Norr hade flest totala väntedagar: 310 × 18 = 5 580.",
    explanationSteps: ["Centrum: 420×12 = 5 040.", "Norr: 310×18 = 5 580.", "Söder: 275×9 = 2 475.", "Väster: 190×21 = 3 990.", "Norr har flest totala väntedagar."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1350,
    stem: "Tabellen visar antal invånare i fyra kommuner år 2015 och 2023.\n\nVilken kommun hade störst procentuell förändring i befolkning mellan 2015 och 2023 (oavsett riktning)?",
    visualType: "table",
    visualData: {
      title: "Befolkning 2015 och 2023",
      columns: ["Kommun", "2015", "2023"],
      rows: [
        ["Kommun A", "24 000", "27 600"],
        ["Kommun B", "41 000", "43 050"],
        ["Kommun C", "15 500", "13 950"],
        ["Kommun D", "60 000", "66 000"],
      ],
    },
    options: ["Kommun A", "Kommun B", "Kommun C", "Kommun D"],
    correctIndex: 0,
    explanationShort: "Kommun A hade störst procentuell förändring: +15 %.",
    explanationSteps: ["A: (27 600-24 000)/24 000 = 15 %.", "B: (43 050-41 000)/41 000 = 5 %.", "C: (13 950-15 500)/15 500 = -10 %.", "D: (66 000-60 000)/60 000 = 10 %.", "Kommun A har störst förändring i absoluta tal (15 %)."],
  },
  {
    subtest: "DTK", concept: "kartor-skala", difficulty: 1500,
    stem: "Kartan visar det planerade dricksvattenledningsnätet mellan fyra samhällen, med ledningarnas längder markerade i kilometer. Vattenverket ligger i Almby.\n\nVilken är den kortaste ledningssträckningen för att nå Cederäng från Almby - direkt eller via de andra samhällena?",
    visualType: "map",
    visualData: {
      title: "Planerat vattenledningsnät",
      points: [
        { id: "a", label: "Almby", x: 70, y: 60 },
        { id: "b", label: "Björkhult", x: 260, y: 50 },
        { id: "c", label: "Cederäng", x: 330, y: 210 },
        { id: "d", label: "Dalby", x: 100, y: 240 },
      ],
      edges: [
        { from: "a", to: "b", label: "12 km" },
        { from: "b", to: "c", label: "18 km" },
        { from: "c", to: "d", label: "9 km" },
        { from: "d", to: "a", label: "14 km" },
        { from: "a", to: "c", label: "22 km" },
      ],
      scaleLabel: "Ledningarnas verkliga längd anges i km vid respektive sträcka.",
    },
    options: ["18 km", "22 km", "23 km", "30 km"],
    correctIndex: 1,
    explanationShort: "Direkt ledning Almby-Cederäng är 22 km, kortare än via Björkhult (30 km) eller via Dalby (23 km).",
    explanationSteps: ["Direkt: Almby-Cederäng = 22 km.", "Via Björkhult: 12+18 = 30 km.", "Via Dalby: 14+9 = 23 km.", "Kortast är den direkta sträckningen: 22 km."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1350,
    stem: "Tabellen visar antal sålda biljetter och total intäkt för tre biografer en helg.\n\nVilken biograf hade högst genomsnittligt biljettpris?",
    visualType: "table",
    visualData: {
      title: "Biljettförsäljning en helg",
      columns: ["Biograf", "Biljetter", "Intäkt (kr)"],
      rows: [
        ["Bio Stjärnan", "1 200", "168 000"],
        ["Bio Kometen", "950", "142 500"],
        ["Bio Solen", "1 500", "187 500"],
      ],
    },
    options: ["Bio Stjärnan", "Bio Kometen", "Bio Solen", "Alla lika"],
    correctIndex: 1,
    explanationShort: "Bio Kometen hade högst snittpris: 142 500 / 950 = 150 kr.",
    explanationSteps: ["Stjärnan: 168 000/1 200 = 140 kr.", "Kometen: 142 500/950 = 150 kr.", "Solen: 187 500/1 500 = 125 kr.", "Kometen hade högst snittpris."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1400,
    stem: "Tabellen visar ett företags personalkostnader och omsättning (miljoner kr) för tre år.\n\nUnder vilket år var personalkostnaden som andel av omsättningen högst?",
    visualType: "table",
    visualData: {
      title: "Personalkostnad och omsättning",
      columns: ["År", "Personalkostnad (mkr)", "Omsättning (mkr)"],
      rows: [
        ["2021", 18, 90],
        ["2022", 21, 105],
        ["2023", 26, 118],
      ],
    },
    options: ["2021", "2022", "2023", "Alla lika"],
    correctIndex: 2,
    explanationShort: "2023 hade högst andel: cirka 22 %, mot 20 % de föregående åren.",
    explanationSteps: ["2021: 18/90 = 20 %.", "2022: 21/105 = 20 %.", "2023: 26/118 ≈ 22 %.", "2023 hade högst andel."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1500,
    stem: "Tabellen visar antal deltagare och genomsnittligt resultat (poäng) i en tävling för fyra lag.\n\nVad var det sammanlagda genomsnittliga resultatet för alla deltagare (viktat medelvärde)?",
    visualType: "table",
    visualData: {
      title: "Tävlingsresultat per lag",
      columns: ["Lag", "Deltagare", "Poäng (snitt)"],
      rows: [
        ["Lag A", 12, 45],
        ["Lag B", 8, 52],
        ["Lag C", 15, 38],
        ["Lag D", 10, 48],
      ],
    },
    options: ["42,1 poäng", "43,4 poäng", "44,6 poäng", "45,8 poäng"],
    correctIndex: 2,
    explanationShort: "Det viktade medelvärdet över alla 45 deltagare blir cirka 44,6 poäng.",
    explanationSteps: ["Totalpoäng: 12×45 + 8×52 + 15×38 + 10×48 = 540+416+570+480 = 2006.", "Totalt antal deltagare: 12+8+15+10 = 45.", "Viktat medelvärde: 2006/45 ≈ 44,6 poäng."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1450,
    stem: "Diagrammet visar en butikskedjas försäljning (miljoner kr) per region. Nästa år väntas Norr och Öst växa med 25 % vardera, medan Syd och Väst väntas minska med 10 % vardera.\n\nVad blir den totala försäljningen nästa år?",
    visualType: "bar",
    visualData: {
      title: "Försäljning per region i år",
      yLabel: "Miljoner kr",
      data: [
        { name: "Norr", forsaljning: 24 },
        { name: "Syd", forsaljning: 36 },
        { name: "Öst", forsaljning: 18 },
        { name: "Väst", forsaljning: 30 },
      ],
      series: [{ key: "forsaljning", label: "Försäljning" }],
    },
    options: ["105,9 miljoner kr", "108,9 miljoner kr", "111,9 miljoner kr", "114,9 miljoner kr"],
    correctIndex: 2,
    explanationShort: "Summan av alla fyra regioner nästa år blir 111,9 miljoner kr.",
    explanationSteps: ["Norr: 24×1,25=30. Öst: 18×1,25=22,5.", "Syd: 36×0,90=32,4. Väst: 30×0,90=27.", "Summa: 30+22,5+32,4+27 = 111,9 miljoner kr."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1350,
    stem: "Diagrammet visar antal soltimmar per månad för två städer.\n\nUnder vilken månad var skillnaden mellan städerna störst (i timmar)?",
    visualType: "bar",
    visualData: {
      title: "Soltimmar per månad, två städer",
      yLabel: "Timmar",
      data: [
        { name: "Maj", stadX: 220, stadY: 180 },
        { name: "Jun", stadX: 260, stadY: 210 },
        { name: "Jul", stadX: 280, stadY: 300 },
        { name: "Aug", stadX: 250, stadY: 240 },
      ],
      series: [
        { key: "stadX", label: "Stad X" },
        { key: "stadY", label: "Stad Y" },
      ],
    },
    options: ["Maj", "Juni", "Juli", "Augusti"],
    correctIndex: 1,
    explanationShort: "Störst skillnad var i juni: 50 timmar.",
    explanationSteps: ["Maj: 220-180=40 h.", "Juni: 260-210=50 h.", "Juli: |280-300|=20 h.", "Augusti: 250-240=10 h.", "Störst skillnad var i juni."],
  },
  {
    subtest: "DTK", concept: "kartor-skala", difficulty: 1400,
    stem: "Kartan visar en vandringsled mellan två punkter, med skalan 1:200 000.\n\nHur lång tid tar det att vandra hela leden om man går med en hastighet av 4 km/h?",
    visualType: "map",
    visualData: {
      title: "Vandringsled, skala 1:200 000",
      points: [
        { id: "start", label: "Start", x: 60, y: 220 },
        { id: "mal", label: "Mål", x: 340, y: 90 },
      ],
      edges: [{ from: "start", to: "mal", label: "8,5 cm" }],
      scaleLabel: "Skala 1:200 000",
    },
    options: ["3 timmar 45 minuter", "4 timmar 15 minuter", "4 timmar 45 minuter", "5 timmar 15 minuter"],
    correctIndex: 1,
    explanationShort: "Ledens verkliga längd är 17 km, vilket tar 4 timmar 15 minuter i 4 km/h.",
    explanationSteps: ["Verklig längd: 8,5 × 200 000 = 1 700 000 cm = 17 km.", "Tid: 17 km / 4 km/h = 4,25 timmar = 4 timmar 15 minuter."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1500,
    stem: "Tabellen visar ett lands import och export (miljarder kr) under fyra kvartal.\n\nUnder hela året, var handelsbalansen (export minus import) positiv eller negativ, och med hur mycket?",
    visualType: "table",
    visualData: {
      title: "Import och export per kvartal",
      columns: ["Kvartal", "Import (mdkr)", "Export (mdkr)"],
      rows: [
        ["Q1", 45, 38],
        ["Q2", 52, 49],
        ["Q3", 48, 55],
        ["Q4", 41, 47],
      ],
    },
    options: ["Negativ, -3 miljarder kr", "Negativ, -7 miljarder kr", "Positiv, +3 miljarder kr", "Positiv, +7 miljarder kr"],
    correctIndex: 2,
    explanationShort: "Total export (189) översteg total import (186) med 3 miljarder kr - en positiv handelsbalans.",
    explanationSteps: ["Total import: 45+52+48+41 = 186.", "Total export: 38+49+55+47 = 189.", "Handelsbalans: 189-186 = +3 miljarder kr, alltså positiv."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1450,
    stem: "Diagrammet visar en universitetsutbildnings studenter fördelat på program. Totalt antal studenter är 4 800. Andelen kvinnor inom Medicin är 65 %.\n\nHur många kvinnliga studenter finns inom Medicin?",
    visualType: "pie",
    visualData: {
      title: "Studenter per program",
      data: [
        { name: "Ekonomi", value: 30 },
        { name: "Teknik", value: 25 },
        { name: "Juridik", value: 20 },
        { name: "Medicin", value: 15 },
        { name: "Övrigt", value: 10 },
      ],
    },
    options: ["432", "468", "504", "540"],
    correctIndex: 1,
    explanationShort: "Antalet studenter inom Medicin är 720, varav 65 % (468) är kvinnor.",
    explanationSteps: ["Antal studenter inom Medicin: 15 % × 4 800 = 720.", "Kvinnor inom Medicin: 65 % × 720 = 468."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1400,
    stem: "Tabellen visar medelinkomst (tkr/år) för fem yrkesgrupper och andel av arbetskraften de utgör.\n\nVad är den viktade genomsnittliga medelinkomsten för hela arbetskraften?",
    visualType: "table",
    visualData: {
      title: "Medelinkomst per yrkesgrupp",
      columns: ["Grupp", "Medelinkomst (tkr)", "Andel av arbetskraften"],
      rows: [
        ["Grupp A", 320, "15 %"],
        ["Grupp B", 410, "25 %"],
        ["Grupp C", 280, "30 %"],
        ["Grupp D", 510, "10 %"],
        ["Grupp E", 350, "20 %"],
      ],
    },
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
        visualType: q.visualType ?? null,
        visualData: q.visualData ? JSON.stringify(q.visualData) : null,
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

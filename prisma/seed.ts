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

const questions: QSeed[] = [
  // ================= ORD - Ordförståelse (5 svarsalternativ, som på riktiga provet) =================
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1150,
    stem: "SVEKFULL",
    options: ["Ärlig och trogen", "Falsk och bedräglig", "Rädd och försiktig", "Stolt och självsäker", "Tyst och tillbakadragen"],
    correctIndex: 1,
    explanationShort: "Svekfull betyder falsk och bedräglig - man begår svek mot någon.",
    explanationSteps: ["Ordet är släkt med 'svek' - att medvetet bedra någons förtroende.", "Svekfull beskriver alltså den som är falsk och bedräglig."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1000,
    stem: "BEFOGAD",
    options: ["Förbjuden", "Berättigad", "Obestämd", "Tillfällig", "Överdriven"],
    correctIndex: 1,
    explanationShort: "Befogad betyder berättigad eller motiverad.",
    explanationSteps: ["'Befogad kritik' är kritik som är motiverad och rimlig.", "Synonymt med berättigad."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1200,
    stem: "SKARPSINNIG",
    options: ["Ytlig och slarvig", "Långsam i tanken", "Skarpt iakttagande och klok", "Envis och sträng", "Blyg och tystlåten"],
    correctIndex: 2,
    explanationShort: "Skarpsinnig betyder skarpt iakttagande, klok och analytisk.",
    explanationSteps: ["Ordet beskriver förmågan att snabbt genomskåda och förstå ett problem.", "Synonymt med skarpt iakttagande och klok."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1050,
    stem: "BETÄNKSAM",
    options: ["Beslutsam", "Tveksam och eftertänksam", "Obekymrad", "Impulsiv", "Likgiltig"],
    correctIndex: 1,
    explanationShort: "Betänksam betyder tveksam och eftertänksam, ofta lite tvekande.",
    explanationSteps: ["'Bli betänksam' innebär att börja tveka och fundera extra.", "Synonymt med tveksam och eftertänksam."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1000,
    stem: "FÖRHASTAD",
    options: ["Väl genomtänkt", "Sen och fördröjd", "Alltför snabbt fattad, ogenomtänkt", "Oundviklig", "Enhällig"],
    correctIndex: 2,
    explanationShort: "Förhastad betyder att något gjorts alltför snabbt, utan tillräcklig eftertanke.",
    explanationSteps: ["'Ett förhastat beslut' är ett beslut som fattats för snabbt.", "Synonymt med alltför snabbt fattad, ogenomtänkt."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1100,
    stem: "ANSPRÅKSLÖS",
    options: ["Fordrande", "Ståtlig", "Självupptagen", "Blygsam, utan höga krav", "Ambitiös"],
    correctIndex: 3,
    explanationShort: "Anspråkslös betyder blygsam och utan höga krav eller pretentioner.",
    explanationSteps: ["'Ett anspråkslöst hem' är ett enkelt hem utan lyxiga krav.", "Synonymt med blygsam, utan höga krav."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1150,
    stem: "MÅNGTYDIG",
    options: ["Entydig", "Kan tolkas på flera sätt", "Kortfattad", "Osann", "Föråldrad"],
    correctIndex: 1,
    explanationShort: "Mångtydig betyder att något kan tolkas på flera olika sätt.",
    explanationSteps: ["Motsatsen till entydig.", "Mångtydig = öppen för flera tolkningar."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 900,
    stem: "SPORADISK",
    options: ["Ständig", "Oregelbunden, sällan förekommande", "Snabb", "Utbredd", "Planerad"],
    correctIndex: 1,
    explanationShort: "Sporadisk betyder oregelbunden och sällan förekommande.",
    explanationSteps: ["'Sporadiska besök' är besök som sker då och då, utan mönster.", "Synonymt med oregelbunden, sällan förekommande."],
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
    subtest: "ORD", concept: "synonymer", difficulty: 750,
    stem: "INSTÄMMA",
    options: ["Motsäga", "Hålla med", "Tvivla på", "Avstå från att svara", "Ändra åsikt"],
    correctIndex: 1,
    explanationShort: "Att instämma i något är att hålla med om det.",
    explanationSteps: ["'Jag instämmer' betyder 'jag håller med'.", "Direkt synonym."],
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
    subtest: "ORD", concept: "synonymer", difficulty: 900,
    stem: "SVÅRFÖRKLARLIG",
    options: ["Lätt att bevisa", "Allmänt känd", "Svår att förstå orsaken till", "Snabbt avgjord", "Väl dokumenterad"],
    correctIndex: 2,
    explanationShort: "Svårförklarlig betyder svår att förstå orsaken till.",
    explanationSteps: ["Sammansättningen 'svår + förklarlig' ger betydelsen direkt.", "Något man inte lätt kan förklara varför det sker."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1050,
    stem: "FÖRUTSEENDE",
    options: ["Efterklok", "Med god förmåga att förutse vad som ska hända", "Kortsiktig", "Obeslutsam", "Slumpmässig"],
    correctIndex: 1,
    explanationShort: "Förutseende betyder att i förväg se vad som kommer att hända.",
    explanationSteps: ["Motsatsen till efterklok (som förstår i efterhand).", "Förutseende = ser konsekvenser i förväg."],
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
    subtest: "ORD", concept: "synonymer", difficulty: 700,
    stem: "HYSA",
    options: ["Avslöja", "Bära på (en känsla)", "Förneka", "Överdriva", "Glömma"],
    correctIndex: 1,
    explanationShort: "Att hysa en känsla är att bära på den.",
    explanationSteps: ["'Hysa förhoppningar' = bära på förhoppningar.", "Synonymt med att bära på (en känsla eller uppfattning)."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 850,
    stem: "OMDÖME",
    options: ["Envishet", "Förmåga att bedöma rätt och fel", "Fantasi", "Minne", "Mod"],
    correctIndex: 1,
    explanationShort: "Omdöme betyder förmåga att bedöma en situation korrekt.",
    explanationSteps: ["'Gott omdöme' innebär att fatta kloka beslut.", "Synonymt med bedömningsförmåga."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1150,
    stem: "EFTERSTRÄVANSVÄRD",
    options: ["Onödig", "Overklig", "Värd att sträva efter", "Föråldrad", "Tvivelaktig"],
    correctIndex: 2,
    explanationShort: "Eftersträvansvärd betyder värd att sträva efter, önskvärd.",
    explanationSteps: ["Sammansättning av 'eftersträva' (sträva efter) och 'värd'.", "Direkt betydelse: värd att sträva efter."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 900,
    stem: "OFÖRUTSEDD",
    options: ["Planerad i förväg", "Ofrånkomlig", "Oväntad, inte förutspådd", "Återkommande", "Önskvärd"],
    correctIndex: 2,
    explanationShort: "Oförutsedd betyder oväntad, något som inte förutspåtts.",
    explanationSteps: ["Förleden 'o-' vänder 'förutsedd' till motsatsen.", "Oförutsedd = oväntad händelse."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1250,
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
    subtest: "ORD", concept: "synonymer", difficulty: 800,
    stem: "HÄNSYNSLÖS",
    options: ["Omtänksam", "Utan hänsyn till andra", "Försiktig", "Blyg", "Tillmötesgående"],
    correctIndex: 1,
    explanationShort: "Hänsynslös betyder att agera utan hänsyn till andras behov eller känslor.",
    explanationSteps: ["Förleden 'hänsyns-' + 'lös' (utan).", "Hänsynslös = utan hänsyn till andra."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1200,
    stem: "KATEGORISK",
    options: ["Tveksam", "Vag", "Bestämd, utan undantag eller tvekan", "Undantagen", "Ovillig"],
    correctIndex: 2,
    explanationShort: "Kategorisk betyder bestämd, utan utrymme för undantag eller tvekan.",
    explanationSteps: ["'Ett kategoriskt nej' är ett fullständigt bestämt nej.", "Synonymt med bestämd, utan undantag eller tvekan."],
  },
  {
    subtest: "ORD", concept: "synonymer", difficulty: 1050,
    stem: "FÖRSUMLIG",
    options: ["Noggrann", "Vårdslös, underlåter sina plikter", "Pliktrogen", "Snabb", "Modig"],
    correctIndex: 1,
    explanationShort: "Försumlig betyder vårdslös, den som underlåter att sköta sina plikter.",
    explanationSteps: ["Ordet är släkt med att 'försumma' - att slarva bort eller inte sköta något.", "Försumlig = vårdslös med sina åtaganden."],
  },

  // ================= LÄS - Svensk läsförståelse (längre texter, som på riktiga provet) =================
  {
    subtest: "LAS", concept: "huvudbudskap", difficulty: 1050,
    stem:
      "Under det senaste decenniet har biodling flyttat in i städerna. På tak och i skolträdgårdar surrar tusentals bin mitt bland betong och trafik, ett fenomen som förespråkare kallar en väg mot grönare städer. Kritiker menar dock att den urbana biodlingen riskerar att göra mer skada än nytta: när alltför många bikupor trängs på en liten yta konkurrerar tambina om samma begränsade mängd nektar som vilda pollinatörer - humlor, solitärbin och fjärilar - är beroende av. Flera studier från Europa visar att artrikedomen bland vilda bin faktiskt minskat i områden där antalet bikupor ökat kraftigt. Problemet, menar forskarna, är inte biodling i sig utan bristen på planering: utan tillräckligt med blommande växter för att föda alla pollinatörer blir konkurrensen om resurserna hårdare, inte lindrigare. Lösningen ligger därför inte i färre bikupor, utan i fler blommande ytor som kan bära den ökade belastningen.\n\nVad är textens huvudbudskap?",
    options: [
      "Urban biodling bör förbjudas helt",
      "Fler bikupor i städer är alltid positivt för miljön",
      "Problemet med urban biodling är bristande tillgång på föda, inte biodlingen i sig",
      "Vilda pollinatörer klarar sig bättre än tambin",
    ],
    correctIndex: 2,
    explanationShort: "Texten pekar ut bristen på blommande ytor - inte biodlingen i sig - som det egentliga problemet.",
    explanationSteps: ["Texten presenterar först kritiken, men nyanserar den.", "Sista styckets 'lösningen ligger därför inte i färre bikupor, utan i fler blommande ytor' avslöjar huvudbudskapet."],
  },
  {
    subtest: "LAS", concept: "detaljförståelse", difficulty: 950,
    stem:
      "Under det senaste decenniet har biodling flyttat in i städerna. På tak och i skolträdgårdar surrar tusentals bin mitt bland betong och trafik, ett fenomen som förespråkare kallar en väg mot grönare städer. Kritiker menar dock att den urbana biodlingen riskerar att göra mer skada än nytta: när alltför många bikupor trängs på en liten yta konkurrerar tambina om samma begränsade mängd nektar som vilda pollinatörer - humlor, solitärbin och fjärilar - är beroende av. Flera studier från Europa visar att artrikedomen bland vilda bin faktiskt minskat i områden där antalet bikupor ökat kraftigt.\n\nVad visar studierna från Europa enligt texten?",
    options: [
      "Att artrikedomen bland vilda bin ökat där bikupor blivit fler",
      "Att artrikedomen bland vilda bin minskat där bikupor blivit fler",
      "Att tambin och vilda bin aldrig konkurrerar om föda",
      "Att biodling saknar effekt på andra pollinatörer",
    ],
    correctIndex: 1,
    explanationShort: "Texten anger explicit att artrikedomen bland vilda bin minskat där bikupor blivit fler.",
    explanationSteps: ["Detaljfrågor besvaras genom att hitta exakt formulering i texten.", "Meningen anger uttryckligen ett omvänt (negativt) samband, inte ett positivt."],
  },
  {
    subtest: "LAS", concept: "slutledning", difficulty: 1150,
    stem:
      "Under det senaste decenniet har biodling flyttat in i städerna... Problemet, menar forskarna, är inte biodling i sig utan bristen på planering: utan tillräckligt med blommande växter för att föda alla pollinatörer blir konkurrensen om resurserna hårdare, inte lindrigare. Lösningen ligger därför inte i färre bikupor, utan i fler blommande ytor som kan bära den ökade belastningen.\n\nVilken åtgärd skulle författaren sannolikt förorda?",
    options: [
      "Att avveckla stadens bikupor",
      "Att öka mängden blommande växtytor i städerna",
      "Att flytta all biodling till landsbygden",
      "Att begränsa antalet vilda pollinatörer",
    ],
    correctIndex: 1,
    explanationShort: "Texten säger uttryckligen att lösningen är fler blommande ytor, inte färre bikupor.",
    explanationSteps: ["Slutledningsfrågor kräver att man drar en logisk konsekvens av textens resonemang.", "Den explicit föreslagna lösningen i sista meningen pekar mot ökad tillgång på blommande ytor."],
  },
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
    subtest: "LAS", concept: "huvudbudskap", difficulty: 1050,
    stem:
      "Skiftarbete har länge kopplats till ökad risk för hjärt-kärlsjukdom, men ny forskning pekar på att det inte är själva skiftarbetet som är den avgörande faktorn, utan hur oregelbundna arbetstiderna är. Personer med fasta, om än sena eller tidiga, arbetstider visade i en stor multicenterstudie ungefär samma risknivå som dagarbetare, medan de vars scheman växlade oförutsägbart mellan dag-, kväll- och nattpass hade en betydligt förhöjd risk. Forskarna misstänker att det är den ständigt föränderliga dygnsrytmen, snarare än bristen på dagsljus i sig, som sliter på kroppens system.\n\nVad är textens huvudbudskap?",
    options: [
      "Allt skiftarbete är lika farligt för hälsan",
      "Det är schemats oregelbundenhet, inte skiftarbetet i sig, som ökar hälsoriskerna",
      "Nattarbete bör förbjudas helt",
      "Dagsljus har ingen betydelse för hälsan",
    ],
    correctIndex: 1,
    explanationShort: "Texten nyanserar bilden: det är oregelbundenheten i schemat, inte skiftarbetet i sig, som är avgörande.",
    explanationSteps: ["Signalordet 'men' introducerar textens huvudpoäng.", "Kontrasten mellan fasta scheman (samma risk som dagarbete) och oförutsägbara scheman (förhöjd risk) bekräftar detta."],
  },
  {
    subtest: "LAS", concept: "detaljförståelse", difficulty: 1000,
    stem:
      "Skiftarbete har länge kopplats till ökad risk för hjärt-kärlsjukdom... Personer med fasta, om än sena eller tidiga, arbetstider visade i en stor multicenterstudie ungefär samma risknivå som dagarbetare, medan de vars scheman växlade oförutsägbart mellan dag-, kväll- och nattpass hade en betydligt förhöjd risk.\n\nVilken grupp hade enligt studien en risknivå som liknade dagarbetares?",
    options: [
      "De med oförutsägbart växlande scheman",
      "De med fasta arbetstider, oavsett tid på dygnet",
      "De som helt saknade schema",
      "De som arbetade enbart nattskift utan fasta tider",
    ],
    correctIndex: 1,
    explanationShort: "Texten anger explicit att personer med fasta arbetstider hade liknande risknivå som dagarbetare.",
    explanationSteps: ["Detaljen finns direkt angiven i texten.", "'Fasta, om än sena eller tidiga, arbetstider' är nyckelfrasen."],
  },
  {
    subtest: "LAS", concept: "slutledning", difficulty: 1200,
    stem:
      "Skiftarbete har länge kopplats till ökad risk för hjärt-kärlsjukdom, men ny forskning pekar på att det inte är själva skiftarbetet som är den avgörande faktorn, utan hur oregelbundna arbetstiderna är... Om detta stämmer öppnar det för en enkel men svårgenomförd lösning: arbetsgivare som schemalägger mer förutsägbart, även om det innebär permanenta nattskift för vissa anställda, skulle kunna minska hälsoriskerna utan att helt avskaffa skiftarbetet.\n\nVilken lösning antyder texten skulle kunna minska hälsoriskerna?",
    options: [
      "Att avskaffa allt skiftarbete",
      "Att göra scheman mer förutsägbara, även vid permanenta nattskift",
      "Att förbjuda nattarbete men tillåta kvällsarbete",
      "Att minska antalet arbetstimmar totalt",
    ],
    correctIndex: 1,
    explanationShort: "Texten föreslår explicit mer förutsägbar schemaläggning, även med permanenta nattskift, som lösning.",
    explanationSteps: ["Lösningen anges direkt i sista meningen.", "Notera att avskaffande av skiftarbete uttryckligen avfärdas ('utan att helt avskaffa skiftarbetet')."],
  },
  {
    subtest: "LAS", concept: "huvudbudskap", difficulty: 950,
    stem:
      "Språkvårdare har i århundraden larmat om att svenskan urholkas av lånord - först från tyskan, sedan från franskan, och idag framför allt från engelskan. Ändå visar språkhistorien att svenskan överlevt varje sådan våg utan att förlora sin särart. Det som förändras är sällan språkets grundläggande struktur, utan snarare dess ordförråd, som ständigt anpassas efter vad talarna behöver benämna. Många av dagens 'främmande' ord - fönster, kyrka, gata - är själva gamla lån som för länge sedan smälte samman med språket så till den grad att ingen längre uppfattar dem som utländska.\n\nVad är textens huvudbudskap?",
    options: [
      "Engelska lånord kommer att förstöra svenska språket",
      "Lånord har historiskt blivit en naturlig del av svenskan snarare än ett hot",
      "Svenskan har aldrig påverkats av andra språk förrän nu",
      "Ord som 'fönster' och 'gata' är rent svenska original",
    ],
    correctIndex: 1,
    explanationShort: "Texten visar att tidigare lånord smält samman med svenskan - ett mönster som talar mot att dagens lån är ett hot.",
    explanationSteps: ["Texten kontrasterar oron för lånord med den historiska erfarenheten.", "Exemplen 'fönster, kyrka, gata' bevisar att gamla lån blivit en naturlig del av språket."],
  },
  {
    subtest: "LAS", concept: "detaljförståelse", difficulty: 900,
    stem:
      "Många av dagens 'främmande' ord - fönster, kyrka, gata - är själva gamla lån som för länge sedan smälte samman med språket så till den grad att ingen längre uppfattar dem som utländska.\n\nVilka ord nämns som exempel på gamla lånord som numera uppfattas som svenska?",
    options: ["Dator, mobil, internet", "Fönster, kyrka, gata", "Selfie, hen, klimatångest", "Ombudsman, smörgåsbord, fika"],
    correctIndex: 1,
    explanationShort: "Texten anger explicit orden fönster, kyrka och gata som exempel.",
    explanationSteps: ["Detaljen står ordagrant i texten."],
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

  // ================= MEK - Meningskomplettering =================
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 950,
    stem: "Trots att förslaget var ___, valde styrelsen ändå att rösta ___ det.",
    options: ["kontroversiellt / för", "okontroversiellt / emot", "genomtänkt / emot", "populärt / för"],
    correctIndex: 0,
    explanationShort: "'Trots att' signalerar en motsättning - kontroversiellt förslag men ändå ett ja.",
    explanationSteps: ["'Trots att' kräver en kontrast mellan de två satsdelarna.", "Om förslaget var kontroversiellt men styrelsen ändå röstade för, skapas rätt motsättning.", "Alternativ B och D saknar den kontrasten som 'trots att' kräver."],
    hint1: "'Trots att' signalerar att något oväntat händer.",
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1050,
    stem: "Eftersom bevisen var ___, kunde åklagaren inte annat än att ___ åtalet.",
    options: ["övertygande / väcka", "otillräckliga / lägga ner", "tydliga / förstärka", "nya / omvärdera"],
    correctIndex: 1,
    explanationShort: "'Kunde inte annat än' i kombination med svaga bevis pekar mot att åtalet lades ner.",
    explanationSteps: ["Orsakssambandet 'Eftersom X, kunde inte annat än Y' kräver logisk konsekvens.", "Otillräckliga bevis leder rimligen till att åtalet läggs ner, inte väcks eller förstärks."],
  },
  {
    subtest: "MEK", concept: "ordval-nyans", difficulty: 1100,
    stem: "Hennes argumentation var visserligen ___, men i grunden ___ av starka källor.",
    options: ["svag / oberoende", "vältalig / obekräftad", "kort / underbyggd", "lång / ostödd"],
    correctIndex: 1,
    explanationShort: "'Visserligen...men' kräver en kontrast mellan hur argumentationen framstod och vad den egentligen vilade på.",
    explanationSteps: ["'Visserligen X, men i grunden Y' bygger på motsättning mellan yta och kärna.", "Vältalig (ytan) men obekräftad av källor (kärnan) ger den kontrasten."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 900,
    stem: "Priset på råvaran steg kraftigt, vilket gjorde produktionen ___ och tvingade företaget att ___ sina priser.",
    options: ["billigare / sänka", "dyrare / höja", "dyrare / sänka", "billigare / höja"],
    correctIndex: 1,
    explanationShort: "Stigande råvarupris gör produktionen dyrare, vilket normalt leder till höjda priser.",
    explanationSteps: ["Kedjan är: högre råvarupris → dyrare produktion → högre pris till kund.", "Endast alternativ B följer den logiska kedjan konsekvent."],
  },
  {
    subtest: "MEK", concept: "ordval-nyans", difficulty: 1000,
    stem: "Rapporten var långt ifrån ___ - flera avsnitt motsade varandra ___.",
    options: ["konsekvent / rakt av", "tydlig / sällan", "objektiv / aldrig", "kort / knappt"],
    correctIndex: 0,
    explanationShort: "Motsägande avsnitt visar på bristande konsekvens genom hela rapporten.",
    explanationSteps: ["'Långt ifrån X' betyder motsatsen till X gäller.", "Om avsnitt motsäger varandra rakt av, är rapporten inte konsekvent."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1150,
    stem: "Även om kritikerna var ___, valde regissören att inte ___ filmens slut.",
    options: ["positiva / ändra", "negativa / ändra", "tysta / diskutera", "entusiastiska / förklara"],
    correctIndex: 1,
    explanationShort: "'Även om' + 'valde att inte ändra' antyder att kritiken var negativ men regissören stod fast.",
    explanationSteps: ["'Även om X, ändå inte Y' bygger på en motsättning.", "Negativ kritik men ingen ändring skapar en tydlig, logisk motsättning: regissören stod på sig trots kritik."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1000,
    stem: "Fastän kritikerna var ___ till filmen, blev den en enorm ___ succé hos publiken.",
    options: ["negativa / kommersiell", "positiva / kommersiell", "negativa / konstnärlig", "likgiltiga / obefintlig"],
    correctIndex: 0,
    explanationShort: "'Fastän' kräver en kontrast: negativ kritik men ändå stor framgång hos publiken.",
    explanationSteps: ["'Fastän X, ändå Y' bygger på motsättning.", "Negativa kritiker men kommersiell succé 'hos publiken' ger den kontrasten - övriga alternativ saknar antingen kontrast eller passar inte 'hos publiken'."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 950,
    stem: "Ju mer företaget ___ i forskning, desto ___ blev deras konkurrenskraft på lång sikt.",
    options: ["investerade / starkare", "sparade / starkare", "investerade / svagare", "minskade / starkare"],
    correctIndex: 0,
    explanationShort: "'Ju mer X desto Y' kräver en logisk, positiv koppling mellan investering och konkurrenskraft.",
    explanationSteps: ["Ökad investering i forskning bör rimligen stärka konkurrenskraften, inte försvaga den.", "Endast 'investerade / starkare' ger en konsekvent, logisk kedja."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1150,
    stem: "Eftersom vittnesmålen var ___, kunde åklagaren inte bevisa att den åtalade varit på platsen, vilket ledde till att denne ___.",
    options: ["motstridiga / frikändes", "entydiga / dömdes", "motstridiga / dömdes", "entydiga / frikändes"],
    correctIndex: 0,
    explanationShort: "Motstridiga vittnesmål förklarar varför åklagaren inte kunde bevisa sin sak, vilket ledde till frikännande.",
    explanationSteps: ["Om vittnesmålen varit entydiga hade åklagaren sannolikt kunnat bevisa fallet - det motsäger premissen 'kunde inte bevisa'.", "Motstridiga vittnesmål förklarar bevisbristen, och frikännande blir den logiska följden."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 900,
    stem: "Priset på bostäder har ___ kraftigt de senaste åren, vilket gjort det allt ___ för unga att komma in på marknaden.",
    options: ["stigit / svårare", "sjunkit / svårare", "stigit / lättare", "stabiliserats / svårare"],
    correctIndex: 0,
    explanationShort: "Stigande bostadspriser gör det rimligen svårare, inte lättare, för unga att ta sig in på marknaden.",
    explanationSteps: ["Kedjan är: högre pris → svårare att komma in på marknaden.", "Endast 'stigit / svårare' följer den logiken konsekvent."],
  },
  {
    subtest: "MEK", concept: "ordval-nyans", difficulty: 1000,
    stem: "Debatten var långt ifrån ___ - talarna avbröt varandra och höjde rösten ___.",
    options: ["saklig / upprepade gånger", "saklig / aldrig", "civiliserad / sällan", "livlig / knappt"],
    correctIndex: 0,
    explanationShort: "Att avbryta varandra och höja rösten upprepade gånger beskriver en osaklig, upphetsad debatt.",
    explanationSteps: ["'Långt ifrån X' innebär att motsatsen till X gäller.", "Att talarna avbröt varandra och höjde rösten upprepade gånger visar att debatten var långt ifrån saklig."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1200,
    stem: "Mätningarna avvek kraftigt från modellens förutsägelse, vilket gjorde hypotesen ___ och tvingade forskarna att ___ den.",
    options: ["osannolik / omvärdera", "sannolik / bekräfta", "osannolik / bekräfta", "sannolik / omvärdera"],
    correctIndex: 0,
    explanationShort: "Stora avvikelser från förutsägelsen gör hypotesen osannolik och tvingar fram en omvärdering.",
    explanationSteps: ["Om verkligheten avviker kraftigt från modellen blir hypotesen mindre trolig, inte mer.", "En osannolik hypotes måste omvärderas, inte bekräftas - det är den enda konsekventa kedjan."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1150,
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
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1250,
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
    subtest: "MEK", concept: "ordval-nyans", difficulty: 1200,
    stem: "Rapportens slutsatser byggde på ett ___ dataunderlag, vilket fick flera forskare att ___ resultaten offentligt.",
    options: ["robust / hylla", "bräckligt / ifrågasätta", "robust / ifrågasätta", "omfattande / bekräfta"],
    correctIndex: 1,
    explanationShort: "Ett bräckligt (svagt) dataunderlag förklarar rimligen varför forskare offentligt ifrågasatte resultaten.",
    explanationSteps: ["Orsakssambandet kräver att ett svagt underlag leder till kritik, inte beröm.", "'Bräckligt / ifrågasätta' är den enda konsekventa kombinationen."],
  },

  // ================= ELF - Engelsk läsförståelse =================
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 950,
    stem:
      "\"Remote work, once considered a fringe benefit, has become a standard expectation for many employees. Companies that resist flexible arrangements increasingly struggle to attract talent, regardless of the perks they offer.\"\n\nWhat is the main idea of the passage?",
    options: [
      "Remote work is a temporary trend that will fade",
      "Flexibility has become essential for attracting employees",
      "Companies no longer offer any perks",
      "Employees prefer office work over remote work",
    ],
    correctIndex: 1,
    explanationShort: "The passage states companies resisting flexibility struggle to attract talent - flexibility is now essential.",
    explanationSteps: ["Look for the sentence that generalizes the argument.", "'Increasingly struggle to attract talent' shows flexibility is now a requirement, not a bonus."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 850,
    stem: "The word that is closest in meaning to \"RELUCTANT\" is:",
    options: ["Eager", "Unwilling", "Confident", "Curious"],
    correctIndex: 1,
    explanationShort: "\"Reluctant\" means unwilling or hesitant to do something.",
    explanationSteps: ["Reluctant describes hesitation or resistance to an action.", "The closest synonym among the options is 'unwilling'."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1100,
    stem:
      "\"While critics argue that automation eliminates jobs, historical evidence suggests it primarily transforms them - shifting labor from repetitive tasks toward roles requiring judgment and creativity.\"\n\nAccording to the passage, what does automation primarily do?",
    options: [
      "Eliminates all jobs permanently",
      "Has no measurable effect on labor",
      "Shifts labor toward tasks requiring judgment and creativity",
      "Only affects manufacturing jobs",
    ],
    correctIndex: 2,
    explanationShort: "The passage explicitly says automation 'shifts labor... toward roles requiring judgment and creativity'.",
    explanationSteps: ["The key contrast is 'eliminates' (critics' view) vs. 'transforms' (author's claim).", "The transformation is described precisely in the final clause."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 1000,
    stem: "The word that is closest in meaning to \"MITIGATE\" is:",
    options: ["Worsen", "Reduce", "Ignore", "Reveal"],
    correctIndex: 1,
    explanationShort: "\"Mitigate\" means to make something less severe - to reduce it.",
    explanationSteps: ["Mitigate = lessen the severity of something.", "'Reduce' is the closest match among the alternatives."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1050,
    stem:
      "\"The museum's new exhibit does not merely display artifacts; it reconstructs the sensory experience of the era, using sound, scent, and lighting to immerse visitors in history rather than simply inform them.\"\n\nWhat distinguishes this exhibit according to the text?",
    options: [
      "It focuses only on visual displays",
      "It aims to immerse visitors sensorially, not just inform them",
      "It excludes historical artifacts entirely",
      "It is designed only for children",
    ],
    correctIndex: 1,
    explanationShort: "The passage contrasts 'immerse' with 'simply inform', highlighting the multisensory approach.",
    explanationSteps: ["Look for the contrast signaled by 'not merely... but' / 'rather than'.", "The sensory immersion (sound, scent, lighting) is the distinguishing feature."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 900,
    stem: "The word that is closest in meaning to \"SCARCE\" is:",
    options: ["Abundant", "Rare", "Expensive", "Popular"],
    correctIndex: 1,
    explanationShort: "\"Scarce\" means insufficient in supply - rare.",
    explanationSteps: ["Scarce describes limited availability.", "'Rare' captures this meaning most closely."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1000,
    stem:
      "\"Cities that invest early in public transit infrastructure tend to see slower growth in traffic congestion than those that expand road capacity alone, according to decades of urban planning data.\"\n\nAccording to the passage, what tends to happen in cities that invest early in public transit?",
    options: [
      "Traffic congestion grows more slowly",
      "Road capacity expands automatically",
      "Public transit becomes unnecessary",
      "Urban planning data becomes unreliable",
    ],
    correctIndex: 0,
    explanationShort: "The passage states these cities 'see slower growth in traffic congestion'.",
    explanationSteps: ["The key comparison is between early transit investment and congestion growth.", "The passage directly states slower congestion growth as the outcome."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 900,
    stem: "The word that is closest in meaning to \"AMBIGUOUS\" is:",
    options: ["Clear", "Unclear", "Loud", "Confident"],
    correctIndex: 1,
    explanationShort: "\"Ambiguous\" means open to more than one interpretation - unclear.",
    explanationSteps: ["Ambiguous describes something that lacks a single clear meaning.", "'Unclear' is the closest match among the alternatives."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1100,
    stem:
      "\"Despite widespread assumptions that remote work reduces productivity, several longitudinal studies have found the opposite: employees working from home report completing tasks faster, primarily due to fewer interruptions.\"\n\nWhat do the studies mentioned in the passage find?",
    options: [
      "Remote work reduces productivity as expected",
      "Remote workers complete tasks faster due to fewer interruptions",
      "Office interruptions are rare",
      "Productivity cannot be measured remotely",
    ],
    correctIndex: 1,
    explanationShort: "The passage explicitly states studies found the opposite of the assumption - faster task completion.",
    explanationSteps: ["'Despite... the opposite' signals a contrast with the common assumption.", "The studies found faster completion due to fewer interruptions, as stated directly."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 850,
    stem: "The word that is closest in meaning to \"DILIGENT\" is:",
    options: ["Lazy", "Careless", "Hardworking", "Distracted"],
    correctIndex: 2,
    explanationShort: "\"Diligent\" means showing care and conscientiousness in one's work - hardworking.",
    explanationSteps: ["Diligent describes someone who works carefully and persistently.", "'Hardworking' captures this meaning most closely."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1050,
    stem:
      "\"The museum's decision to digitize its entire archive was driven not by a desire to modernize for its own sake, but by a pressing need to preserve fragile documents that were deteriorating faster than conservators could restore them.\"\n\nWhy did the museum decide to digitize its archive?",
    options: [
      "To modernize for its own sake",
      "To preserve deteriorating documents",
      "To reduce staff costs",
      "To attract more researchers",
    ],
    correctIndex: 1,
    explanationShort: "The passage explicitly contrasts modernization with the real reason: preserving deteriorating documents.",
    explanationSteps: ["'Not X, but Y' signals the true reason is Y.", "The pressing need to preserve deteriorating documents is stated as the actual driver."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 1050,
    stem: "The word that is closest in meaning to \"INADVERTENT\" is:",
    options: ["Deliberate", "Unintentional", "Frequent", "Suspicious"],
    correctIndex: 1,
    explanationShort: "\"Inadvertent\" means happening unintentionally, by accident.",
    explanationSteps: ["Inadvertent describes an unplanned, accidental action.", "'Unintentional' is the closest synonym among the options."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 1350,
    stem: "The word that is closest in meaning to \"TENUOUS\" is:",
    options: ["Weak or flimsy", "Strong", "Certain", "Permanent"],
    correctIndex: 0,
    explanationShort: "\"Tenuous\" describes something very weak, slight, or easily broken - such as a tenuous connection.",
    explanationSteps: ["Tenuous is often used about arguments or connections that barely hold together.", "'Weak or flimsy' is the closest match."],
  },
  {
    subtest: "ELF", concept: "engelsk-ordförståelse", difficulty: 1300,
    stem: "The word that is closest in meaning to \"PRAGMATIC\" is:",
    options: ["Idealistic", "Practical", "Emotional", "Theoretical"],
    correctIndex: 1,
    explanationShort: "\"Pragmatic\" means dealing with things realistically, in a practical way.",
    explanationSteps: ["A pragmatic person focuses on what works in practice, not abstract ideals.", "'Practical' is the closest synonym."],
  },
  {
    subtest: "ELF", concept: "engelsk-läsförståelse", difficulty: 1400,
    stem:
      "\"Convoluted\" reasoning aside, the committee's core recommendation was straightforward. \"It would be a mistake to assume that the committee's silence on the matter implies consent; more often, prolonged silence from a body accustomed to swift rebuttal signals not agreement but simply that no one has yet found a persuasive counterargument.\"\n\nWhat does the passage suggest about the committee's silence?",
    options: [
      "It clearly signals agreement",
      "It may reflect a lack of a persuasive counterargument rather than consent",
      "It proves the committee is dysfunctional",
      "It means the matter was never discussed",
    ],
    correctIndex: 1,
    explanationShort: "The passage explicitly contrasts the common assumption (consent) with an alternative explanation given directly in the text.",
    explanationSteps: ["'It would be a mistake to assume... implies consent' rules out option A.", "The passage offers the real explanation directly: lack of a persuasive counterargument."],
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

  // ================= XYZ - Matematisk problemlösning =================
  {
    subtest: "XYZ", concept: "proportionalitet", difficulty: 1000,
    stem: "Ett recept för 4 personer kräver 300 g mjöl. Hur mycket mjöl behövs för 10 personer?",
    options: ["600 g", "750 g", "900 g", "1000 g"],
    correctIndex: 1,
    explanationShort: "300/4 = 75 g per person, × 10 = 750 g.",
    explanationSteps: ["Mjöl per person: 300 g ÷ 4 = 75 g.", "För 10 personer: 75 g × 10 = 750 g."],
    hint1: "Räkna ut hur mycket mjöl som behövs per person först.",
  },
  {
    subtest: "XYZ", concept: "procent", difficulty: 1050,
    stem: "En vara kostar 640 kr efter en rabatt på 20 %. Vad var ursprungspriset?",
    options: ["768 kr", "780 kr", "800 kr", "820 kr"],
    correctIndex: 2,
    explanationShort: "640 kr motsvarar 80 % av ursprungspriset, alltså 640/0,8 = 800 kr.",
    explanationSteps: ["Efter 20% rabatt återstår 80% av priset.", "80% × pris = 640 kr.", "Pris = 640 / 0,8 = 800 kr."],
    hint1: "640 kr är 80 % av det ursprungliga priset.",
  },
  {
    subtest: "XYZ", concept: "algebra", difficulty: 1150,
    stem: "Om 3x - 7 = 2x + 5, vad är värdet av x?",
    options: ["8", "10", "12", "14"],
    correctIndex: 2,
    explanationShort: "3x - 2x = 5 + 7 → x = 12.",
    explanationSteps: ["Flytta x-termer till vänster: 3x - 2x = 5 + 7.", "x = 12."],
  },
  {
    subtest: "XYZ", concept: "geometri", difficulty: 1100,
    stem: "En triangel har basen 12 cm och höjden 5 cm. Vad är arean?",
    options: ["17 cm²", "30 cm²", "60 cm²", "70 cm²"],
    correctIndex: 1,
    explanationShort: "Triangelns area = (bas × höjd) / 2 = (12 × 5) / 2 = 30 cm².",
    explanationSteps: ["Formeln för triangelns area: (bas × höjd) / 2.", "(12 × 5) / 2 = 60 / 2 = 30 cm²."],
  },
  {
    subtest: "XYZ", concept: "sannolikhet-statistik", difficulty: 1050,
    stem: "En påse innehåller 4 röda och 6 blå kulor. Vad är sannolikheten att dra en röd kula?",
    options: ["0,2", "0,3", "0,4", "0,6"],
    correctIndex: 2,
    explanationShort: "4 röda av totalt 10 kulor ger sannolikheten 4/10 = 0,4.",
    explanationSteps: ["Totalt antal kulor: 4 + 6 = 10.", "Sannolikhet = gynnsamma / totala = 4/10 = 0,4."],
  },
  {
    subtest: "XYZ", concept: "proportionalitet", difficulty: 900,
    stem: "En bil kör 210 km på 3 timmar med jämn hastighet. Hur långt kör den på 5 timmar?",
    options: ["300 km", "330 km", "350 km", "400 km"],
    correctIndex: 2,
    explanationShort: "210/3 = 70 km/h, × 5 = 350 km.",
    explanationSteps: ["Hastighet: 210 km ÷ 3 h = 70 km/h.", "På 5 timmar: 70 × 5 = 350 km."],
  },
  {
    subtest: "XYZ", concept: "procent", difficulty: 950,
    stem: "En lön höjs från 28 000 kr till 30 800 kr. Hur stor är löneökningen i procent?",
    options: ["8 %", "9 %", "10 %", "12 %"],
    correctIndex: 2,
    explanationShort: "Ökningen är 2 800 kr, vilket är 10 % av 28 000 kr.",
    explanationSteps: ["Ökning i kronor: 30 800 - 28 000 = 2 800 kr.", "Procentuell ökning: 2 800 / 28 000 = 0,10 = 10 %."],
  },
  {
    subtest: "XYZ", concept: "algebra", difficulty: 1200,
    stem: "Två tal har summan 40 och differensen 8. Vad är det största talet?",
    options: ["16", "20", "24", "28"],
    correctIndex: 2,
    explanationShort: "Talen är 24 och 16 (24+16=40, 24-16=8).",
    explanationSteps: ["Sätt talen x och y: x + y = 40, x - y = 8.", "Addera ekvationerna: 2x = 48 → x = 24.", "Det största talet är alltså 24."],
  },
  {
    subtest: "XYZ", concept: "geometri", difficulty: 1000,
    stem: "En kub har volymen 27 cm³. Hur lång är kubens sida?",
    options: ["2 cm", "3 cm", "4 cm", "9 cm"],
    correctIndex: 1,
    explanationShort: "Kubroten ur 27 är 3, eftersom 3³ = 27.",
    explanationSteps: ["Volym = sida³.", "sida³ = 27 → sida = ∛27 = 3 cm."],
  },
  {
    subtest: "XYZ", concept: "sannolikhet-statistik", difficulty: 1150,
    stem: "Medelvärdet av fem tal är 12. Om ett sjätte tal, 24, läggs till, vad blir det nya medelvärdet?",
    options: ["13", "14", "15", "16"],
    correctIndex: 1,
    explanationShort: "Summan av de fem talen är 60, plus 24 blir 84, delat på 6 blir 14.",
    explanationSteps: ["Summan av de fem talen: 5 × 12 = 60.", "Ny summa: 60 + 24 = 84.", "Nytt medelvärde: 84 / 6 = 14."],
  },
  {
    subtest: "XYZ", concept: "proportionalitet", difficulty: 950,
    stem: "Ett tåg färdas 240 km på 2,5 timmar. Vad är tågets medelhastighet?",
    options: ["86 km/h", "96 km/h", "106 km/h", "116 km/h"],
    correctIndex: 1,
    explanationShort: "240 km / 2,5 h = 96 km/h.",
    explanationSteps: ["Medelhastighet = sträcka / tid.", "240 / 2,5 = 96 km/h."],
  },
  {
    subtest: "XYZ", concept: "procent", difficulty: 1000,
    stem: "En vara som kostade 450 kr säljs nu för 360 kr. Hur stor är prissänkningen i procent?",
    options: ["15 %", "18 %", "20 %", "25 %"],
    correctIndex: 2,
    explanationShort: "Sänkningen är 90 kr, vilket är 20 % av 450 kr.",
    explanationSteps: ["Sänkning i kronor: 450 - 360 = 90 kr.", "Procentuell sänkning: 90 / 450 = 0,20 = 20 %."],
  },
  {
    subtest: "XYZ", concept: "algebra", difficulty: 1000,
    stem: "Lös ekvationen: 5x + 8 = 2x + 26",
    options: ["4", "5", "6", "8"],
    correctIndex: 2,
    explanationShort: "5x - 2x = 26 - 8 → 3x = 18 → x = 6.",
    explanationSteps: ["Flytta x-termer till vänster: 5x - 2x = 26 - 8.", "3x = 18 → x = 6."],
  },
  {
    subtest: "XYZ", concept: "geometri", difficulty: 1050,
    stem: "En cirkel har diametern 14 cm. Vad är cirkelns omkrets (använd π ≈ 3,14)?",
    options: ["22 cm", "28 cm", "44 cm", "88 cm"],
    correctIndex: 2,
    explanationShort: "Omkrets = π × diameter = 3,14 × 14 ≈ 44 cm.",
    explanationSteps: ["Formeln för omkrets: π × diameter.", "3,14 × 14 = 43,96 ≈ 44 cm."],
  },
  {
    subtest: "XYZ", concept: "sannolikhet-statistik", difficulty: 900,
    stem: "I en klass med 30 elever är 12 flickor. Om en elev slumpmässigt väljs, vad är sannolikheten att det är en pojke?",
    options: ["0,4", "0,5", "0,6", "0,7"],
    correctIndex: 2,
    explanationShort: "Det finns 18 pojkar av 30 elever: 18/30 = 0,6.",
    explanationSteps: ["Antal pojkar: 30 - 12 = 18.", "Sannolikhet = 18 / 30 = 0,6."],
  },
  {
    subtest: "XYZ", concept: "procent", difficulty: 1000,
    stem: "Ett företag ökar sin personalstyrka från 40 till 52 anställda. Hur stor är den procentuella ökningen?",
    options: ["20 %", "25 %", "30 %", "35 %"],
    correctIndex: 2,
    explanationShort: "Ökningen är 12 anställda, vilket är 30 % av 40.",
    explanationSteps: ["Ökning: 52 - 40 = 12.", "Procentuell ökning: 12 / 40 = 0,30 = 30 %."],
  },
  {
    subtest: "XYZ", concept: "proportionalitet", difficulty: 1050,
    stem: "Två tal förhåller sig som 3:5. Om det mindre talet är 18, vad är det större talet?",
    options: ["24", "27", "30", "33"],
    correctIndex: 2,
    explanationShort: "3 delar motsvarar 18, så 1 del är 6 och 5 delar blir 30.",
    explanationSteps: ["3 delar = 18 → 1 del = 6.", "Det större talet: 5 delar = 5 × 6 = 30."],
  },
  {
    subtest: "XYZ", concept: "geometri", difficulty: 1100,
    stem: "Volymen av ett rätblock är 240 cm³. Basen är 8 cm × 6 cm. Hur hög är rätblocket?",
    options: ["4 cm", "5 cm", "6 cm", "8 cm"],
    correctIndex: 1,
    explanationShort: "Höjd = volym / basarea = 240 / 48 = 5 cm.",
    explanationSteps: ["Basarea: 8 × 6 = 48 cm².", "Höjd: 240 / 48 = 5 cm."],
  },
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

  // ================= KVA - Kvantitativa jämförelser =================
  {
    subtest: "KVA", concept: "procent", difficulty: 950,
    stem: "Kvantitet I: 30 % av 80\nKvantitet II: 40 % av 60",
    options: COMPARISON_OPTIONS,
    correctIndex: 2,
    explanationShort: "Båda uttrycken blir 24, så kvantiteterna är lika.",
    explanationSteps: ["Kvantitet I: 0,30 × 80 = 24.", "Kvantitet II: 0,40 × 60 = 24.", "24 = 24, så kvantiteterna är lika."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1100,
    stem: "x + y = 10, x > y > 0\nKvantitet I: x\nKvantitet II: 5",
    options: COMPARISON_OPTIONS,
    correctIndex: 0,
    explanationShort: "Om x > y och x + y = 10 måste x vara större än hälften, alltså större än 5.",
    explanationSteps: ["Om x = y hade båda varit 5.", "Eftersom x > y måste x dra mer än hälften av summan 10.", "Alltså x > 5, vilket gör Kvantitet I större."],
  },
  {
    subtest: "KVA", concept: "geometri", difficulty: 1200,
    stem: "En rektangel har omkrets 20 cm.\nKvantitet I: Rektangelns area om sidorna är 4 och 6\nKvantitet II: Arean av en kvadrat med samma omkrets",
    options: COMPARISON_OPTIONS,
    correctIndex: 1,
    explanationShort: "Kvadraten ger alltid störst area vid given omkrets.",
    explanationSteps: ["Rektangel 4×6: omkrets 20, area = 24.", "Kvadrat med omkrets 20: sida 5, area = 25.", "25 > 24, så Kvantitet II är större."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1000,
    stem: "a = 3, b = -2\nKvantitet I: a² + b²\nKvantitet II: (a + b)²",
    options: COMPARISON_OPTIONS,
    correctIndex: 0,
    explanationShort: "a²+b² = 13 medan (a+b)² = 1, så Kvantitet I är större.",
    explanationSteps: ["a² + b² = 9 + 4 = 13.", "(a + b)² = (3 + (-2))² = 1² = 1.", "13 > 1, alltså är Kvantitet I större."],
  },
  {
    subtest: "KVA", concept: "procent", difficulty: 1150,
    stem: "Ett pris höjs med 20 % och sänks sedan med 20 %.\nKvantitet I: Slutpriset\nKvantitet II: Ursprungspriset",
    options: COMPARISON_OPTIONS,
    correctIndex: 1,
    explanationShort: "En höjning med 20% följt av sänkning med 20% ger alltid ett lägre slutpris än ursprunget.",
    explanationSteps: ["Utgå från pris 100: efter +20% blir det 120.", "Efter -20% på 120 blir det 120 × 0,8 = 96.", "96 < 100, så ursprungspriset (Kvantitet II) är större."],
  },
  {
    subtest: "KVA", concept: "geometri", difficulty: 1050,
    stem: "En cirkel har radie 5.\nKvantitet I: Cirkelns omkrets\nKvantitet II: Cirkelns area / 3",
    options: COMPARISON_OPTIONS,
    correctIndex: 0,
    explanationShort: "Omkretsen (10π) är alltid större än area/3 (25π/3), oavsett π:s exakta värde.",
    explanationSteps: ["Omkrets = 2πr = 10π.", "Area/3 = πr²/3 = 25π/3.", "10π jämfört med 25π/3 motsvarar 30π jämfört med 25π (multiplicera båda med 3) - och 30 > 25 gäller alltid, så Kvantitet I är större."],
  },
  {
    subtest: "KVA", concept: "procent", difficulty: 900,
    stem: "Kvantitet I: 15 % av 200\nKvantitet II: 200 % av 15",
    options: COMPARISON_OPTIONS,
    correctIndex: 2,
    explanationShort: "Båda blir 30, kvantiteterna är lika.",
    explanationSteps: ["15% av 200 = 0,15 × 200 = 30.", "200% av 15 = 2 × 15 = 30.", "Lika stora."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1050,
    stem: "x² = 16\nKvantitet I: x\nKvantitet II: 4",
    options: COMPARISON_OPTIONS,
    correctIndex: 3,
    explanationShort: "x kan vara både 4 och -4, så det går inte att avgöra.",
    explanationSteps: ["x² = 16 ger x = 4 eller x = -4.", "Om x = 4 är kvantiteterna lika, om x = -4 är Kvantitet II större.", "Eftersom svaret varierar går det inte att avgöra."],
  },
  {
    subtest: "KVA", concept: "procent", difficulty: 950,
    stem: "Kvantitet I: 25 % av 160\nKvantitet II: 40 % av 100",
    options: COMPARISON_OPTIONS,
    correctIndex: 2,
    explanationShort: "Båda uttrycken blir 40, så kvantiteterna är lika.",
    explanationSteps: ["Kvantitet I: 0,25 × 160 = 40.", "Kvantitet II: 0,40 × 100 = 40.", "40 = 40, kvantiteterna är lika."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1150,
    stem: "x > 0\nKvantitet I: x²\nKvantitet II: x³",
    options: COMPARISON_OPTIONS,
    correctIndex: 3,
    explanationShort: "Förhållandet beror på om x är mindre eller större än 1, så det går inte att avgöra.",
    explanationSteps: ["Om x = 0,5: x² = 0,25 och x³ = 0,125 → Kvantitet I störst.", "Om x = 2: x² = 4 och x³ = 8 → Kvantitet II störst.", "Eftersom svaret beror på x går det inte att avgöra."],
  },
  {
    subtest: "KVA", concept: "geometri", difficulty: 1100,
    stem: "En rektangel har längden dubbelt så stor som bredden. Omkretsen är 30.\nKvantitet I: Bredden\nKvantitet II: 6",
    options: COMPARISON_OPTIONS,
    correctIndex: 1,
    explanationShort: "Bredden är 5, vilket är mindre än 6.",
    explanationSteps: ["Låt bredden vara b, längden 2b.", "Omkrets: 2(b + 2b) = 6b = 30 → b = 5.", "5 < 6, så Kvantitet II är större."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1000,
    stem: "Kvantitet I: Minsta gemensamma nämnaren för 1/4 och 1/6\nKvantitet II: 10",
    options: COMPARISON_OPTIONS,
    correctIndex: 0,
    explanationShort: "Minsta gemensamma nämnaren är 12, vilket är större än 10.",
    explanationSteps: ["Nämnare 4 och 6: minsta gemensamma multipel är 12.", "12 > 10, så Kvantitet I är större."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 1150,
    stem: "a och b är positiva heltal där a + b = 10.\nKvantitet I: Största möjliga värde av a × b\nKvantitet II: 26",
    options: COMPARISON_OPTIONS,
    correctIndex: 1,
    explanationShort: "Maximala produkten är 25 (a=b=5), vilket är mindre än 26.",
    explanationSteps: ["Produkten a × b maximeras när talen ligger så nära varandra som möjligt.", "a = b = 5 ger a × b = 25.", "25 < 26, så Kvantitet II är större."],
  },
  {
    subtest: "KVA", concept: "algebra", difficulty: 950,
    stem: "Kvantitet I: 3⁴\nKvantitet II: 4³",
    options: COMPARISON_OPTIONS,
    correctIndex: 0,
    explanationShort: "3⁴ = 81 och 4³ = 64, så Kvantitet I är större.",
    explanationSteps: ["3⁴ = 3×3×3×3 = 81.", "4³ = 4×4×4 = 64.", "81 > 64."],
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
    subtest: "KVA", concept: "algebra", difficulty: 1200,
    stem: "Kvantitet I: 7/9\nKvantitet II: 11/13",
    options: COMPARISON_OPTIONS,
    correctIndex: 1,
    explanationShort: "Genom korsmultiplikation ser man att 11/13 är större än 7/9.",
    explanationSteps: ["Jämför genom korsmultiplikation: 7×13 = 91 och 11×9 = 99.", "Eftersom 99 > 91 är 11/13 > 7/9.", "Kvantitet II är större."],
  },

  // ================= NOG - Kvantitativa resonemang =================
  {
    subtest: "NOG", concept: "ekvationer", difficulty: 1100,
    stem:
      "Vad är värdet av x?\n(1) x + 5 = 12\n(2) 2x = 14",
    options: NOG_OPTIONS,
    correctIndex: 3,
    explanationShort: "Båda påståendena ger var för sig x = 7.",
    explanationSteps: ["(1): x + 5 = 12 → x = 7. Tillräckligt ensamt.", "(2): 2x = 14 → x = 7. Tillräckligt ensamt.", "Eftersom vardera räcker: svar D."],
  },
  {
    subtest: "NOG", concept: "geometri", difficulty: 1200,
    stem:
      "Är triangeln ABC en rätvinklig triangel?\n(1) Sidorna är 3, 4 och 5\n(2) Vinkel A är 60°",
    options: NOG_OPTIONS,
    correctIndex: 0,
    explanationShort: "Sidorna 3-4-5 uppfyller Pythagoras sats (rätvinklig), medan (2) ensamt inte avgör de andra vinklarna.",
    explanationSteps: ["(1): 3² + 4² = 5² → rätvinklig triangel bekräftad. Tillräckligt.", "(2): En vinkel på 60° säger inget om de andra två vinklarna. Otillräckligt.", "Endast (1) räcker: svar A."],
  },
  {
    subtest: "NOG", concept: "procent", difficulty: 1050,
    stem:
      "Hur stor var vinsten i procent av omsättningen?\n(1) Omsättningen var 500 000 kr\n(2) Vinsten var 50 000 kr",
    options: NOG_OPTIONS,
    correctIndex: 2,
    explanationShort: "Man behöver båda talen för att räkna ut procentandelen.",
    explanationSteps: ["(1) ensamt ger bara omsättning, ingen vinstsiffra. Otillräckligt.", "(2) ensamt ger bara vinst, ingen omsättning. Otillräckligt.", "Tillsammans: 50 000 / 500 000 = 10 %. Svar C."],
  },
  {
    subtest: "NOG", concept: "ekvationer", difficulty: 1250,
    stem: "Är x ett positivt tal?\n(1) x² = 25\n(2) x + 3 > 0",
    options: NOG_OPTIONS,
    correctIndex: 2,
    explanationShort: "Var för sig räcker varken (1) eller (2), men tillsammans utesluts x = -5 och endast x = 5 återstår.",
    explanationSteps: ["(1): x² = 25 ger x = 5 eller x = -5 - avgör inte tecken. Otillräckligt ensamt.", "(2): x + 3 > 0 ger x > -3, vilket tillåter både positiva tal och negativa tal som -1 eller -2. Otillräckligt ensamt.", "Tillsammans: x måste vara 5 eller -5 (från 1) OCH större än -3 (från 2). Endast x = 5 uppfyller båda, så x är positivt. Svar C."],
  },
  {
    subtest: "NOG", concept: "geometri", difficulty: 1150,
    stem:
      "Vad är arean av rektangeln?\n(1) Omkretsen är 24\n(2) Längden är dubbelt så stor som bredden",
    options: NOG_OPTIONS,
    correctIndex: 2,
    explanationShort: "Man behöver båda uppgifterna för att lösa ut både längd och bredd.",
    explanationSteps: ["(1) ensamt: oändligt många rektanglar kan ha omkrets 24. Otillräckligt.", "(2) ensamt: ger bara ett förhållande, ingen absolut storlek. Otillräckligt.", "Tillsammans: 2(l+b)=24 och l=2b → b=4, l=8, area=32. Svar C."],
  },
  {
    subtest: "NOG", concept: "procent", difficulty: 1300,
    stem: "Är A större än B?\n(1) A är 120 % av B\n(2) B är ett positivt tal",
    options: NOG_OPTIONS,
    correctIndex: 2,
    explanationShort: "(1) ensamt avgör inte tecknet på B, och (2) ensamt säger inget om A - men tillsammans räcker de.",
    explanationSteps: ["(1): A = 1,2B. Om B är negativt, t.ex. B=-10, blir A=-12, vilket är MINDRE än B. Otillräckligt ensamt eftersom B:s tecken är okänt.", "(2): B > 0 säger inget alls om A. Otillräckligt ensamt.", "Tillsammans: A = 1,2B med B > 0 ger alltid A > B (eftersom 0,2B > 0). Svar C."],
  },

  // ================= DTK - Diagram, tabeller och kartor =================
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 950,
    stem:
      "Tabellen visar antal sålda enheter per kvartal:\nQ1: 120 | Q2: 150 | Q3: 90 | Q4: 180\n\nHur många enheter såldes totalt under året?",
    options: ["500", "520", "540", "560"],
    correctIndex: 2,
    explanationShort: "120+150+90+180 = 540.",
    explanationSteps: ["Summera alla kvartal: 120 + 150 = 270.", "270 + 90 = 360.", "360 + 180 = 540."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1050,
    stem:
      "Ett stapeldiagram visar företagets kostnader fördelat på: Personal 45 %, Lokaler 25 %, Marknadsföring 20 %, Övrigt 10 %. Totala kostnader är 2 000 000 kr.\n\nHur mycket kostar lokaler?",
    options: ["400 000 kr", "450 000 kr", "500 000 kr", "550 000 kr"],
    correctIndex: 2,
    explanationShort: "25 % av 2 000 000 kr = 500 000 kr.",
    explanationSteps: ["Lokaler = 25 % av totalen.", "0,25 × 2 000 000 = 500 000 kr."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1100,
    stem:
      "Tabellen visar medeltemperatur (°C) per månad:\nJan: -3 | Feb: -2 | Mar: 2 | Apr: 7\n\nVad var den genomsnittliga temperaturökningen per månad mellan januari och april?",
    options: ["2,5 °C", "3,0 °C", "3,3 °C", "3,5 °C"],
    correctIndex: 2,
    explanationShort: "Total ökning 10°C över 3 månadsintervall ger 10/3 ≈ 3,3°C per månad.",
    explanationSteps: ["Total förändring: 7 - (-3) = 10°C.", "Antal intervall mellan jan och apr: 3.", "Genomsnitt per månad: 10 / 3 ≈ 3,3°C."],
  },
  {
    subtest: "DTK", concept: "kartor-skala", difficulty: 1000,
    stem: "En karta har skalan 1:50 000. Avståndet mellan två städer på kartan är 8 cm. Vad är det verkliga avståndet?",
    options: ["2 km", "4 km", "40 km", "400 km"],
    correctIndex: 1,
    explanationShort: "8 cm × 50 000 = 400 000 cm = 4 km.",
    explanationSteps: ["Verkligt avstånd = kartavstånd × skalfaktor.", "8 cm × 50 000 = 400 000 cm.", "400 000 cm = 4 000 m = 4 km."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1150,
    stem:
      "Ett cirkeldiagram visar marknadsandelar: Företag A 35 %, B 30 %, C 20 %, D 15 %. Marknaden växer med 10 % nästa år, men andelarna förblir desamma.\n\nOm marknaden idag är värd 1 000 000 kr, hur mycket kommer Företag B:s andel vara värd nästa år?",
    options: ["300 000 kr", "310 000 kr", "330 000 kr", "350 000 kr"],
    correctIndex: 2,
    explanationShort: "Ny marknad = 1 100 000 kr, 30 % av det = 330 000 kr.",
    explanationSteps: ["Ny total marknad: 1 000 000 × 1,10 = 1 100 000 kr.", "Företag B:s andel: 30 % × 1 100 000 = 330 000 kr."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 900,
    stem:
      "Tabellen visar antal anställda per avdelning:\nIT: 24 | Sälj: 36 | Support: 18 | Ekonomi: 12\n\nHur stor andel av alla anställda jobbar inom Sälj?",
    options: ["30 %", "36 %", "40 %", "45 %"],
    correctIndex: 2,
    explanationShort: "Totalt 90 anställda, 36 inom Sälj = 40 %.",
    explanationSteps: ["Totalt: 24+36+18+12 = 90.", "Andel Sälj: 36/90 = 0,40 = 40 %."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 900,
    stem: "Tabellen visar antal kunder per butik:\nButik A: 340 | Butik B: 210 | Butik C: 275 | Butik D: 195\n\nHur många fler kunder har butik A än butik D?",
    options: ["125", "135", "145", "155"],
    correctIndex: 2,
    explanationShort: "340 - 195 = 145.",
    explanationSteps: ["Skillnad: 340 - 195 = 145."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 1000,
    stem:
      "Ett cirkeldiagram visar en hushållsbudget: Boende 35 %, Mat 20 %, Transport 15 %, Nöje 10 %, Sparande 20 %. Månadsinkomsten är 32 000 kr.\n\nHur mycket läggs på sparande?",
    options: ["5 400 kr", "6 000 kr", "6 400 kr", "7 000 kr"],
    correctIndex: 2,
    explanationShort: "20 % av 32 000 kr = 6 400 kr.",
    explanationSteps: ["Sparande = 20 % av 32 000.", "0,20 × 32 000 = 6 400 kr."],
  },
  {
    subtest: "DTK", concept: "kartor-skala", difficulty: 1000,
    stem: "En karta har skalan 1:25 000. Två punkter ligger 6 cm ifrån varandra på kartan.\nVad är det verkliga avståndet?",
    options: ["0,75 km", "1,5 km", "2,5 km", "15 km"],
    correctIndex: 1,
    explanationShort: "6 cm × 25 000 = 150 000 cm = 1,5 km.",
    explanationSteps: ["Verkligt avstånd = kartavstånd × skalfaktor.", "6 × 25 000 = 150 000 cm = 1 500 m = 1,5 km."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1100,
    stem:
      "Tabellen visar en akties stängningskurs (kr) under en vecka:\nMån: 120 | Tis: 126 | Ons: 118 | Tors: 130 | Fre: 136\n\nVad var den största enskilda dagsförändringen (i kronor, mellan två på varandra följande dagar)?",
    options: ["6 kr", "8 kr", "10 kr", "12 kr"],
    correctIndex: 3,
    explanationShort: "Störst förändring var mellan onsdag och torsdag: 130 - 118 = 12 kr.",
    explanationSteps: ["Mån→Tis: +6. Tis→Ons: -8. Ons→Tors: +12. Tors→Fre: +6.", "Störst förändring (absolut) är 12 kr."],
  },
  {
    subtest: "DTK", concept: "diagramtolkning", difficulty: 950,
    stem: "Ett stapeldiagram visar regnmängd (mm) per månad: Jan 40, Feb 35, Mar 50, Apr 45.\nVad var den genomsnittliga regnmängden dessa fyra månader?",
    options: ["40 mm", "42,5 mm", "45 mm", "47,5 mm"],
    correctIndex: 1,
    explanationShort: "(40+35+50+45)/4 = 170/4 = 42,5 mm.",
    explanationSteps: ["Summa: 40 + 35 + 50 + 45 = 170.", "Genomsnitt: 170 / 4 = 42,5 mm."],
  },
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1000,
    stem: "Tabellen visar exportvärde (miljoner kr) för tre år:\n2021: 800 | 2022: 920 | 2023: 1 012\n\nHur stor var den procentuella ökningen från 2022 till 2023?",
    options: ["8 %", "9 %", "10 %", "12 %"],
    correctIndex: 2,
    explanationShort: "(1012-920)/920 = 92/920 = 0,10 = 10 %.",
    explanationSteps: ["Ökning: 1012 - 920 = 92 miljoner kr.", "Procentuell ökning: 92 / 920 = 0,10 = 10 %."],
  },
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
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1250,
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

  // ================= SVÅRARE NIVÅ (autentisk högskoleprovs-svårighetsgrad) =================

  // ---------------- ORD (svår nivå) ----------------
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

  // ---------------- LÄS (svår nivå) ----------------
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

  // ---------------- MEK (svår nivå) ----------------
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1450,
    stem: "Trots att experterna var ___ oense om orsaken, var de förvånansvärt eniga i sin bedömning av vilka åtgärder som ___.",
    options: ["djupt / krävdes", "delvis / krävdes", "djupt / uteslöts", "ytligt / krävdes"],
    correctIndex: 0,
    explanationShort: "Kontrasten kräver att experterna var djupt oense om orsaken men ändå eniga om vilka åtgärder som krävdes.",
    explanationSteps: ["'Trots att X, förvånansvärt Y' bygger på en tydlig kontrast.", "Djup oenighet om orsak men enighet om vilka åtgärder som krävdes ger den starkaste, mest logiska kontrasten."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1350,
    stem: "Ju mer komplex lagstiftningen blev, desto ___ blev det för småföretag att navigera den utan att anlita ___ hjälp.",
    options: ["enklare / extern", "svårare / extern", "svårare / egen", "enklare / egen"],
    correctIndex: 1,
    explanationShort: "Mer komplex lagstiftning gör det rimligen svårare, och kräver då extern (inhyrd) hjälp.",
    explanationSteps: ["'Ju mer X, desto Y' kräver en logisk, positiv koppling.", "Mer komplexitet → svårare att klara själv → behov av extern hjälp."],
  },
  {
    subtest: "MEK", concept: "ordval-nyans", difficulty: 1400,
    stem: "Fastän lösningen var ___ ur ett tekniskt perspektiv, visade den sig vara ___ att implementera i praktiken på grund av organisatoriskt motstånd.",
    options: ["elegant / enkel", "elegant / svår", "klumpig / svår", "klumpig / enkel"],
    correctIndex: 1,
    explanationShort: "Kontrasten 'fastän...men' kräver att en tekniskt elegant lösning ändå blev svår att genomföra.",
    explanationSteps: ["'Fastän X, ändå Y' signalerar motsättning.", "Tekniskt elegant men svår att implementera pga organisatoriskt motstånd ger en tydlig, sammanhängande kontrast."],
  },
  {
    subtest: "MEK", concept: "sammanhang-logik", difficulty: 1300,
    stem: "Eftersom underlaget var ___ ofullständigt, kunde kommittén inte annat än att ___ sitt beslut till nästa möte.",
    options: ["endast / fastställa", "grovt / skjuta upp", "grovt / fastställa", "endast / skjuta upp"],
    correctIndex: 1,
    explanationShort: "Grovt ofullständigt underlag förklarar varför beslutet sköts upp, inte fastställdes.",
    explanationSteps: ["Ett grovt ofullständigt underlag gör det logiskt omöjligt att fastställa ett beslut.", "Den enda konsekventa följden är att kommittén sköt upp beslutet."],
  },
  {
    subtest: "MEK", concept: "ordval-nyans", difficulty: 1400,
    stem: "Marknaden reagerade ___ på beskedet, vilket tvingade analytiker att snabbt ___ sina tidigare prognoser.",
    options: ["oväntat kraftigt / ompröva", "som väntat / bekräfta", "oväntat kraftigt / bekräfta", "som väntat / ompröva"],
    correctIndex: 0,
    explanationShort: "Att analytiker 'tvingades snabbt' agera visar att reaktionen var oväntad, vilket kräver omprövning snarare än bekräftelse.",
    explanationSteps: ["Ordet 'tvingade...snabbt' signalerar brådska orsakad av något oväntat.", "En oväntat kraftig reaktion tvingar fram en omprövning av prognoserna, inte en bekräftelse av dem."],
  },

  // ---------------- ELF (svår nivå) ----------------
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

  // ---------------- NOG (svår nivå) ----------------
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
    subtest: "NOG", concept: "logik", difficulty: 1200,
    stem: "Tre syskon - Ada, Bo och Cleo - har olika antal husdjur. Vem har flest husdjur?\n(1) Ada har fler husdjur än Bo.\n(2) Cleo har färre husdjur än Bo.",
    options: NOG_OPTIONS,
    correctIndex: 2,
    explanationShort: "Man behöver båda relationerna för att rangordna alla tre syskonen.",
    explanationSteps: ["(1) ensamt: Ada > Bo, men säger inget om Cleo - Cleo skulle kunna ha flest. Otillräckligt.", "(2) ensamt: Cleo < Bo, men säger inget om Ada - Bo skulle kunna ha flest eller inte. Otillräckligt.", "Tillsammans: Ada > Bo > Cleo, så Ada har definitivt flest. Svar C."],
  },
  {
    subtest: "NOG", concept: "logik", difficulty: 1300,
    stem: "Fyra vänner - Elin, Filip, Greta och Hugo - står i kö efter varandra. Vem står först?\n(1) Filip står precis efter Elin.\n(2) Hugo står sist, och Greta står precis före Hugo.",
    options: NOG_OPTIONS,
    correctIndex: 2,
    explanationShort: "Man behöver båda uppgifterna för att placera alla fyra personer i kön.",
    explanationSteps: ["(1) ensamt: Elin och Filip står intill varandra i den ordningen, men positionen i kön är okänd. Otillräckligt.", "(2) ensamt: Placerar bara Greta (3:a) och Hugo (4:a) - ordningen mellan Elin och Filip på plats 1-2 är okänd. Otillräckligt.", "Tillsammans: Greta=3, Hugo=4, och eftersom Filip står precis efter Elin måste Elin=1, Filip=2. Svar C."],
  },
  {
    subtest: "NOG", concept: "logik", difficulty: 1250,
    stem: "I en tävling deltar tre lag: Röd, Blå och Grön. Ett lag vann, ett kom tvåa och ett kom trea. Vilket lag vann?\n(1) Röd kom inte sist.\n(2) Blå kom sist.",
    options: NOG_OPTIONS,
    correctIndex: 4,
    explanationShort: "Även tillsammans avgör påståendena inte om Röd eller Grön kom först.",
    explanationSteps: ["(1) ensamt: Röd är 1:a eller 2:a - avgör inte vem som vann. Otillräckligt.", "(2) ensamt: Blå kom sist (3:a) - säger inget om ordningen mellan Röd och Grön. Otillräckligt.", "Tillsammans: Blå=3:a, och Röd/Grön delar platserna 1-2 - men det går fortfarande inte att avgöra vilket av dem som vann. Svar E."],
  },

  // ---------------- DTK (svår nivå) ----------------
  {
    subtest: "DTK", concept: "tabellavläsning", difficulty: 1400,
    stem: "Tabellen visar ett företags kvartalsvisa vinst (miljoner kr):\nQ1: 12 | Q2: 15 | Q3: 9 | Q4: 18\n\nOm bolagsskatten är 22 % på årsvinsten, hur mycket betalar företaget i skatt för året?",
    options: ["10,88 miljoner kr", "11,88 miljoner kr", "12,88 miljoner kr", "13,88 miljoner kr"],
    correctIndex: 1,
    explanationShort: "Årsvinsten är 54 miljoner kr, och 22 % av det är 11,88 miljoner kr.",
    explanationSteps: ["Årsvinst: 12+15+9+18 = 54 miljoner kr.", "Skatt: 54 × 0,22 = 11,88 miljoner kr."],
  },
  {
    subtest: "DTK", concept: "kartor-skala", difficulty: 1400,
    stem: "En karta har skalan 1:50 000. Ett rektangulärt naturreservat mäter 4 cm × 3 cm på kartan.\n\nHur stor är reservatets verkliga area i kvadratkilometer?",
    options: ["1,5 km²", "2 km²", "3 km²", "6 km²"],
    correctIndex: 2,
    explanationShort: "Reservatet är i verkligheten 2 km × 1,5 km, vilket ger en area på 3 km².",
    explanationSteps: ["Längd: 4 cm × 50 000 = 200 000 cm = 2 km.", "Bredd: 3 cm × 50 000 = 150 000 cm = 1,5 km.", "Area: 2 × 1,5 = 3 km²."],
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

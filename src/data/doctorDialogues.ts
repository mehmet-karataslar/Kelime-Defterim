import { Article, WordType } from '../core/types';

export interface DialogueLine {
  speaker: 'Arzt' | 'Patient' | 'Praxis';
  de: string;
  tr: string;
}

export interface KeyVocab {
  german: string;
  article: Article | null;
  type: WordType;
  tr: string;
  note: string;
}

export interface DialogueQuiz {
  id: string;
  kind: 'comprehension' | 'grammar';
  question: string;
  options: string[];
  correctIndex: number;
  explanationTr: string;
}

export interface DoctorDialogue {
  id: string;
  title: string;
  titleTr: string;
  category: string;
  level: 'B2';
  summaryTr: string;
  lines: DialogueLine[];
  vocab: KeyVocab[];
  quizzes: DialogueQuiz[];
}

export const DOCTOR_DIALOGUES: DoctorDialogue[] = [
  {
    id: 'doc-1',
    title: 'Terminvereinbarung am Telefon',
    titleTr: 'Telefonda Randevu Alma',
    category: 'Randevu',
    level: 'B2',
    summaryTr: 'Şiddetli sırt ağrısı nedeniyle aile hekiminden acil randevu talep etme ve sigorta bilgilerini paylaşma.',
    lines: [
      { speaker: 'Praxis', de: 'Hausarztpraxis Dr. Weber, guten Tag. Wie kann ich Ihnen helfen?', tr: 'Dr. Weber Aile Hekimliği Muayenehanesi, iyi günler. Size nasıl yardımcı olabilirim?' },
      { speaker: 'Patient', de: 'Guten Tag, mein Name ist Karataş. Ich hätte gerne möglichst bald einen Termin, da ich seit drei Tagen starke Rückenschmerzen habe.', tr: 'İyi günler, adım Karataş. Üç gündür şiddetli sırt ağrım olduğu için mümkün olan en kısa sürede bir randevu almak istiyorum.' },
      { speaker: 'Praxis', de: 'Sind Sie bereits Patient bei uns und wie sind Sie versichert?', tr: 'Daha önce muayenehanemizde hastamız oldunuz mu ve sigorta türünüz nedir?' },
      { speaker: 'Patient', de: 'Ja, ich war letztes Jahr schon einmal da. Ich bin gesetzlich bei der AOK versichert.', tr: 'Evet, geçen yıl bir kez gelmiştim. AOK’da yasal (devlet) sağlık sigortam var.' },
      { speaker: 'Praxis', de: 'Da es sich um akute Beschwerden handelt, könnten Sie morgen früh um 8:15 Uhr in die Akutsprechstunde kommen.', tr: 'Akut şikâyetler söz konusu olduğu için yarın sabah saat 08:15’te acil muayene saatine gelebilirsiniz.' },
      { speaker: 'Patient', de: 'Das passt mir hervorragend. Soll ich meine elektronische Gesundheitskarte und den Medikamentenplan mitbringen?', tr: 'Bu bana harika uyar. Elektronik sağlık kartımı ve ilaç listemi yanımda getirmeli miyim?' },
      { speaker: 'Praxis', de: 'Ja, unbedingt. Bitte planen Sie etwas Wartezeit ein. Bis morgen!', tr: 'Evet, mutlaka. Lütfen biraz bekleme süresi de hesaplayın. Yarın görüşmek üzere!' },
    ],
    vocab: [
      { german: 'Akutsprechstunde', article: 'die', type: 'noun', tr: 'Acil muayene saati', note: 'Randevusuz veya kısa süreli akut şikâyetler için ayrılan saat.' },
      { german: 'Beschwerde', article: 'die', type: 'noun', tr: 'Şikâyet, rahatsızlık', note: 'Tıpta çoğunlukla çoğul kullanılır: die Beschwerden.' },
      { german: 'gesetzlich versichert', article: null, type: 'phrase', tr: 'Devlet sağlık sigortalı', note: 'AOK, TK, Barmer gibi GKV sigortaları için kullanılır.' },
      { german: 'einplanen', article: null, type: 'verb', tr: 'Hesaba katmak, planlamak', note: 'Ayrılabilir fiil: er plant ein / hat eingeplant.' },
    ],
    quizzes: [
      {
        id: 'doc-1-q1',
        kind: 'comprehension',
        question: 'Hasta neden yarın sabah erken saate randevu alabildi?',
        options: [
          'Özel sigortalı olduğu için',
          'Akut ve şiddetli şikâyetleri olduğu için',
          'Doktorun arkadaşı olduğu için',
          'Sadece reçete yazdırmak istediği için',
        ],
        correctIndex: 1,
        explanationTr: 'Sekreter "Da es sich um akute Beschwerden handelt..." diyerek akut şikâyetler nedeniyle acil muayene saatine kabul etti.',
      },
      {
        id: 'doc-1-q2',
        kind: 'grammar',
        question: '"Ich ___ gerne möglichst bald einen Termin." — Nazik talep için Konjunktiv II hangisidir?',
        options: ['habe', 'hatte', 'hätte', 'bin'],
        correctIndex: 2,
        explanationTr: 'Resmî ve nazik isteklerde "haben" fiilinin Konjunktiv II biçimi olan "hätte gerne" kullanılır.',
      },
    ],
  },
  {
    id: 'doc-2',
    title: 'Beschwerden und Symptome schildern',
    titleTr: 'Şikâyetleri ve Belirtileri Tarif Etme',
    category: 'Şikâyet & Belirti',
    level: 'B2',
    summaryTr: 'Ağrının yerini, şiddetini, süresini ve eşlik eden belirtileri doktora B2 düzeyinde net biçimde anlatma.',
    lines: [
      { speaker: 'Arzt', de: 'Guten Tag, Herr Karataş. Was führt Sie heute zu mir?', tr: 'İyi günler Bay Karataş. Bugün sizi bana getiren nedir?' },
      { speaker: 'Patient', de: 'Seit Montag habe ich einen stechenden Schmerz im unteren Rücken, der manchmal bis ins rechte Bein ausstrahlt.', tr: 'Pazartesiden beri alt sırtımda, bazen sağ bacağıma kadar yayılan batıcı bir ağrı var.' },
      { speaker: 'Arzt', de: 'Gab es einen konkreten Auslöser, zum Beispiel schweres Heben bei der Arbeit?', tr: 'Belirli bir tetikleyici oldu mu, örneğin işte ağır kaldırmak gibi?' },
      { speaker: 'Patient', de: 'Ja, wir haben auf der Baustelle einen schweren Wärmepumpenspeicher getragen. Danach konnte ich mich kaum noch bücken.', tr: 'Evet, şantiyede ağır bir ısı pompası deposu taşıdık. Ondan sonra neredeyse hiç eğilemedim.' },
      { speaker: 'Arzt', de: 'Haben Sie zusätzlich Taubheitsgefühle, Kribbeln oder Fieber bemerkt?', tr: 'Ek olarak uyuşma, karıncalanma veya ateş fark ettiniz mi?' },
      { speaker: 'Patient', de: 'Fieber habe ich nicht, aber abends spüre ich ein leichtes Ziehen, vor allem wenn ich lange sitze.', tr: 'Ateşim yok ama akşamları özellikle uzun süre oturduğumda hafif bir çekilme hissediyorum.' },
    ],
    vocab: [
      { german: 'ausstrahlen', article: null, type: 'verb', tr: 'Yayılmak (ağrı)', note: 'Tıpta ağrının başka bölgeye vurması: in das Bein ausstrahlen.' },
      { german: 'Auslöser', article: 'der', type: 'noun', tr: 'Tetikleyici, sebep', note: 'Plural: die Auslöser.' },
      { german: 'Taubheitsgefühl', article: 'das', type: 'noun', tr: 'Uyuşma hissi', note: 'Sinir sıkışması belirtilerini tarif ederken önemli B2 terimi.' },
      { german: 'bücken', article: null, type: 'verb', tr: 'Eğilmek', note: 'Dönüşlü fiil: sich bücken (er bückt sich / hat sich gebückt).' },
    ],
    quizzes: [
      {
        id: 'doc-2-q1',
        kind: 'comprehension',
        question: 'Ağrının olası tetikleyicisi nedir?',
        options: [
          'Uzun süreli soğuk algınlığı',
          'Şantiyede ağır bir depo taşımak',
          'Yanlış ilaç kullanımı',
          'Spor salonunda koşmak',
        ],
        correctIndex: 1,
        explanationTr: 'Hasta şantiyede ağır bir ısı pompası deposu taşıdıktan sonra ağrının başladığını belirtiyor.',
      },
      {
        id: 'doc-2-q2',
        kind: 'grammar',
        question: '"...einen stechenden Schmerz, ___ bis ins Bein ausstrahlt." — Doğru ilgi zamiri (Relativpronomen) hangisidir?',
        options: ['die', 'das', 'der', 'den'],
        correctIndex: 2,
        explanationTr: '"der Schmerz" maskulindir ve yan cümlede özne (Nominativ) görevinde olduğu için "der" kullanılır.',
      },
    ],
  },
  {
    id: 'doc-3',
    title: 'Körperliche Untersuchung',
    titleTr: 'Fiziksel Muayene',
    category: 'Muayene',
    level: 'B2',
    summaryTr: 'Muayene sırasında doktorun yönergelerini anlama, solunum/refleks kontrolü ve ağrı tepkisini ifade etme.',
    lines: [
      { speaker: 'Arzt', de: 'Bitte machen Sie den Oberkörper frei und setzen Sie sich auf die Untersuchungsliege.', tr: 'Lütfen üstünüzü çıkarın ve muayene sedyesine oturun.' },
      { speaker: 'Patient', de: 'In Ordnung. Soll ich die Beine hängen lassen?', tr: 'Tamam. Bacaklarımı aşağı sarkıtayım mı?' },
      { speaker: 'Arzt', de: 'Ja, genau. Ich taste jetzt vorsichtig Ihre Wirbelsäule ab. Sagen Sie sofort Bescheid, wenn es wehtut.', tr: 'Evet, aynen öyle. Şimdi omurganızı dikkatlice elle muayene edeceğim. Acıdığında hemen haber verin.' },
      { speaker: 'Patient', de: 'Au! Genau dort unten links ist es sehr druckempfindlich.', tr: 'Ah! Tam orada, sol alt tarafta basınca karşı çok hassas.' },
      { speaker: 'Arzt', de: 'Gut, jetzt überprüfen wir noch Ihre Reflexe und ich höre kurz Lunge und Herz ab. Bitte atmen Sie tief ein und langsam wieder aus.', tr: 'Güzel, şimdi reflekslerinizi de kontrol edelim ve kısaca akciğer ile kalbinizi dinleyeyim. Lütfen derin nefes alın ve yavaşça verin.' },
      { speaker: 'Patient', de: 'Alles klar. Ist ansonsten alles unauffällig?', tr: 'Anlaşıldı. Onun dışında her şey normal mi?' },
    ],
    vocab: [
      { german: 'abtasten', article: null, type: 'verb', tr: 'Elle muayene etmek (palpasyon)', note: 'Ayrılabilir fiil: er tastet ab / hat abgetastet.' },
      { german: 'abhören', article: null, type: 'verb', tr: 'Stetoskopla dinlemek', note: 'Lunge und Herz abhören.' },
      { german: 'Wirbelsäule', article: 'die', type: 'noun', tr: 'Omurga', note: 'Plural: die Wirbelsäulen.' },
      { german: 'druckempfindlich', article: null, type: 'adjective', tr: 'Basınca hassas', note: 'Muayenede dokununca ağrıyan bölgeler için kullanılır.' },
    ],
    quizzes: [
      {
        id: 'doc-3-q1',
        kind: 'comprehension',
        question: 'Doktor muayenede sırasıyla neleri kontrol ediyor?',
        options: [
          'Yalnızca tansiyon ve ateş',
          'Omurga palpasyonu, refleksler, akciğer ve kalp dinleme',
          'Göz ve kulak muayenesi',
          'Kan tahlili ve ultrason',
        ],
        correctIndex: 1,
        explanationTr: 'Doktor önce omurgayı elle muayene ediyor, ardından refleksleri ve akciğer/kalbi kontrol ediyor.',
      },
      {
        id: 'doc-3-q2',
        kind: 'grammar',
        question: '"Bitte atmen Sie tief ___ und langsam wieder ___." — Doğru ayrılabilir ön ekler hangileridir?',
        options: ['auf / zu', 'ein / aus', 'an / ab', 'mit / weg'],
        correctIndex: 1,
        explanationTr: 'Nefes almak "einatmen", nefes vermek "ausatmen" fiilleriyle ifade edilir.',
      },
    ],
  },
  {
    id: 'doc-4',
    title: 'Diagnose und Befundbesprechung',
    titleTr: 'Teşhis ve Tahlil Sonucu Görüşmesi',
    category: 'Teşhis',
    level: 'B2',
    summaryTr: 'Doktorun teşhisini, kan/MR sonuçlarını ve hastalığın seyrini B2 tıbbi ifadelerle anlama.',
    lines: [
      { speaker: 'Arzt', de: 'Die Untersuchung und Ihre Laborwerte liegen mir jetzt vor. Zum Glück gibt es keinen Hinweis auf einen Bandscheibenvorfall.', tr: 'Muayene ve laboratuvar değerleriniz şu an önümde. Neyse ki bel fıtığına dair bir bulgu yok.' },
      { speaker: 'Patient', de: 'Da bin ich wirklich erleichtert! Woran liegen die Schmerzen dann genau?', tr: 'Buna gerçekten rahatladım! Peki ağrıların tam sebebi nedir?' },
      { speaker: 'Arzt', de: 'Es handelt sich um eine akute Muskelverspannung im Lendenbereich, ausgelöst durch die Fehlbelastung.', tr: 'Yanlış yüklenmenin tetiklediği, bel bölgesinde akut bir kas spazmı/gerginliği söz konusu.' },
      { speaker: 'Patient', de: 'Wie lange dauert es erfahrungsgemäß, bis die Beschwerden vollständig abklingen?', tr: 'Deneyimlerinize göre şikâyetlerin tamamen geçmesi ne kadar sürer?' },
      { speaker: 'Arzt', de: 'Mit gezielter Behandlung und Schonung sollte es Ihnen innerhalb von zehn bis vierzehn Tagen deutlich besser gehen.', tr: 'Hedefe yönelik tedavi ve dinlenmeyle on ila on dört gün içinde belirgin biçimde daha iyi olmalısınız.' },
    ],
    vocab: [
      { german: 'Befund', article: 'der', type: 'noun', tr: 'Tıbbi bulgu, sonuç', note: 'Plural: die Befunde.' },
      { german: 'Bandscheibenvorfall', article: 'der', type: 'noun', tr: 'Bel/boyun fıtığı', note: 'Plural: die Bandscheibenvorfälle.' },
      { german: 'Muskelverspannung', article: 'die', type: 'noun', tr: 'Kas gerginliği / spazmı', note: 'Plural: die Muskelverspannungen.' },
      { german: 'abklingen', article: null, type: 'verb', tr: 'Hafiflemek, geçmek (belirti)', note: 'Düzensiz fiil: klingt ab / klang ab / ist abgeklungen.' },
    ],
    quizzes: [
      {
        id: 'doc-4-q1',
        kind: 'comprehension',
        question: 'Doktorun koyduğu kesin teşhis nedir?',
        options: [
          'Ağır bel fıtığı',
          'Bel bölgesinde akut kas gerginliği',
          'Böbrek enfeksiyonu',
          'Eklem kırığı',
        ],
        correctIndex: 1,
        explanationTr: 'Doktor bel fıtığı olmadığını, yanlış yüklenmeye bağlı akut kas gerginliği (Muskelverspannung) olduğunu söylüyor.',
      },
      {
        id: 'doc-4-q2',
        kind: 'grammar',
        question: '"___ liegen die Schmerzen genau?" — Edatlı soru zamiri (Pronominaladverb) hangisidir?',
        options: ['Warum', 'Woran', 'Wofür', 'Womit'],
        correctIndex: 1,
        explanationTr: '"liegen an + Dativ" (-den kaynaklanmak) fiilinin soru zamiri "Woran?" biçimindedir.',
      },
    ],
  },
  {
    id: 'doc-5',
    title: 'Medikamenteneinnahme und Nebenwirkungen',
    titleTr: 'İlaç Kullanımı ve Yan Etkiler',
    category: 'İlaç & Tedavi',
    level: 'B2',
    summaryTr: 'Reçete, dozaj, aç/tok karnına kullanım, yan etkiler ve başka ilaçlarla etkileşim hakkında soru sorma.',
    lines: [
      { speaker: 'Arzt', de: 'Ich verschreibe Ihnen ein entzündungshemmendes Schmerzmittel sowie sechs Sitzungen Physiotherapie.', tr: 'Size iltihap giderici bir ağrı kesici ve altı seans fizyoterapi yazıyorum.' },
      { speaker: 'Patient', de: 'Wie genau soll ich die Tabletten einnehmen — vor oder nach dem Essen?', tr: 'Tabletleri tam olarak nasıl almalıyım — yemekten önce mi yoksa sonra mı?' },
      { speaker: 'Arzt', de: 'Nehmen Sie morgens und abends jeweils eine Tablette nach einer Mahlzeit mit ausreichend Wasser ein, damit der Magen geschont wird.', tr: 'Midenin korunması için sabah ve akşam birer tableti yemekten sonra bol suyla alın.' },
      { speaker: 'Patient', de: 'Gibt es bestimmte Nebenwirkungen, auf die ich achten sollte? Ich muss nämlich morgens zur Arbeit fahren.', tr: 'Dikkat etmem gereken belirli yan etkiler var mı? Çünkü sabahları işe araba sürerek gitmem gerekiyor.' },
      { speaker: 'Arzt', de: 'Das Präparat macht in der Regel nicht müde. Sollten jedoch Magenschmerzen oder Hautausschlag auftreten, setzen Sie es bitte sofort ab und melden Sie sich.', tr: 'İlaç genelde uyku yapmaz. Ancak mide ağrısı veya cilt döküntüsü ortaya çıkarsa lütfen hemen bırakın ve bize haber verin.' },
    ],
    vocab: [
      { german: 'verschreiben', article: null, type: 'verb', tr: 'Reçete yazmak', note: 'Düzensiz: verschreibt / verschrieb / hat verschrieben.' },
      { german: 'Nebenwirkung', article: 'die', type: 'noun', tr: 'Yan etki', note: 'Plural: die Nebenwirkungen.' },
      { german: 'absetzen', article: null, type: 'verb', tr: 'İlacı kesmek, bırakmak', note: 'Ein Medikament absetzen — doktor bilgisiyle bırakmak.' },
      { german: 'entzündungshemmend', article: null, type: 'adjective', tr: 'İltihap giderici (antiinflamatuar)', note: 'Tıbbi reçetelerde çok sık geçen B2 sıfatı.' },
    ],
    quizzes: [
      {
        id: 'doc-5-q1',
        kind: 'comprehension',
        question: 'İlaç neden yemekten sonra alınmalıdır?',
        options: [
          'Daha hızlı uyku getirmesi için',
          'Midenin korunması için',
          'Tansiyonu yükseltmesi için',
          'Fizyoterapiden hemen önce alınması gerektiği için',
        ],
        correctIndex: 1,
        explanationTr: 'Doktor "...damit der Magen geschont wird" (midenin korunması için) diyerek yemekten sonra alınmasını öneriyor.',
      },
      {
        id: 'doc-5-q2',
        kind: 'grammar',
        question: '"___ jedoch Magenschmerzen auftreten, setzen Sie das Medikament sofort ab." — "Wenn" olmadan şart cümlesi başı hangisidir?',
        options: ['Sollten', 'Müssen', 'Wollen', 'Dürfen'],
        correctIndex: 0,
        explanationTr: 'B2 düzeyinde "Wenn" yerine fiilin başa alındığı "Sollten ... auftreten" (eğer ... ortaya çıkarsa) yapısı çok yaygındır.',
      },
    ],
  },
  {
    id: 'doc-6',
    title: 'Krankschreibung und Kontrolltermin',
    titleTr: 'İstirahat Raporu ve Kontrol Randevusu',
    category: 'Kontrol & Rapor',
    level: 'B2',
    summaryTr: 'Elektronik iş göremezlik raporu (eAU), işverene bildirim ve bir hafta sonraki kontrol randevusu.',
    lines: [
      { speaker: 'Arzt', de: 'Da Sie körperlich schwer arbeiten, schreibe ich Sie zunächst bis Freitag krank.', tr: 'Fiziksel olarak ağır çalıştığınız için sizi öncelikle cumaya kadar raporlu yazıyorum.' },
      { speaker: 'Patient', de: 'Muss ich die Arbeitsunfähigkeitsbescheinigung noch in Papierform bei meinem Arbeitgeber abgeben?', tr: 'İş göremezlik raporunu hâlâ kâğıt olarak işverenime teslim etmem gerekiyor mu?' },
      { speaker: 'Arzt', de: 'Nein, die elektronische AU wird direkt an Ihre Krankenkasse übermittelt. Sie müssen Ihren Arbeitgeber aber unverzüglich über die Dauer informieren.', tr: 'Hayır, elektronik rapor (eAU) doğrudan sağlık sigortanıza iletilir. Ancak işvereninizi süre hakkında derhâl bilgilendirmelisiniz.' },
      { speaker: 'Patient', de: 'Verstanden, ich rufe meinen Meister gleich an. Wann soll ich zur Nachkontrolle wiederkommen?', tr: 'Anlaşıldı, ustamı hemen ararım. Kontrol muayenesi için ne zaman tekrar geleyim?' },
      { speaker: 'Arzt', de: 'Vereinbaren Sie bitte vorne am Empfang einen Kontrolltermin für nächsten Montag. Gute Besserung!', tr: 'Lütfen öndeki danışmadan gelecek pazartesi için bir kontrol randevusu alın. Geçmiş olsun!' },
    ],
    vocab: [
      { german: 'Arbeitsunfähigkeitsbescheinigung', article: 'die', type: 'noun', tr: 'İş göremezlik raporu (AU)', note: 'Günlük dilde kısaca "AU" veya "Krankschreibung" denir.' },
      { german: 'unverzüglich', article: null, type: 'adverb', tr: 'Derhâl, gecikmeksizin', note: 'İş hukuku ve resmî metinlerde önemli B2/C1 zarfı.' },
      { german: 'Kontrolltermin', article: 'der', type: 'noun', tr: 'Kontrol randevusu', note: 'Plural: die Kontrolltermine.' },
      { german: 'übermitteln', article: null, type: 'verb', tr: 'İletmek, aktarmak (dijital/resmî)', note: 'Düzenli fiil: übermittelt / hat übermittelt.' },
    ],
    quizzes: [
      {
        id: 'doc-6-q1',
        kind: 'comprehension',
        question: 'Hastanın elektronik rapor (eAU) ile ilgili yapması gereken nedir?',
        options: [
          'Kâğıt raporu posta ile sigortaya göndermek',
          'İşverenini rapor süresi hakkında derhâl bilgilendirmek',
          'Raporu noterden onaylatmak',
          'Hiç kimseye haber vermemek',
        ],
        correctIndex: 1,
        explanationTr: 'eAU sigortaya dijital gider, ancak çalışan işverenini gecikmeden bilgilendirmekle yükümlüdür.',
      },
      {
        id: 'doc-6-q2',
        kind: 'grammar',
        question: '"Die elektronische AU ___ direkt an die Krankenkasse übermittelt." — Vorgangspassiv (edilgen çatı) hangisidir?',
        options: ['ist', 'hat', 'wird', 'wurde haben'],
        correctIndex: 2,
        explanationTr: 'Şimdiki zamanda edilgen çatı (Vorgangspassiv): "werden" (wird) + Partizip II (übermittelt).',
      },
    ],
  },
];

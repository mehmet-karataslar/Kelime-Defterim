export interface FormalRule {
  section: string;
  sectionTr: string;
  examplesDe: string[];
  examplesTr: string[];
  grammarTipTr: string;
}

export interface OfficialScenario {
  id: string;
  authority: string;
  title: string;
  titleTr: string;
  kind: 'email' | 'letter' | 'dialogue';
  level: 'B1.2';
  contextTr: string;
  germanText: string;
  turkishText: string;
  grammarNotes: string[];
  writingTaskTitle: string;
  writingTaskDesc: string;
}

export const FORMAL_WRITING_RULES: FormalRule[] = [
  {
    section: '1. Betreff (Konu Satırı)',
    sectionTr: 'Kısa, net ve dosya/müşteri numaralı konu başlığı',
    examplesDe: [
      'Antrag auf Verlängerung des Aufenthaltstitels – Aktenzeichen: 12345',
      'Bitte um Terminvereinbarung zur Anmeldung',
    ],
    examplesTr: [
      'Oturum izni uzatma başvurusu – Dosya No: 12345',
      'Adres kaydı için randevu talebi',
    ],
    grammarTipTr: 'Konu satırının sonuna nokta konmaz. Varsa Aktenzeichen (dosya no) veya Kundennummer mutlaka eklenir.',
  },
  {
    section: '2. Anrede (Hitap)',
    sectionTr: 'Resmî hitap ve virgül sonrası küçük harf kuralı',
    examplesDe: [
      'Sehr geehrte Damen und Herren,',
      'Sehr geehrte Frau Müller, / Sehr geehrter Herr Schmidt,',
    ],
    examplesTr: [
      'Sayın Yetkililer,',
      'Sayın Bayan Müller, / Sayın Bay Schmidt,',
    ],
    grammarTipTr: 'Hitaptan sonra virgül konur ve alt satırdaki ilk kelime (isim veya "Sie" değilse) KÜÇÜK harfle başlar: "hiermit beantrage ich..."',
  },
  {
    section: '3. Einleitung & Begründung (Giriş & Açıklama)',
    sectionTr: 'Yazma amacını ilk cümlede açıkça belirtme',
    examplesDe: [
      'ich schreibe Ihnen bezüglich meines Antrags vom 12.10.2026.',
      'hiermit möchte ich mich erkundigen, welche Unterlagen noch erforderlich sind.',
    ],
    examplesTr: [
      '12.10.2026 tarihli başvurumla ilgili size yazıyorum.',
      'Bu vesileyle hangi belgelerin hâlâ gerekli olduğunu öğrenmek istiyorum.',
    ],
    grammarTipTr: '"bezüglich + Genitiv" (-e ilişkin) ve "hiermit" (işbu yazıyla) B1.2/B2 resmî yazışmaların temel kalıplarıdır.',
  },
  {
    section: '4. Bitte & Frist (Talep & Tarih)',
    sectionTr: 'Konjunktiv II ile kibar ama net talep',
    examplesDe: [
      'Könnten Sie mir bitte bis zum 15.11. eine schriftliche Bestätigung zusenden?',
      'Ich bitte Sie um eine kurze Rückmeldung.',
    ],
    examplesTr: [
      'Bana 15.11 tarihine kadar yazılı bir onay gönderebilir misiniz?',
      'Sizden kısa bir geri dönüş rica ediyorum.',
    ],
    grammarTipTr: '"bitten um + Akkusativ" (-i rica etmek) ve "Könnten Sie..." yapısı resmî tonda emir kipinden çok daha etkilidir.',
  },
  {
    section: '5. Grußformel (Kapanış)',
    sectionTr: 'Standart kapanış ve imza',
    examplesDe: [
      'Vielen Dank im Voraus für Ihre Mühe.',
      'Mit freundlichen Grüßen\nMehmet Karataş',
    ],
    examplesTr: [
      'Emeğiniz için şimdiden çok teşekkür ederim.',
      'Saygılarımla\nMehmet Karataş',
    ],
    grammarTipTr: '"Mit freundlichen Grüßen" ifadesinden sonra Almancada VİRGÜL KONMAZ!',
  },
];

export const OFFICIAL_SCENARIOS: OfficialScenario[] = [
  {
    id: 'off-buergeramt',
    authority: 'Bürgeramt',
    title: 'Terminvereinbarung & Meldebescheinigung',
    titleTr: 'Adres Kaydı Randevusu ve İkametgâh Belgesi',
    kind: 'email',
    level: 'B1.2',
    contextTr: 'Yeni bir daireye taşındıktan sonra 14 gün içinde Bürgeramt’tan randevu ve Meldebescheinigung isteme.',
    germanText: `Betreff: Bitte um zeitnahen Termin zur Wohnsitzanmeldung

Sehr geehrte Damen und Herren,

ich bin am 01.11.2026 in eine neue Wohnung in Ihrem Bezirk umgezogen und möchte meinen Wohnsitz fristgerecht anmelden. Leider sind im Online-Portal derzeit keine freien Termine verfügbar.

Könnten Sie mir bitte einen zeitnahen Termin zuweisen? Die Wohnungsgeberbestätigung sowie meinen Reisepass habe ich bereits vollständig vorbereitet. Zudem benötige ich für meinen Ausbildungsbetrieb eine aktuelle Meldebescheinigung.

Für eine kurze Rückmeldung per E-Mail oder Telefon wäre ich Ihnen sehr dankbar.

Mit freundlichen Grüßen
Mehmet Karataş`,
    turkishText: `Konu: İkametgâh kaydı için yakın tarihli randevu talebi

Sayın Yetkililer,

01.11.2026 tarihinde bölgenizdeki yeni bir daireye taşındım ve ikametgâhımı süresi içinde kaydettirmek istiyorum. Ne yazık ki çevrim içi portalda şu anda boş randevu bulunmamaktadır.

Bana yakın tarihli bir randevu atayabilir misiniz? Ev sahibi onay belgesini (Wohnungsgeberbestätigung) ve pasaportumu eksiksiz olarak hazırladım. Ayrıca mesleki eğitim işletmem için güncel bir ikametgâh belgesine ihtiyacım var.

E-posta veya telefonla kısa bir geri dönüş yaparsanız size çok minnettar olurum.

Saygılarımla
Mehmet Karataş`,
    grammarNotes: [
      '"bin ... umgezogen" → umziehen (taşınmak) yer değişikliği olduğu için Perfekt’te "sein" ile çekilir.',
      '"fristgerecht" → yasal süresi içinde (Almanya’da taşınma sonrası 14 gün).',
      '"wäre ich Ihnen sehr dankbar" → Konjunktiv II ile çok kibar teşekkür/talep kalıbı.',
    ],
    writingTaskTitle: 'Bürgeramt’a Randevu Erteleme E-Postası Yaz',
    writingTaskDesc: 'Bürgeramt’taki adres kaydı randevunu iş yoğunluğu nedeniyle gelecek haftaya ertelemek ve yeni bir saat önermek için resmî bir e-posta yaz.',
  },
  {
    id: 'off-auslaender',
    authority: 'Ausländerbehörde',
    title: 'Aufenthaltstitel verlängern & Unterlagen nachreichen',
    titleTr: 'Oturum İzni Uzatma ve Eksik Belge İletme',
    kind: 'email',
    level: 'B1.2',
    contextTr: 'Mesleki eğitim (Ausbildung) oturum iznini uzatmak için başvuru yapma ve eksik belge gönderme.',
    germanText: `Betreff: Antrag auf Verlängerung meines Aufenthaltstitels – Aktenzeichen: ABH-48219

Sehr geehrte Frau Becker,

mein aktueller Aufenthaltstitel läuft am 31.01.2027 ab. Hiermit beantrage ich fristgerecht die Verlängerung meines Aufenthaltstitels zum Zweck der betrieblichen Berufsausbildung.

Im Anhang übersende ich Ihnen meinen aktuellen Ausbildungsvertrag, die letzten drei Gehaltsabrechnungen sowie die Bescheinigung meiner Krankenkasse. Sollten weitere Unterlagen erforderlich sein, reiche ich diese selbstverständlich umgehend nach.

Ich bitte Sie um die Zusendung einer Eingangsbestätigung sowie um einen Termin zur Vorsprache.

Mit freundlichen Grüßen
Mehmet Karataş`,
    turkishText: `Konu: Oturum iznimin uzatılması başvurusu – Dosya No: ABH-48219

Sayın Bayan Becker,

Mevcut oturum iznim 31.01.2027 tarihinde sona ermektedir. İşbu yazıyla mesleki eğitim amacıyla oturum iznimin süresi içinde uzatılmasını talep ediyorum.

Ekte güncel mesleki eğitim sözleşmemi, son üç maaş bordromu ve sağlık sigortası belgemi iletiyorum. Ek belgeler gerekirse bunları elbette derhâl tamamlayıp göndereceğim.

Başvurunun alındığına dair bir teyit ve yüz yüze görüşme için randevu gönderilmesini rica ediyorum.

Saygılarımla
Mehmet Karataş`,
    grammarNotes: [
      '"Im Anhang übersende ich Ihnen..." → Ekte size ... iletiyorum (resmî e-posta kalıbı).',
      '"nachreichen" → eksik belgeyi sonradan teslim etmek (ayrılabilir fiil: reiche ... nach).',
      '"Sollten weitere Unterlagen erforderlich sein, ..." → "Wenn" olmadan B1.2/B2 şart cümlesi.',
    ],
    writingTaskTitle: 'Ausländerbehörde’ye Eksik Belge Gönderme E-Postası',
    writingTaskDesc: 'Oturum izni dosyan için istenen yeni iş sözleşmesini ve kira sözleşmesini PDF ekinde gönderdiğini bildiren resmî bir e-posta yaz.',
  },
  {
    id: 'off-jobcenter',
    authority: 'Jobcenter',
    title: 'Rückfrage zum Bescheid & Weiterbildungsantrag',
    titleTr: 'Karar Yazısı Hakkında Bilgi ve Eğitim Talebi',
    kind: 'letter',
    level: 'B1.2',
    contextTr: 'Jobcenter’dan gelen karar hakkında bilgi isteme veya mesleki destek/dil kursu talebinde bulunma.',
    germanText: `Betreff: Rückfrage zu Ihrem Bescheid vom 05.11.2026 – Kundennummer: 904B112

Sehr geehrte Damen und Herren,

vielen Dank für Ihren Bescheid vom 05.11.2026. Nach sorgfältiger Prüfung ist mir aufgefallen, dass die Fahrtkosten für meinen Berufsschulweg noch nicht berücksichtigt wurden.

Ich möchte mich daher erkundigen, ob hierfür ein gesonderter Antrag gestellt werden muss. Gerne lege ich Ihnen die entsprechenden Nachweise und Fahrkarten vor.

Ich bitte um eine schriftliche Klärung und bedanke mich im Voraus für Ihre Unterstützung.

Mit freundlichen Grüßen
Mehmet Karataş`,
    turkishText: `Konu: 05.11.2026 tarihli karar yazınız hakkında soru – Müşteri No: 904B112

Sayın Yetkililer,

05.11.2026 tarihli karar yazınız için teşekkür ederim. Dikkatli inceleme sonucunda meslek okulu yol masraflarımın henüz hesaba katılmadığını fark ettim.

Bu nedenle bunun için ayrı bir başvuru yapılıp yapılmaması gerektiğini öğrenmek istiyorum. İlgili belgeleri ve biletleri memnuniyetle ibraz ederim.

Yazılı bir açıklama rica eder, desteğiniz için şimdiden teşekkür ederim.

Saygılarımla
Mehmet Karataş`,
    grammarNotes: [
      '"ist mir aufgefallen, dass..." → dikkatimi çekti / fark ettim ki... (auffallen + Dativ, Perfekt: sein).',
      '"berücksichtigt wurden" → Präteritum Passiv (hesaba katılmadı).',
      '"sich erkundigen, ob..." → ... olup olmadığını sormak/öğrenmek.',
    ],
    writingTaskTitle: 'Jobcenter’a Belge Talebi Yaz',
    writingTaskDesc: 'Jobcenter danışmanına B2 mesleki Almanca kursu için destek (Berechtigungsschein) talep eden kısa bir resmî yazı yaz.',
  },
  {
    id: 'off-finanzamt',
    authority: 'Finanzamt',
    title: 'Antrag auf Fristverlängerung (Steuererklärung)',
    titleTr: 'Vergi Beyannamesi Süre Uzatma Talebi',
    kind: 'letter',
    level: 'B1.2',
    contextTr: 'Finanzamt’tan vergi beyannamesi teslim tarihi için ek süre isteme.',
    germanText: `Betreff: Antrag auf Fristverlängerung für die Einkommensteuererklärung 2025 – Steuernummer: 12/345/67890

Sehr geehrte Damen und Herren,

hiermit beantrage ich eine Fristverlängerung für die Abgabe meiner Einkommensteuererklärung 2025 bis zum 30.09.2026.

Da mir einige wichtige Belege, insbesondere die Jahresbescheinigung meines ehemaligen Arbeitgebers, noch nicht vollständig vorliegen, ist es mir leider nicht möglich, die Erklärung fristgerecht einzureichen.

Ich bitte Sie, diesem Antrag stattzugeben, und danke Ihnen für Ihr Verständnis.

Mit freundlichen Grüßen
Mehmet Karataş`,
    turkishText: `Konu: 2025 gelir vergisi beyannamesi için süre uzatma talebi – Vergi No: 12/345/67890

Sayın Yetkililer,

İşbu yazıyla 2025 yılı gelir vergisi beyannamemin teslimi için 30.09.2026 tarihine kadar süre uzatımı talep ediyorum.

Başta eski işverenimin yıllık belgesi olmak üzere bazı önemli belgeler henüz eksiksiz olarak elime ulaşmadığı için beyannameyi süresi içinde teslim etmem ne yazık ki mümkün değildir.

Bu talebimi kabul etmenizi rica eder, anlayışınız için teşekkür ederim.

Saygılarımla
Mehmet Karataş`,
    grammarNotes: [
      '"Da mir ... nicht vorliegen, ..." → "Da" (çünkü/olduğu için) cümle başında sebep bildirir ve fiili sona atar.',
      '"einem Antrag stattgeben" → bir başvuruyu kabul etmek / onaylamak (Dativ).',
      '"einreichen" → resmî belge/beyanname sunmak.',
    ],
    writingTaskTitle: 'Finanzamt’a Vergi Numarası (Steuer-ID) Sorusu Yaz',
    writingTaskDesc: 'Yeni taşındığın için vergi kimlik numaranın (Steuer-ID) güncel adresine tekrar gönderilmesini talep eden resmî bir e-posta yaz.',
  },
  {
    id: 'off-krankenkasse',
    authority: 'Krankenkasse',
    title: 'Mitgliedsbescheinigung & Kostenübernahme',
    titleTr: 'Sigorta Üyelik Belgesi ve Tedavi Masrafı Onayı',
    kind: 'email',
    level: 'B1.2',
    contextTr: 'Sağlık sigortasından işveren için üyelik belgesi isteme veya fizyoterapi/kurs masrafı katılımını sorma.',
    germanText: `Betreff: Bitte um Mitgliedsbescheinigung – Versichertennummer: A123456789

Sehr geehrte Damen und Herren,

für meinen neuen Ausbildungsbetrieb benötige ich eine aktuelle Mitgliedsbescheinigung meiner gesetzlichen Krankenversicherung.

Außerdem möchte ich mich erkundigen, in welchem Umfang Sie die Kosten für einen zertifizierten Rückenkurs zur Prävention übernehmen. Über eine kurze schriftliche Information sowie die Zusendung der Bescheinigung per Post oder E-Mail würde ich mich sehr freuen.

Mit freundlichen Grüßen
Mehmet Karataş`,
    turkishText: `Konu: Üyelik belgesi talebi – Sigortalı No: A123456789

Sayın Yetkililer,

Yeni mesleki eğitim işletmem için yasal sağlık sigortama ait güncel bir üyelik belgesine ihtiyacım bulunmaktadır.

Ayrıca önleyici amaçlı sertifikalı bir sırt sağlığı kursunun masraflarını hangi ölçüde karşıladığınızı öğrenmek istiyorum. Kısa yazılı bir bilgilendirme ve belgenin posta veya e-posta ile gönderilmesi beni çok memnun edecektir.

Saygılarımla
Mehmet Karataş`,
    grammarNotes: [
      '"in welchem Umfang" → hangi kapsamda / ne ölçüde (resmî soru kalıbı).',
      '"Kosten übernehmen" → masrafları üstlenmek / karşılamak.',
      '"sich freuen über + Akkusativ" → bir şeye sevinmek (würde ich mich sehr freuen).',
    ],
    writingTaskTitle: 'Krankenkasse’ye Kart Yenileme Talebi Yaz',
    writingTaskDesc: 'Elektronik sağlık kartın (eGK) kaybolduğu için yeni kart ve geçici sigorta belgesi isteyen resmî bir e-posta yaz.',
  },
  {
    id: 'off-widerspruch',
    authority: 'Widerspruch (İtiraz)',
    title: 'Fristgerechter Widerspruch gegen einen Bescheid',
    titleTr: 'Resmî Bir Karara Süresi İçinde İtiraz Dilekçesi',
    kind: 'letter',
    level: 'B1.2',
    contextTr: 'Hatalı veya eksik bulunan bir resmî karara yasal 1 aylık süre içinde itiraz etme.',
    germanText: `Betreff: Widerspruch gegen Ihren Bescheid vom 10.11.2026 – Aktenzeichen: 774/2026

Sehr geehrte Damen und Herren,

hiermit lege ich fristgerecht Widerspruch gegen Ihren oben genannten Bescheid vom 10.11.2026 ein.

Begründung: In Ihrer Berechnung wurde mein tatsächliches monatliches Einkommen nicht korrekt berücksichtigt. Aus den beigefügten Gehaltsabrechnungen geht eindeutig hervor, dass der zugrunde gelegte Betrag zu hoch angesetzt wurde.

Ich bitte Sie daher, den Bescheid erneut zu prüfen und entsprechend zu korrigieren. Bitte bestätigen Sie mir den Eingang dieses Widerspruchs schriftlich.

Mit freundlichen Grüßen
Mehmet Karataş`,
    turkishText: `Konu: 10.11.2026 tarihli kararınıza itiraz – Dosya No: 774/2026

Sayın Yetkililer,

İşbu yazıyla yukarıda belirtilen 10.11.2026 tarihli kararınıza yasal süresi içinde itiraz ediyorum.

Gerekçe: Hesaplamanızda gerçek aylık gelirim doğru şekilde dikkate alınmamıştır. Ekteki maaş bordrolarından esas alınan tutarın gereğinden yüksek belirlendiği açıkça anlaşılmaktadır.

Bu nedenle kararı yeniden incelemenizi ve buna göre düzeltmenizi rica ediyorum. Lütfen bu itirazın tarafınıza ulaştığını yazılı olarak onaylayın.

Saygılarımla
Mehmet Karataş`,
    grammarNotes: [
      '"Widerspruch einlegen gegen + Akkusativ" → bir karara resmen itiraz etmek (ayrılabilir fiil: lege ... ein).',
      '"hervorgehen aus + Dativ" → ...-den açıkça anlaşılmak.',
      '"beigefügt" → ekte sunulan (Partizip II sıfat kullanımı).',
    ],
    writingTaskTitle: 'Hatalı Fatura / Karara İtiraz Yaz',
    writingTaskDesc: 'Yanlış hesaplanan bir ücret veya karar için gerekçeni açıklayan ve yeniden inceleme isteyen kısa bir itiraz (Widerspruch) metni yaz.',
  },
];

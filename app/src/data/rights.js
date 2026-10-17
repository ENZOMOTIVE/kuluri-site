// Rights & onboarding content for the worker app (EN / RO). General information, not legal advice.
// Sources: Directive (EU) 2019/1152 (written information on working conditions), Regulation (EU) 492/2011
// (equal treatment of EU workers), Directive 2014/36/EU (seasonal workers from outside the EU: equal treatment,
// decent accommodation), Directive 89/391/EEC (health and safety at no cost to the worker).

export const CHECKLIST = ['terms', 'written', 'documents', 'health', 'arrival', 'contacts']

export const rights = {
  en: {
    tab: 'Rights',
    title: 'Before you go',
    intro: 'Get ready for your job and know your rights. Everything here is in your language.',
    progress: '{d} of {n} done',
    nextJob: 'Your next job',
    openJob: 'Job details',
    askFarm: 'Ask the farm',
    check: {
      terms: ['Check pay, hours and housing', 'Compare the job terms with what you agreed in the chat.'],
      written: ['Ask for your terms in writing', 'The farm must give you your main terms in writing, at the latest in your first week.'],
      documents: ['Bring your ID and documents', 'ID or passport, and your work permit if you come from outside the EU.'],
      health: ['Health insurance', 'EU citizens: bring your European Health Insurance Card (EHIC).'],
      arrival: ['Know where to go', 'Check the meeting point and housing on the map before you travel.'],
      contacts: ['Save help contacts', 'Save 112 (emergency, free in the whole EU) and the contacts below.'],
    },
    rightsTitle: 'Your rights in the EU',
    rights: [
      ['o_description', 'Written terms', 'You get your pay, working hours, place of work and start date in writing.'],
      ['o_balance', 'Equal treatment', 'Workers from other EU countries get the same pay and conditions as local workers. Seasonal workers from outside the EU have equal treatment on pay and working conditions.'],
      ['o_home', 'Decent housing', 'If the farm arranges housing for seasonal workers from outside the EU, it must be decent and the rent must not be excessive.'],
      ['o_health_and_safety', 'Safety at no cost', 'Safety training and protective equipment must not cost you anything.'],
      ['o_money_off', 'Never pay for a job', 'Kuluri is free. Never pay anyone to get a job or a place on a bus.'],
    ],
    helpTitle: 'Where to get help',
    help: [
      ['o_sos', 'Emergency: 112', 'Free in the whole EU, also from a mobile phone without credit.'],
      ['o_flag', 'Report to Kuluri', 'Report a problem with hours, pay or housing. The farm does not see your name.'],
      ['o_gavel', 'Labour inspectorate', 'In Italy: Ispettorato Nazionale del Lavoro (INL).'],
      ['o_groups', 'Farm workers’ union', 'In Italy for example FLAI-CGIL, which advises seasonal farm workers.'],
      ['o_public', 'EURES', 'EU job mobility advisers, free advice on working in another EU country.'],
    ],
    note: 'General information, not legal advice. Rules differ by country – ask a union or the labour inspectorate for your case.',
    report: 'Report a problem',
  },
  ro: {
    tab: 'Drepturi',
    title: 'Înainte de plecare',
    intro: 'Pregătește-te pentru locul de muncă și cunoaște-ți drepturile. Totul este în limba ta.',
    progress: '{d} din {n} gata',
    nextJob: 'Următorul tău loc de muncă',
    openJob: 'Detalii job',
    askFarm: 'Întreabă ferma',
    check: {
      terms: ['Verifică plata, orele și cazarea', 'Compară condițiile jobului cu ce ați stabilit în chat.'],
      written: ['Cere condițiile în scris', 'Ferma trebuie să îți dea condițiile principale în scris, cel târziu în prima săptămână.'],
      documents: ['Ia actul de identitate și documentele', 'Buletin sau pașaport și permisul de muncă dacă vii din afara UE.'],
      health: ['Asigurarea de sănătate', 'Cetățenii UE: ia cu tine Cardul european de asigurări sociale de sănătate (CEASS).'],
      arrival: ['Știi unde să mergi', 'Verifică pe hartă punctul de întâlnire și cazarea înainte de plecare.'],
      contacts: ['Salvează contactele de ajutor', 'Salvează 112 (urgențe, gratuit în toată UE) și contactele de mai jos.'],
    },
    rightsTitle: 'Drepturile tale în UE',
    rights: [
      ['o_description', 'Condiții scrise', 'Primești în scris plata, programul, locul de muncă și data de început.'],
      ['o_balance', 'Tratament egal', 'Lucrătorii din alte țări UE primesc aceeași plată și aceleași condiții ca lucrătorii locali. Lucrătorii sezonieri din afara UE au tratament egal la plată și condiții de muncă.'],
      ['o_home', 'Cazare decentă', 'Dacă ferma asigură cazare lucrătorilor sezonieri din afara UE, aceasta trebuie să fie decentă, iar chiria nu trebuie să fie excesivă.'],
      ['o_health_and_safety', 'Siguranță fără costuri', 'Instruirea de siguranță și echipamentul de protecție nu trebuie să te coste nimic.'],
      ['o_money_off', 'Nu plăti niciodată pentru un job', 'Kuluri este gratuit. Nu plăti niciodată pe nimeni pentru un loc de muncă sau un loc în autobuz.'],
    ],
    helpTitle: 'Unde găsești ajutor',
    help: [
      ['o_sos', 'Urgențe: 112', 'Gratuit în toată UE, și de pe un telefon fără credit.'],
      ['o_flag', 'Raportează la Kuluri', 'Raportează o problemă cu orele, plata sau cazarea. Ferma nu îți vede numele.'],
      ['o_gavel', 'Inspecția muncii', 'În Italia: Ispettorato Nazionale del Lavoro (INL).'],
      ['o_groups', 'Sindicatul lucrătorilor agricoli', 'În Italia de exemplu FLAI-CGIL, care consiliază lucrătorii sezonieri.'],
      ['o_public', 'EURES', 'Consilieri UE pentru mobilitate, sfaturi gratuite despre munca în altă țară UE.'],
    ],
    note: 'Informații generale, nu consultanță juridică. Regulile diferă de la o țară la alta – întreabă un sindicat sau inspecția muncii pentru situația ta.',
    report: 'Raportează o problemă',
  },
}

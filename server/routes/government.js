import express from 'express';

const router = express.Router();

const governmentData = {
  folketing: {
    totalSeats: 179,
    note: 'Inkl. Grønland (2) og Færøerne (2). Baseret på valgresultat nov. 2022.',
    parties: [
      { abbr: 'A',  name: 'Socialdemokratiet',     seats: 50, color: '#E32D1C', group: 'coalition',        ideology: 'Socialdemokrati' },
      { abbr: 'V',  name: 'Venstre',               seats: 22, color: '#003F87', group: 'coalition',        ideology: 'Liberalkonservatisme' },
      { abbr: 'M',  name: 'Moderaterne',           seats: 16, color: '#6B3FA0', group: 'coalition',        ideology: 'Liberalisme, centrum' },
      { abbr: 'I',  name: 'Liberal Alliance',      seats: 22, color: '#00A0D6', group: 'opposition-right', ideology: 'Klassisk liberalisme' },
      { abbr: 'D',  name: 'Danmarksdemokraterne',  seats: 14, color: '#1B3A6B', group: 'opposition-right', ideology: 'National-konservatisme' },
      { abbr: 'F',  name: 'SF',                    seats: 15, color: '#E84B3A', group: 'opposition-left',  ideology: 'Socialistisk folkeparti' },
      { abbr: 'Ø',  name: 'Enhedslisten',          seats: 13, color: '#B22222', group: 'opposition-left',  ideology: 'Radikalt venstre' },
      { abbr: 'C',  name: 'Konservative',          seats: 10, color: '#006B3C', group: 'opposition-right', ideology: 'Konservatisme' },
      { abbr: 'B',  name: 'Radikale Venstre',      seats:  7, color: '#9B1EAD', group: 'opposition-left',  ideology: 'Socialliberalisme' },
      { abbr: 'O',  name: 'Dansk Folkeparti',      seats:  7, color: '#F4A82A', group: 'opposition-right', ideology: 'Højrepopulisme' },
      { abbr: 'Å',  name: 'Alternativet',          seats:  7, color: '#00C165', group: 'opposition-left',  ideology: 'Grøn politik' },
      { abbr: 'GL', name: 'Grønland & Færøerne',   seats:  4, color: '#888888', group: 'other',            ideology: 'Regionalt' }
    ]
  },
  government: {
    pm: { name: 'Mette Frederiksen', party: 'A', since: 'Juni 2026' },
    formed: 'Juni 2026',
    type: 'Regeringsdannelse (S/SF/M/RV foreloebigt)',
    ministers: [
      { name: 'Mette Frederiksen',      title: 'Statsminister',                            ministry: 'Statsministeriet',                           party: 'A' },
      { name: 'Lars Løkke Rasmussen',   title: 'Udenrigsminister',                         ministry: 'Udenrigsministeriet',                        party: 'M' },
      { name: 'Nicolai Wammen',         title: 'Finansminister',                           ministry: 'Finansministeriet',                          party: 'A' },
      { name: 'Peter Hummelgaard',      title: 'Beskæftigelsesminister',                   ministry: 'Beskæftigelsesministeriet',                  party: 'A' },
      { name: 'Magnus Heunicke',        title: 'Justitsminister',                          ministry: 'Justitsministeriet',                         party: 'A' },
      { name: 'Sophie Løhde',           title: 'Sundhedsminister',                        ministry: 'Sundhedsministeriet',                        party: 'V' },
      { name: 'Pio Carsten',            title: 'Forsvarsminister',                        ministry: 'Forsvarsministeriet',                        party: 'V' },
      { name: 'Troels Lund Poulsen',    title: 'Erhvervsminister',                        ministry: 'Erhvervsministeriet',                        party: 'V' },
      { name: 'Jakob Ellemann-Jensen',  title: 'Bæredygtighedsminister',                  ministry: 'Ministeriet for Klima, Energi og Forsyning', party: 'V' },
      { name: 'Kaare Dybvad Bek',       title: 'Indenrigs- og boligminister',             ministry: 'Indenrigs- og Boligministeriet',             party: 'A' },
      { name: 'Mattias Tesfaye',        title: 'Udlændinge- og integrationsminister',     ministry: 'Udlændinge- og Integrationsministeriet',     party: 'A' },
      { name: 'Pernille Rosenkrantz-Theil', title: 'Undervisningsminister',               ministry: 'Undervisningsministeriet',                   party: 'A' },
      { name: 'Christina Egelund',      title: 'Minister for forskning og uddannelse',    ministry: 'Uddannelses- og Forskningsministeriet',      party: 'M' },
      { name: 'Jeppe Bruus',            title: 'Skatteminister',                          ministry: 'Skatteministeriet',                          party: 'A' },
      { name: 'Rasmus Stoklund',        title: 'Transportminister',                       ministry: 'Transportministeriet',                       party: 'A' },
      { name: 'Simon Kollerup',         title: 'Erhvervs- og byggeminister',              ministry: 'Erhvervsministeriet',                        party: 'A' },
      { name: 'Jakob Jensen',           title: 'Landbrugs- og fødevareminister',          ministry: 'Ministeriet for Landbrug, Fødevarer og Fiskeri', party: 'V' }
    ],
    coalitionAgreement: {
      title: 'Ansvar for Danmark',
      keyPoints: [
        { icon: '🏥', area: 'Sundhed',          text: 'Historisk investering i sundhedsvæsenet med afskaffelse af det groteske minuts-tyranni og mere tid til patienter.' },
        { icon: '🌍', area: 'Klima',             text: 'Bindende 70%-målsætning for CO₂-reduktion i 2030, grøn omstilling af landbrug og energiforsyning.' },
        { icon: '🛡', area: 'Forsvar',           text: 'Forsvarsbudgettet hæves til 2% af BNP som svar på Ruslands invasion af Ukraine.' },
        { icon: '🎓', area: 'Uddannelse',        text: 'Investeringer i folkeskolen, krav om minimumsnormeringer i daginstitutioner og styrket erhvervsuddannelse.' },
        { icon: '🧑‍💼', area: 'Arbejdsmarked',   text: 'Øget arbejdsudbud, reform af dagpengesystemet og bedre integration af flygtninge på arbejdsmarkedet.' },
        { icon: '🏦', area: 'Økonomi',           text: 'Ansvarlig økonomisk politik med fokus på at overholde budgetlovens rammer og reducere statsgælden på sigt.' }
      ]
    }
  },
  formation: {
    status: 'active',
    headline: 'Regeringsgrundlag praesenteres 2. juni 2026',
    description: 'Statsministeriet har indkaldt til pressemoede paa Marienborg med Mette Frederiksen (S), Pia Olsen Dyhr (SF), Lars Loekke Rasmussen (M) og Martin Lidegaard (RV). Ministerliste og endeligt regeringsgrundlag opdateres, naar de officielle dokumenter er publiceret.',
    lastUpdated: '2026-06-02',
    note: 'Foreloebig status baseret paa Statsministeriets pressemeddelelse.',
    timeline: [
      { label: 'Valg afholdt',                  date: '2025',          status: 'done'   },
      { label: 'Mandatfordeling opgjort',        date: '2025',          status: 'done'   },
      { label: 'Forhandlingsleder udpeget',      date: 'Forår 2026',    status: 'done'   },
      { label: 'Koalitionsforhandlinger',        date: 'Maj 2026',      status: 'done'   },
      { label: 'Koalitionsaftale underskrevet',  date: '1. juni 2026',  status: 'done'   },
      { label: 'Ny regering præsenteret',        date: '2. juni 2026',  status: 'active' }
    ],
    partiesInTalks: ['A', 'F', 'M', 'B'],
    sources: ['Statsministeriet.dk', 'ft.dk']
  },
  sources: [
    { label: 'Folketinget', scope: 'Mandater, partier og regeringsperioder', url: 'https://www.ft.dk/' },
    { label: 'Statsministeriet', scope: 'Regeringsdannelse og regeringsgrundlag', url: 'https://www.stm.dk/' },
    { label: 'Finansministeriet', scope: 'Finanslov, fremskrivninger og reformeffekter', url: 'https://fm.dk/' },
    { label: 'DREAM-gruppen', scope: 'Langsigtede makro- og befolkningsfremskrivninger', url: 'https://dreamgruppen.dk/' },
    { label: 'Danmarks Statistik', scope: 'Befolkning, arbejdsmarked, BNP og offentlige finanser', url: 'https://www.dst.dk/' }
  ],
  modelCalibration: {
    framework: 'DREAM/MAKRO-screening',
    note: 'Nyheder annoteres kun med et DREAM/MAKRO-estimat, naar teksten peger paa en finanspolitisk, arbejdsudbuds-, demografi-, klima- eller investeringskanal.',
    channels: [
      { key: 'arbejdsudbud', label: 'Arbejdsudbud', horizon: '2026-2035' },
      { key: 'offentlig_saldo', label: 'Offentlig saldo', horizon: '2026-2030' },
      { key: 'bnp', label: 'BNP-effekt', horizon: 'kort og mellemlang sigt' },
      { key: 'co2', label: 'CO2', horizon: '2030' }
    ]
  },
  historicalGovernments: [
    {
      id: 's-sf-r-2011',
      name: 'Thorning-Schmidt I',
      years: '2011-2014',
      pm: 'Helle Thorning-Schmidt',
      parties: ['A', 'F', 'B'],
      type: 'Mindretalsregering',
      agreement: 'Et Danmark der staar sammen',
      priorities: ['Velfaerd', 'Uddannelse', 'Skat', 'Klima'],
      profile: { tax: 68, welfare: 82, climate: 75, immigration: 38, defense: 36, labor: 55 }
    },
    {
      id: 'v-2015',
      name: 'Lars Loekke Rasmussen II',
      years: '2015-2016',
      pm: 'Lars Loekke Rasmussen',
      parties: ['V'],
      type: 'Mindretalsregering',
      agreement: 'Sammen for fremtiden',
      priorities: ['Skat', 'Erhverv', 'Udlaendinge', 'Landdistrikter'],
      profile: { tax: 34, welfare: 48, climate: 45, immigration: 76, defense: 58, labor: 70 }
    },
    {
      id: 'v-la-k-2016',
      name: 'Lars Loekke Rasmussen III',
      years: '2016-2019',
      pm: 'Lars Loekke Rasmussen',
      parties: ['V', 'I', 'C'],
      type: 'Mindretalsregering',
      agreement: 'For et friere, rigere og tryggere Danmark',
      priorities: ['Skat', 'Forsvar', 'Erhverv', 'Udlaendinge'],
      profile: { tax: 25, welfare: 42, climate: 42, immigration: 78, defense: 70, labor: 74 }
    },
    {
      id: 's-2019',
      name: 'Frederiksen I',
      years: '2019-2022',
      pm: 'Mette Frederiksen',
      parties: ['A'],
      type: 'Mindretalsregering',
      agreement: 'Retfaerdig retning for Danmark',
      priorities: ['Velfaerd', 'Klima', 'Uddannelse', 'Arbejdsmarked'],
      profile: { tax: 63, welfare: 83, climate: 82, immigration: 66, defense: 52, labor: 58 }
    },
    {
      id: 's-v-m-2022',
      name: 'Frederiksen II',
      years: '2022-2026',
      pm: 'Mette Frederiksen',
      parties: ['A', 'V', 'M'],
      type: 'Flertalsregering',
      agreement: 'Ansvar for Danmark',
      priorities: ['Arbejdsudbud', 'Forsvar', 'Sundhed', 'Klima'],
      profile: { tax: 48, welfare: 66, climate: 68, immigration: 66, defense: 82, labor: 78 }
    },
    {
      id: 's-sf-m-rv-2026',
      name: 'Ny regeringsdannelse',
      years: '2026-',
      pm: 'Mette Frederiksen',
      parties: ['A', 'F', 'M', 'B'],
      type: 'Forhandling',
      agreement: 'Afventer officielt regeringsgrundlag',
      priorities: ['Velfaerd', 'Klima', 'Arbejdsudbud', 'Uddannelse'],
      profile: { tax: 58, welfare: 78, climate: 82, immigration: 56, defense: 70, labor: 68 }
    }
  ],
  partyProfiles: [
    {
      abbr: 'A', name: 'Socialdemokratiet', color: '#E32D1C',
      leader: 'Mette Frederiksen', tagline: 'En fair og ansvarlig velfærdsstat',
      keyIssues: {
        tax:         { label: 'Skat',          stance: 'center-left' },
        welfare:     { label: 'Velfærd',       stance: 'left' },
        climate:     { label: 'Klima',         stance: 'center-left' },
        immigration: { label: 'Indvandring',   stance: 'right' },
        defense:     { label: 'Forsvar',       stance: 'center-right' },
        pension:     { label: 'Pension',       stance: 'center-left' }
      }
    },
    {
      abbr: 'V', name: 'Venstre', color: '#003F87',
      leader: 'Troels Lund Poulsen', tagline: 'Danmark i vækst og balance',
      keyIssues: {
        tax:         { label: 'Skat',          stance: 'right' },
        welfare:     { label: 'Velfærd',       stance: 'center' },
        climate:     { label: 'Klima',         stance: 'center' },
        immigration: { label: 'Indvandring',   stance: 'right' },
        defense:     { label: 'Forsvar',       stance: 'right' },
        pension:     { label: 'Pension',       stance: 'center-right' }
      }
    },
    {
      abbr: 'M', name: 'Moderaterne', color: '#6B3FA0',
      leader: 'Lars Løkke Rasmussen', tagline: 'Fornuftens vej frem',
      keyIssues: {
        tax:         { label: 'Skat',          stance: 'center-right' },
        welfare:     { label: 'Velfærd',       stance: 'center' },
        climate:     { label: 'Klima',         stance: 'center-left' },
        immigration: { label: 'Indvandring',   stance: 'center-right' },
        defense:     { label: 'Forsvar',       stance: 'right' },
        pension:     { label: 'Pension',       stance: 'center' }
      }
    },
    {
      abbr: 'I', name: 'Liberal Alliance', color: '#00A0D6',
      leader: 'Alex Vanopslagh', tagline: 'Mere frihed, lavere skat',
      keyIssues: {
        tax:         { label: 'Skat',          stance: 'far-right' },
        welfare:     { label: 'Velfærd',       stance: 'right' },
        climate:     { label: 'Klima',         stance: 'right' },
        immigration: { label: 'Indvandring',   stance: 'center-right' },
        defense:     { label: 'Forsvar',       stance: 'right' },
        pension:     { label: 'Pension',       stance: 'right' }
      }
    },
    {
      abbr: 'D', name: 'Danmarksdemokraterne', color: '#1B3A6B',
      leader: 'Inger Støjberg', tagline: 'Danmark for danskerne',
      keyIssues: {
        tax:         { label: 'Skat',          stance: 'center' },
        welfare:     { label: 'Velfærd',       stance: 'center-left' },
        climate:     { label: 'Klima',         stance: 'right' },
        immigration: { label: 'Indvandring',   stance: 'far-right' },
        defense:     { label: 'Forsvar',       stance: 'right' },
        pension:     { label: 'Pension',       stance: 'center-left' }
      }
    },
    {
      abbr: 'F', name: 'SF', color: '#E84B3A',
      leader: 'Pia Olsen Dyhr', tagline: 'Grøn velfærd og social retfærdighed',
      keyIssues: {
        tax:         { label: 'Skat',          stance: 'far-left' },
        welfare:     { label: 'Velfærd',       stance: 'far-left' },
        climate:     { label: 'Klima',         stance: 'far-left' },
        immigration: { label: 'Indvandring',   stance: 'left' },
        defense:     { label: 'Forsvar',       stance: 'left' },
        pension:     { label: 'Pension',       stance: 'left' }
      }
    },
    {
      abbr: 'Ø', name: 'Enhedslisten', color: '#B22222',
      leader: 'Mai Villadsen', tagline: 'En rød og grøn fremtid',
      keyIssues: {
        tax:         { label: 'Skat',          stance: 'far-left' },
        welfare:     { label: 'Velfærd',       stance: 'far-left' },
        climate:     { label: 'Klima',         stance: 'far-left' },
        immigration: { label: 'Indvandring',   stance: 'far-left' },
        defense:     { label: 'Forsvar',       stance: 'far-left' },
        pension:     { label: 'Pension',       stance: 'far-left' }
      }
    },
    {
      abbr: 'C', name: 'Konservative', color: '#006B3C',
      leader: 'Søren Pape Poulsen', tagline: 'Orden, frihed og ansvar',
      keyIssues: {
        tax:         { label: 'Skat',          stance: 'right' },
        welfare:     { label: 'Velfærd',       stance: 'center-right' },
        climate:     { label: 'Klima',         stance: 'center-right' },
        immigration: { label: 'Indvandring',   stance: 'right' },
        defense:     { label: 'Forsvar',       stance: 'far-right' },
        pension:     { label: 'Pension',       stance: 'center-right' }
      }
    },
    {
      abbr: 'B', name: 'Radikale Venstre', color: '#9B1EAD',
      leader: 'Martin Lidegaard', tagline: 'Frihed, mangfoldighed og grøn vækst',
      keyIssues: {
        tax:         { label: 'Skat',          stance: 'center-left' },
        welfare:     { label: 'Velfærd',       stance: 'center-left' },
        climate:     { label: 'Klima',         stance: 'left' },
        immigration: { label: 'Indvandring',   stance: 'far-left' },
        defense:     { label: 'Forsvar',       stance: 'center' },
        pension:     { label: 'Pension',       stance: 'center-left' }
      }
    },
    {
      abbr: 'O', name: 'Dansk Folkeparti', color: '#F4A82A',
      leader: 'Morten Messerschmidt', tagline: 'Danmark og danskernes parti',
      keyIssues: {
        tax:         { label: 'Skat',          stance: 'center-left' },
        welfare:     { label: 'Velfærd',       stance: 'center-left' },
        climate:     { label: 'Klima',         stance: 'right' },
        immigration: { label: 'Indvandring',   stance: 'far-right' },
        defense:     { label: 'Forsvar',       stance: 'right' },
        pension:     { label: 'Pension',       stance: 'left' }
      }
    },
    {
      abbr: 'Å', name: 'Alternativet', color: '#00C165',
      leader: 'Torsten Gejl', tagline: 'Et grønnere og mere retfærdigt samfund',
      keyIssues: {
        tax:         { label: 'Skat',          stance: 'far-left' },
        welfare:     { label: 'Velfærd',       stance: 'far-left' },
        climate:     { label: 'Klima',         stance: 'far-left' },
        immigration: { label: 'Indvandring',   stance: 'far-left' },
        defense:     { label: 'Forsvar',       stance: 'left' },
        pension:     { label: 'Pension',       stance: 'far-left' }
      }
    }
  ]
};

router.get('/data', (req, res) => {
  res.json(governmentData);
});

export default router;

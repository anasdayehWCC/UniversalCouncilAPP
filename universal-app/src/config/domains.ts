export type ServiceDomain = 'children' | 'adults' | 'housing' | 'corporate';
export type UserRole = 'social_worker' | 'manager' | 'admin' | 'housing_officer';

export interface DomainConfig {
  id: ServiceDomain;
  name: string;
  authorityLabel: string;
  personaLabel: string;
  theme: {
    primary: string;
    accent: string;
    gradient: string;
  };
}

export const DOMAINS: Record<ServiceDomain, DomainConfig> = {
  children: {
    id: 'children',
    name: 'Children\'s Social Care',
    authorityLabel: 'Westminster City Council',
    personaLabel: 'Westminster • Children',
    theme: {
      primary: '#211551', // Westminster "Night" deep blue
      accent: '#9D581F', // Copper accent
      gradient: 'linear-gradient(135deg, #211551 0%, #3E2A88 100%)', // Deep blue to violet
    },
    // nav handled in navigation config
  },
  adults: {
    id: 'adults',
    name: 'Adult Social Care',
    authorityLabel: 'Bi-borough: Westminster & RBKC',
    personaLabel: 'RBKC • Adults',
    theme: {
      primary: '#014363', // RBKC Astronaut Blue
      accent: '#A2CDE0', // RBKC light blue
      gradient: 'linear-gradient(135deg, #014363 0%, #026491 100%)', // Deep teal to lighter teal
    },
    // nav handled in navigation config
  },
  housing: {
    id: 'housing',
    name: 'Housing Directorate',
    authorityLabel: 'Royal Borough of Kensington & Chelsea',
    personaLabel: 'RBKC • Housing',
    theme: {
      primary: '#F28E00', // WCC Orange
      accent: '#3BA08D', // WCC Teal
      gradient: 'linear-gradient(135deg, #F28E00 0%, #FFB347 100%)', // Orange to lighter orange
    },
    // nav handled in navigation config
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate Services',
    authorityLabel: 'Westminster City Council',
    personaLabel: 'Westminster • Corporate',
    theme: {
      primary: '#333333', // Neutral for corporate
      accent: '#666666',
      gradient: 'linear-gradient(135deg, #333333 0%, #555555 100%)', // Dark grey to lighter grey
    },
  },
};

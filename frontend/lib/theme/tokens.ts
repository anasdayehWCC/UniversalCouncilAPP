export type Role = 'social_worker' | 'manager' | 'admin';
export type Domain = 'childrens' | 'adults';

export interface ThemeColors {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    border: string;
    input: string;
    ring: string;
}

export interface Theme {
    name: string;
    colors: ThemeColors;
}

export const themes: Record<Role, Theme> = {
    social_worker: {
        name: 'Social Worker',
        colors: {
            primary: '221.2 83.2% 53.3%', // Blue 600
            primaryForeground: '210 40% 98%',
            secondary: '210 40% 96.1%',
            secondaryForeground: '222.2 47.4% 11.2%',
            accent: '199 89% 48%', // Sky 600
            accentForeground: '210 40% 98%',
            background: '0 0% 100%',
            foreground: '222.2 84% 4.9%',
            card: '0 0% 100%',
            cardForeground: '222.2 84% 4.9%',
            border: '214.3 31.8% 91.4%',
            input: '214.3 31.8% 91.4%',
            ring: '221.2 83.2% 53.3%',
        },
    },
    manager: {
        name: 'Manager',
        colors: {
            primary: '262.1 83.3% 57.8%', // Purple 600
            primaryForeground: '210 40% 98%',
            secondary: '210 40% 96.1%',
            secondaryForeground: '222.2 47.4% 11.2%',
            accent: '291 47% 51%', // Fuchsia 600
            accentForeground: '210 40% 98%',
            background: '0 0% 100%',
            foreground: '222.2 84% 4.9%',
            card: '0 0% 100%',
            cardForeground: '222.2 84% 4.9%',
            border: '214.3 31.8% 91.4%',
            input: '214.3 31.8% 91.4%',
            ring: '262.1 83.3% 57.8%',
        },
    },
    admin: {
        name: 'Admin',
        colors: {
            primary: '24.6 95% 53.1%', // Orange 500
            primaryForeground: '60 9.1% 97.8%',
            secondary: '60 4.8% 95.9%',
            secondaryForeground: '24 9.8% 10%',
            accent: '12 76% 61%', // Red-Orange
            accentForeground: '60 9.1% 97.8%',
            background: '0 0% 100%',
            foreground: '20 14.3% 4.1%',
            card: '0 0% 100%',
            cardForeground: '20 14.3% 4.1%',
            border: '20 5.9% 90%',
            input: '20 5.9% 90%',
            ring: '24.6 95% 53.1%',
        },
    },
};

export const getThemeForRole = (role: Role): Theme => {
    return themes[role] || themes.social_worker;
};

import { create } from 'zustand';

type ThemeState = {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
    theme: (localStorage.getItem('orbit-theme') as 'light' | 'dark') || 'light',
    toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('orbit-theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return { theme: newTheme };
    }),
    setTheme: (theme) => set(() => {
        localStorage.setItem('orbit-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return { theme };
    }),
}));

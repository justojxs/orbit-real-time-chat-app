import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center text-gray-400 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-white group z-50 shadow-sm"
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                <Sun size={20} className="text-zinc-400 group-hover:text-amber-400 transition-colors" />
            ) : (
                <Moon size={20} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
            )}
        </button>
    );
};

export default ThemeToggle;

import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <button
            onClick={toggleTheme}
            className={`
                relative p-2.5 rounded-full flex items-center justify-center transition-all duration-500 z-50 shadow-sm overflow-hidden group
                ${theme === 'dark'
                    ? 'bg-[#181820] border border-white/10 hover:bg-[#1a1a24] text-zinc-400 hover:text-white'
                    : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-900'
                }
            `}
            aria-label="Toggle Theme"
        >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full ${theme === 'dark' ? 'bg-gradient-to-tr from-emerald-500/10 to-teal-500/10' : 'bg-gradient-to-tr from-emerald-500/5 to-teal-500/5'}`} />

            <div className="relative z-10 transition-transform duration-500 group-hover:scale-110">
                {theme === 'dark' ? (
                    <Sun size={20} className="text-zinc-400 group-hover:text-amber-400 transition-colors" />
                ) : (
                    <Moon size={20} className="text-gray-500 group-hover:text-indigo-500 transition-colors" />
                )}
            </div>
        </button>
    );
};

export default ThemeToggle;

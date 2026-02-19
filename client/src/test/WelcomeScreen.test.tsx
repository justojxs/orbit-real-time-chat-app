import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WelcomeScreen from '../components/WelcomeScreen';

// Mock components that might be problematic or not needed for this test
vi.mock('../components/miscellaneous/GroupChatModal', () => ({
    default: ({ children }: any) => <div>{children}</div>
}));

describe('WelcomeScreen', () => {
    it('renders the branding elements', () => {
        render(<WelcomeScreen />);
        expect(screen.getByText(/Orbit/i)).toBeInTheDocument();
        expect(screen.getByText(/Seamless Messaging Platform/i)).toBeInTheDocument();
    });

    it('displays the logo with correct alt text', () => {
        render(<WelcomeScreen />);
        const logo = screen.getByAltText(/Orbit Logo/i);
        expect(logo).toBeInTheDocument();
    });
});

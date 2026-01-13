import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from './RegisterForm';
import { strapiApi } from '@/lib/api/strapi';

// Mock the modules
vi.mock('@/lib/api/strapi', () => ({
  strapiApi: {
    post: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business license/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('displays error when passwords do not match', async () => {
    render(<RegisterForm />);

    // Fill all required fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Test Co' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '5551234567' } });
    fireEvent.change(screen.getByLabelText(/business license/i), { target: { value: 'LIC123' } });
    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'test@test.com' } });

    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'different' },
    });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('displays error when password is too short', async () => {
    render(<RegisterForm />);

    // Fill all required fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Test Co' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '5551234567' } });
    fireEvent.change(screen.getByLabelText(/business license/i), { target: { value: 'LIC123' } });
    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'test@test.com' } });

    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: '12345' },
    });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('displays error when phone is too short', async () => {
    render(<RegisterForm />);

    // Fill all required fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Test Co' } });
    fireEvent.change(screen.getByLabelText(/business license/i), { target: { value: 'LIC123' } });
    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'test@test.com' } });

    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockPost = vi.mocked(strapiApi.post);
    mockPost.mockResolvedValueOnce({ data: { jwt: 'test-token', user: {} } });

    render(<RegisterForm />);

    // Fill all required fields
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Test Cannabis Co' },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '5551234567' },
    });
    fireEvent.change(screen.getByLabelText(/business license/i), {
      target: { value: 'LIC12345' },
    });
    fireEvent.change(screen.getByLabelText(/^username/i), {
      target: { value: 'johndoe' },
    });
    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'john@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/auth/local/register', {
        username: 'johndoe',
        email: 'john@test.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Test Cannabis Co',
        phone: '5551234567',
        businessLicense: 'LIC12345',
      });
    });
  });

  it('displays API error message on registration failure', async () => {
    const mockPost = vi.mocked(strapiApi.post);
    mockPost.mockRejectedValueOnce({
      response: {
        data: {
          error: {
            message: 'Email already exists',
          },
        },
      },
    });

    render(<RegisterForm />);

    // Fill all required fields
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/company name/i), {
      target: { value: 'Test Cannabis Co' },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '5551234567' },
    });
    fireEvent.change(screen.getByLabelText(/business license/i), {
      target: { value: 'LIC12345' },
    });
    fireEvent.change(screen.getByLabelText(/^username/i), {
      target: { value: 'johndoe' },
    });
    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'john@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('disables form fields while submitting', async () => {
    const mockPost = vi.mocked(strapiApi.post);
    mockPost.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<RegisterForm />);

    // Fill all required fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Test Co' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '5551234567' } });
    fireEvent.change(screen.getByLabelText(/business license/i), { target: { value: 'LIC123' } });
    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeDisabled();
      expect(screen.getByLabelText(/last name/i)).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });
});

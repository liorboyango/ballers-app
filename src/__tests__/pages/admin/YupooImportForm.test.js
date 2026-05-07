/**
 * Tests for the YupooImportPage crawl form (Stage 2: Review & Configure).
 * Covers:
 * - Form renders with defaults
 * - Validation prevents submission when price is 0
 * - Validation prevents submission when no sizes selected
 * - Confirmation dialog shown before import starts
 * - Successful submission calls crawlCategories API
 * - Error state displayed when API fails
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastContext } from '../../../context/ToastContext';
import * as yupooApi from '../../../services/yupooApi';

// Mock the API module
jest.mock('../../../services/yupooApi', () => ({
  getYupooCategories: jest.fn(),
  crawlCategories: jest.fn(),
}));

// Helper: render YupooImportPage with required providers
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

const renderPage = async () => {
  // Dynamically import to avoid issues with module-level side effects
  const { default: YupooImportPage } = await import(
    '../../../pages/admin/YupooImportPage'
  );

  return render(
    <MemoryRouter>
      <ToastContext.Provider value={{ toast: mockToast }}>
        <YupooImportPage />
      </ToastContext.Provider>
    </MemoryRouter>
  );
};

const MOCK_CATEGORIES = [
  {
    id: '123',
    name: 'La Liga',
    path: '/categories/123',
    itemCount: 3,
    subcategories: [
      { id: '456', name: 'Real Madrid', path: '/categories/456', subcategories: [] },
      { id: '789', name: 'Barcelona', path: '/categories/789', subcategories: [] },
    ],
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  yupooApi.getYupooCategories.mockResolvedValue({
    categories: MOCK_CATEGORIES,
    cached: false,
    cachedAt: new Date().toISOString(),
  });
  // Clear sessionStorage between tests
  sessionStorage.clear();
});

describe('YupooImportPage — Review Form (Stage 2)', () => {
  it('renders the category tree in stage 1 after fetching', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByText('La Liga')).toBeInTheDocument();
    });
  });

  it('proceeds to Review stage when categories are selected and button clicked', async () => {
    await renderPage();
    await waitFor(() => screen.getByText('La Liga'));

    // Select the La Liga category
    const checkbox = screen.getByRole('checkbox', { name: /select la liga/i });
    fireEvent.click(checkbox);

    // Click Review & Import
    const reviewBtn = screen.getByRole('button', { name: /review.*import/i });
    fireEvent.click(reviewBtn);

    // Should now be on review stage
    await waitFor(() => {
      expect(screen.getByRole('form', { name: /import configuration form/i })).toBeInTheDocument();
    });
  });

  it('shows validation error when price is 0 and form submitted', async () => {
    await renderPage();
    await waitFor(() => screen.getByText('La Liga'));

    // Select La Liga
    const checkbox = screen.getByRole('checkbox', { name: /select la liga/i });
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: /review.*import/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/default price/i)).toBeInTheDocument();
    });

    // Set price to 0 (invalid)
    const priceInput = screen.getByLabelText(/default price/i);
    fireEvent.change(priceInput, { target: { value: '0' } });

    // Try to submit
    const submitBtn = screen.getByRole('button', { name: /start import/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/price must be greater than 0/i)).toBeInTheDocument();
    });

    // Confirm dialog should NOT appear
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows validation error when no sizes are selected', async () => {
    await renderPage();
    await waitFor(() => screen.getByText('La Liga'));

    const checkbox = screen.getByRole('checkbox', { name: /select la liga/i });
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: /review.*import/i }));

    await waitFor(() => screen.getByLabelText(/default price/i));

    // Deselect all sizes (default has S, M, L, XL, XXL selected)
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    for (const size of sizes) {
      const sizeBtn = screen.getByRole('button', { name: size });
      if (sizeBtn.getAttribute('aria-pressed') === 'true') {
        fireEvent.click(sizeBtn);
      }
    }

    fireEvent.click(screen.getByRole('button', { name: /start import/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/at least one size must be selected/i)
      ).toBeInTheDocument();
    });
  });

  it('shows confirmation dialog when form is valid and submitted', async () => {
    await renderPage();
    await waitFor(() => screen.getByText('La Liga'));

    const checkbox = screen.getByRole('checkbox', { name: /select la liga/i });
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: /review.*import/i }));

    await waitFor(() => screen.getByLabelText(/default price/i));

    // Submit with valid defaults
    fireEvent.click(screen.getByRole('button', { name: /start import/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /start import/i })).toBeInTheDocument();
    });
  });

  it('calls crawlCategories API when user confirms import in dialog', async () => {
    yupooApi.crawlCategories.mockResolvedValue({
      created: 5,
      skipped: 0,
      ids: ['1', '2', '3', '4', '5'],
      errors: [],
    });

    await renderPage();
    await waitFor(() => screen.getByText('La Liga'));

    const checkbox = screen.getByRole('checkbox', { name: /select la liga/i });
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: /review.*import/i }));

    await waitFor(() => screen.getByLabelText(/default price/i));

    fireEvent.click(screen.getByRole('button', { name: /start import/i }));

    await waitFor(() => screen.getByRole('dialog'));

    // Confirm the dialog
    const confirmBtn = screen.getByRole('button', { name: /start import/i, hidden: false });
    // Get the confirm button inside the dialog (not the form submit)
    const dialogEl = screen.getByRole('dialog');
    const dialogConfirmBtn = dialogEl.querySelector('button:last-child');
    fireEvent.click(dialogConfirmBtn);

    await waitFor(() => {
      expect(yupooApi.crawlCategories).toHaveBeenCalledTimes(1);
    });

    const callArgs = yupooApi.crawlCategories.mock.calls[0];
    expect(Array.isArray(callArgs[0])).toBe(true); // selectedCategories is array
    expect(callArgs[1]).toMatchObject({
      price: expect.any(Number),
      kitType: expect.any(String),
      stock: expect.any(Number),
      sizes: expect.any(Array),
    });
  });

  it('shows success toast after successful import', async () => {
    yupooApi.crawlCategories.mockResolvedValue({
      created: 3,
      skipped: 0,
      ids: ['a', 'b', 'c'],
      errors: [],
    });

    await renderPage();
    await waitFor(() => screen.getByText('La Liga'));

    const checkbox = screen.getByRole('checkbox', { name: /select la liga/i });
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: /review.*import/i }));
    await waitFor(() => screen.getByLabelText(/default price/i));
    fireEvent.click(screen.getByRole('button', { name: /start import/i }));
    await waitFor(() => screen.getByRole('dialog'));

    const dialogEl = screen.getByRole('dialog');
    const confirmBtn = dialogEl.querySelector('button:last-child');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining('3 products created')
      );
    });
  });

  it('shows error toast when API call fails', async () => {
    yupooApi.crawlCategories.mockRejectedValue({
      message: 'Network error',
    });

    await renderPage();
    await waitFor(() => screen.getByText('La Liga'));

    const checkbox = screen.getByRole('checkbox', { name: /select la liga/i });
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: /review.*import/i }));
    await waitFor(() => screen.getByLabelText(/default price/i));
    fireEvent.click(screen.getByRole('button', { name: /start import/i }));
    await waitFor(() => screen.getByRole('dialog'));

    const dialogEl = screen.getByRole('dialog');
    const confirmBtn = dialogEl.querySelector('button:last-child');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
  });
});
